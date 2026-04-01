import mealsData from '@/data/meals.json';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { getMealHistory, saveMealHistory } from '@/constants/api';
import { CATEGORY_LABELS, CATEGORY_ORDER, getMealEmoji } from '@/constants/meals';
import { Meal, MealCategory, useMealPlan } from '@/contexts/meal-plan-context';
import { useProfile } from '@/contexts/profile-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';

interface MealsFile {
  meals: Meal[];
}

type Gender = 'male' | 'female' | 'other';

const CALORIE_SPLIT: Record<MealCategory, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};
// Sedentary-to-lightly-active multiplier applied to BMR (Mifflin-St Jeor)
const ACTIVITY_FACTOR = 1.35;
// Daily kcal deficit required to lose ~0.5 kg/week (standard clinical guideline)
const WEIGHT_LOSS_DEFICIT = 500;

const MEALS = (mealsData as MealsFile).meals;

function parseProfileNumber(value: string) {
  return Number.parseFloat(value.replace(',', '.'));
}

function getGender(genderValue: string): Gender {
  const normalized = genderValue.trim().toLowerCase();
  if (normalized.startsWith('m')) return 'male';
  if (normalized.startsWith('f')) return 'female';
  return 'other';
}

function calculateBmi(weightKg: number, heightCm: number) {
  if (weightKg <= 0 || heightCm <= 0) return null;
  return weightKg / (heightCm / 100) ** 2;
}

function calculateBmr(weightKg: number, heightCm: number, ageYears: number, gender: Gender) {
  if (weightKg <= 0 || heightCm <= 0 || ageYears <= 0) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (gender === 'male') return base + 5;
  if (gender === 'female') return base - 161;
  return base - 78;
}

// Returns all combinations of `size` elements from `arr`
function getCombinations<T>(arr: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (arr.length < size) return [];
  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, size - 1).map((c) => [first, ...c]);
  const withoutFirst = getCombinations(rest, size);
  return [...withFirst, ...withoutFirst];
}

type CategorCandidate = { combo: Meal[]; calories: number; usedRecently: boolean };

// Returns top candidate combos for a single category, keeping at most ~10 options.
function findCategoryCandidates(
  meals: Meal[],
  target: number,
  recentlySeen: number[][],
  maxSize = 3,
): CategorCandidate[] {
  const raw: CategorCandidate[] = [];

  for (let size = 1; size <= Math.min(maxSize, meals.length); size++) {
    for (const combo of getCombinations(meals, size)) {
      const calories = combo.reduce((s, m) => s + m.totalCalories, 0);
      const ids = combo.map((m) => m.id).sort((a, b) => a - b);
      const usedRecently = recentlySeen.some(
        (used) => used.length === ids.length && used.every((id, i) => id === ids[i]),
      );
      raw.push({ combo, calories, usedRecently });
    }
  }

  // Best under-target (highest calories first) + a few over-target fallbacks
  const under = raw
    .filter((c) => c.calories <= target)
    .sort((a, b) => {
      if (a.usedRecently !== b.usedRecently) return a.usedRecently ? 1 : -1;
      return b.calories - a.calories;
    })
    .slice(0, 8);
  const over = raw
    .filter((c) => c.calories > target)
    .sort((a, b) => a.calories - b.calories)
    .slice(0, 2);

  return [...under, ...over];
}

// Finds the best combination across all 4 categories that maximises total calories
// without exceeding the daily limit, preferring unused combos.
function findBestGlobalCombo(
  allMealsByCategory: Record<MealCategory, Meal[]>,
  categoryTargets: Record<MealCategory, number>,
  dailyLimit: number,
  recentHistory: Record<MealCategory, number[][]>,
): Record<MealCategory, Meal[]> {
  const perCategory = CATEGORY_ORDER.map((cat) =>
    findCategoryCandidates(allMealsByCategory[cat], categoryTargets[cat], recentHistory[cat]),
  );

  let best: { result: Record<MealCategory, Meal[]>; total: number; recentCount: number } | null = null;

  for (const a of perCategory[0]) {
    for (const b of perCategory[1]) {
      const ab = a.calories + b.calories;
      if (ab > dailyLimit) continue;
      for (const c of perCategory[2]) {
        const abc = ab + c.calories;
        if (abc > dailyLimit) continue;
        for (const d of perCategory[3]) {
          const total = abc + d.calories;
          if (total > dailyLimit) continue;
          const recentCount = [a, b, c, d].filter((x) => x.usedRecently).length;
          if (
            !best ||
            recentCount < best.recentCount ||
            (recentCount === best.recentCount && total > best.total)
          ) {
            best = {
              result: {
                breakfast: a.combo,
                lunch: b.combo,
                dinner: c.combo,
                snack: d.combo,
              },
              total,
              recentCount,
            };
          }
        }
      }
    }
  }

  if (best) return best.result;

  // Fallback: pick per-category best independently
  return CATEGORY_ORDER.reduce<Record<MealCategory, Meal[]>>((acc, cat, i) => {
    acc[cat] = perCategory[i][0]?.combo ?? [];
    return acc;
  }, { breakfast: [], lunch: [], dinner: [], snack: [] });
}

export default function RecipesScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { selectedByCategory, setSelectedByCategory, selectedMeals } = useMealPlan();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showWeekConfirm, setShowWeekConfirm] = useState(false);
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<MealCategory>>(new Set());
  // Per-category list of sorted meal-id arrays used in the last 7 days
  const [recentHistory, setRecentHistory] = useState<Record<MealCategory, number[][]>>({
    breakfast: [], lunch: [], dinner: [], snack: [],
  });

  useEffect(() => {
    if (!profile.email) return;
    getMealHistory(profile.email).then((entries) => {
      const history: Record<MealCategory, number[][]> = {
        breakfast: [], lunch: [], dinner: [], snack: [],
      };
      for (const entry of entries) {
        for (const cat of CATEGORY_ORDER) {
          const ids = (entry.meal_ids[cat] ?? []).slice().sort((a: number, b: number) => a - b);
          if (ids.length > 0) history[cat].push(ids);
        }
      }
      setRecentHistory(history);
    });
  }, [profile.email]);

  const heightCm = parseProfileNumber(profile.height);
  const weightKg = parseProfileNumber(profile.weight);
  const ageYears = parseProfileNumber(profile.age);
  const gender = getGender(profile.gender);

  const bmi = calculateBmi(weightKg, heightCm);
  const bmr = calculateBmr(weightKg, heightCm, ageYears, gender);
  const needsWeightLoss = bmi !== null && bmi >= 25;

  const dailyCalories = useMemo(() => {
    if (bmr === null) return null;
    const maintenance = bmr * ACTIVITY_FACTOR;
    if (!needsWeightLoss) {
      return Math.round(maintenance);
    }
    const target = Math.round(maintenance - WEIGHT_LOSS_DEFICIT);
    return Math.max(target, 1200);
  }, [bmr, needsWeightLoss]);

  const categoryTargets = useMemo(() => {
    if (dailyCalories === null) return null;
    return CATEGORY_ORDER.reduce<Record<MealCategory, number>>((acc, category) => {
      acc[category] = Math.round(dailyCalories * CALORIE_SPLIT[category]);
      return acc;
    }, { breakfast: 0, lunch: 0, dinner: 0, snack: 0 });
  }, [dailyCalories]);

  // All meals grouped by category (no slice — full list for dropdowns)
  const allMealsByCategory = useMemo(() => {
    return CATEGORY_ORDER.reduce<Record<MealCategory, Meal[]>>((acc, category) => {
      acc[category] = MEALS.filter((m) => m.category === category);
      return acc;
    }, { breakfast: [], lunch: [], dinner: [], snack: [] });
  }, []);

  const suggestedCombo = useMemo(() => {
    if (!categoryTargets || !dailyCalories) return null;
    return findBestGlobalCombo(allMealsByCategory, categoryTargets, dailyCalories, recentHistory);
  }, [categoryTargets, dailyCalories, allMealsByCategory, recentHistory]);

  const suggestedComboCalories = useMemo(() => {
    if (!suggestedCombo) return 0;
    return CATEGORY_ORDER.reduce(
      (total, cat) => total + suggestedCombo[cat].reduce((s, m) => s + m.totalCalories, 0),
      0,
    );
  }, [suggestedCombo]);

  useEffect(() => {
    if (!needsWeightLoss || !suggestedCombo) return;

    setSelectedByCategory((previous) => {
      const next: Partial<Record<MealCategory, number[]>> = { ...previous };
      CATEGORY_ORDER.forEach((category) => {
        if (!next[category] || next[category]!.length === 0) {
          next[category] = suggestedCombo[category].map((m) => m.id);
        }
      });
      return next;
    });
  }, [needsWeightLoss, suggestedCombo, setSelectedByCategory]);

  function applySuggestedCombo() {
    if (!suggestedCombo) return;
    const next: Partial<Record<MealCategory, number[]>> = {};
    CATEGORY_ORDER.forEach((category) => {
      next[category] = suggestedCombo[category].map((m) => m.id);
    });
    setSelectedByCategory(next);
    if (profile.email) {
      saveMealHistory(profile.email, next as Record<string, number[]>);
    }
    setShowApplyModal(true);
  }

  function confirmApplyForWeek() {
    if (!suggestedCombo || !profile.email) return;
    setShowWeekConfirm(false);

    const next: Partial<Record<MealCategory, number[]>> = {};
    CATEGORY_ORDER.forEach((category) => {
      next[category] = suggestedCombo[category].map((m) => m.id);
    });
    setSelectedByCategory(next);

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;

    const saves: Promise<boolean>[] = [];
    for (let i = 0; i <= daysUntilSunday; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      saves.push(saveMealHistory(profile.email, next as Record<string, number[]>, dateStr));
    }
    Promise.all(saves).finally(() => setShowWeekModal(true));
  }

  function toggleCategory(category: MealCategory) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  const finalPlanCalories = selectedMeals.reduce((total, meal) => total + meal.totalCalories, 0);
  const hasMetrics = bmi !== null && bmr !== null && dailyCalories !== null;
  const bmiLabel = bmi === null ? 'N/A' : bmi.toFixed(1);
  const bmrLabel = bmr === null ? 'N/A' : Math.round(bmr).toString();
  const adviceText = !hasMetrics
    ? 'Add age, height, weight, and gender in your profile to generate a personalized meal plan.'
    : needsWeightLoss
      ? 'You should aim to lose weight. Choose one or more options per category to build your daily plan.'
      : 'You do not currently need to lose weight. Continue with your current meal plan.';

  return (
    <>
    <ScrollView style={[styles.container, { backgroundColor: colors.screenBackground }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.title, { color: colors.text }]}>Recipes</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>BMI and BMR based recommendations</Text>
      </View>

      <View style={[styles.statusCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
        <Text style={[styles.statusTitle, { color: colors.text }]}>Your Health Baseline</Text>
        <View style={styles.statusRow}>
          <Text style={[styles.statusMetric, { color: colors.tertiaryText }]}>BMI: {bmiLabel}</Text>
          <Text style={[styles.statusMetric, { color: colors.tertiaryText }]}>BMR: {bmrLabel} kcal</Text>
        </View>
        {dailyCalories !== null && (
          <Text style={[styles.statusTarget, { color: colors.labelText }]}>
            Daily target for recommendation: {dailyCalories} kcal
          </Text>
        )}
        <Text style={[styles.statusAdvice, { color: colors.labelText }]}>{adviceText}</Text>
      </View>

      {!needsWeightLoss && hasMetrics && (
        <View style={[styles.maintainCard, { backgroundColor: colors.cardBackground, borderColor: colors.selectedBorder }]}>
          <Text style={[styles.maintainTitle, { color: colors.primaryText }]}>Current Plan Is Appropriate</Text>
          <Text style={[styles.maintainText, { color: colors.primaryText }]}>
            Keep following your current meal rhythm and monitor your progress weekly.
          </Text>
        </View>
      )}

      {needsWeightLoss && categoryTargets && suggestedCombo && (
        <>
          <View style={[styles.suggestedCard, { backgroundColor: colors.darkCard, shadowColor: colors.shadow }]}>
            <View style={styles.suggestedHeader}>
              <View>
                <Text style={[styles.suggestedTitle, { color: colors.darkCardText }]}>Suggested Combo</Text>
                <Text style={[styles.suggestedSubtitle, { color: colors.darkCardSubtext }]}>
                  Best match for your {dailyCalories} kcal target
                </Text>
              </View>
              <View style={styles.applyButtons}>
                <TouchableOpacity
                  style={[styles.applyButton, { backgroundColor: colors.primary }]}
                  onPress={applySuggestedCombo}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.applyWeekButton, { borderColor: colors.primary }]}
                  onPress={() => setShowWeekConfirm(true)}
                >
                  <Text style={[styles.applyWeekButtonText, { color: colors.primary }]}>Week</Text>
                </TouchableOpacity>
              </View>
            </View>

            {CATEGORY_ORDER.map((category) => {
              const meals = suggestedCombo[category];
              if (!meals.length) return null;
              const categoryTotal = meals.reduce((s, m) => s + m.totalCalories, 0);
              return (
                <View key={category} style={[styles.suggestedCategoryBlock, { borderBottomColor: 'rgba(255,255,255,0.08)' }]}>
                  <View style={styles.suggestedCategoryHeader}>
                    <Text style={styles.suggestedEmoji}>{getMealEmoji(category)}</Text>
                    <Text style={[styles.suggestedCategoryLabel, { color: colors.darkCardSubtext }]}>
                      {CATEGORY_LABELS[category]} · target {categoryTargets[category]} kcal
                    </Text>
                    <Text style={styles.suggestedMealKcal}>{categoryTotal} kcal</Text>
                  </View>
                  {meals.map((meal) => (
                    <View key={meal.id} style={styles.suggestedRow}>
                      <Text style={[styles.suggestedMealName, { color: colors.darkCardText }]}>{meal.name}</Text>
                      <Text style={[styles.suggestedMealSub, { color: colors.darkCardSubtext }]}>{meal.totalCalories} kcal</Text>
                    </View>
                  ))}
                </View>
              );
            })}

            <View style={[styles.suggestedTotal, { borderTopColor: 'rgba(255,255,255,0.15)' }]}>
              <Text style={[styles.suggestedTotalLabel, { color: colors.darkCardText }]}>Total</Text>
              <Text style={styles.suggestedTotalValue}>{suggestedComboCalories} kcal</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.historyButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/meal-history')}
          >
            <Text style={styles.historyButtonText}>View Meal History</Text>
          </TouchableOpacity>

          {selectedMeals.length > 0 && (
            <TouchableOpacity
              style={[styles.clearButton, { borderColor: colors.border }]}
              onPress={() => setSelectedByCategory({})}
            >
              <Text style={[styles.clearButtonText, { color: colors.secondaryText }]}>Unselect All</Text>
            </TouchableOpacity>
          )}

          {CATEGORY_ORDER.map((category) => {
            const isExpanded = expandedCategories.has(category);
            const meals = allMealsByCategory[category];
            const selectedIds = selectedByCategory[category] ?? [];
            const selectedInCategory = meals.filter((m) => selectedIds.includes(m.id));

            return (
              <View key={category} style={[styles.categoryCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
                <TouchableOpacity
                  style={styles.dropdownHeader}
                  onPress={() => toggleCategory(category)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dropdownHeaderLeft}>
                    <Text style={[styles.categoryTitle, { color: colors.text }]}>
                      {getMealEmoji(category)} {CATEGORY_LABELS[category]}
                    </Text>
                    <Text style={[styles.categoryHint, { color: colors.secondaryText }]}>
                      Target: {categoryTargets[category]} kcal · {meals.length} options
                    </Text>
                  </View>
                  <Text style={[styles.dropdownChevron, { color: colors.secondaryText }]}>
                    {isExpanded ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {!isExpanded && selectedInCategory.length > 0 && (
                  <View style={[styles.selectedPreview, { borderTopColor: colors.borderLight }]}>
                    {selectedInCategory.map((meal) => (
                      <View key={meal.id} style={styles.selectedPreviewRow}>
                        <Text style={[styles.selectedPreviewName, { color: colors.primary }]} numberOfLines={1}>
                          {meal.name}
                        </Text>
                        <Text style={[styles.selectedPreviewKcal, { color: colors.primary }]}>{meal.totalCalories} kcal</Text>
                      </View>
                    ))}
                  </View>
                )}

                {isExpanded && (
                  <View style={[styles.dropdownList, { borderTopColor: colors.borderLight }]}>
                    {meals.map((meal) => {
                      const selected = selectedIds.includes(meal.id);
                      return (
                        <TouchableOpacity
                          key={meal.id}
                          style={[
                            styles.optionCard,
                            { borderColor: colors.border, backgroundColor: colors.cardBackground },
                            selected && { borderColor: colors.primary, backgroundColor: colors.selectedBackground },
                          ]}
                          onPress={() =>
                            setSelectedByCategory((previous) => {
                              const prev = previous[category] ?? [];
                              const next = prev.includes(meal.id)
                                ? prev.filter((id) => id !== meal.id)
                                : [...prev, meal.id];
                              return { ...previous, [category]: next };
                            })
                          }
                        >
                          <View style={styles.optionInfo}>
                            <Text style={[styles.optionName, { color: colors.text }]}>{meal.name}</Text>
                            <Text style={[styles.optionMeta, { color: colors.secondaryText }]}>
                              {meal.ingredients.length} ingredients · {meal.calorieBand}
                            </Text>
                          </View>
                          <Text style={[styles.optionKcal, { color: selected ? colors.primary : colors.tertiaryText }]}>
                            {meal.totalCalories} kcal
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          <View style={[styles.finalPlanCard, { backgroundColor: colors.darkCard }]}>
            <Text style={[styles.finalPlanTitle, { color: colors.darkCardText }]}>Final Daily Meal Plan</Text>
            {selectedMeals.map((meal) => (
              <View key={meal.id} style={styles.finalPlanRow}>
                <Text style={[styles.finalPlanMeal, { color: colors.darkCardSubtext }]}>{meal.name}</Text>
                <Text style={styles.finalPlanMealKcal}>{meal.totalCalories} kcal</Text>
              </View>
            ))}
            <View style={[styles.finalPlanDivider, { backgroundColor: colors.border }]} />
            <View style={styles.finalPlanRow}>
              <Text style={[styles.finalPlanTotalLabel, { color: colors.darkCardText }]}>Total</Text>
              <Text style={styles.finalPlanTotalValue}>{finalPlanCalories} kcal</Text>
            </View>
          </View>
        </>
      )}

      {!hasMetrics && (
        <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.empty, { color: colors.secondaryText }]}>
            Complete your profile details to unlock BMI and BMR based meal recommendations.
          </Text>
        </View>
      )}

      {hasMetrics && needsWeightLoss && selectedMeals.length === 0 && (
        <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.empty, { color: colors.secondaryText }]}>No matching meals found for your calorie targets.</Text>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>

    <Modal visible={showApplyModal} transparent animationType="fade" onRequestClose={() => setShowApplyModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={[styles.modalIcon]}>&#10003;</Text>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Combo Applied</Text>
          <Text style={[styles.modalMessage, { color: colors.secondaryText }]}>
            The suggested meal plan has been applied to your daily plan.
          </Text>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowApplyModal(false)}
          >
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    <Modal visible={showWeekConfirm} transparent animationType="fade" onRequestClose={() => setShowWeekConfirm(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={[styles.modalIcon]}>&#128197;</Text>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Apply for the week?</Text>
          <Text style={[styles.modalMessage, { color: colors.secondaryText }]}>
            This will save the suggested meal plan for every day from today through Sunday.
          </Text>
          <View style={styles.modalButtonRow}>
            <TouchableOpacity
              style={[styles.modalCancelButton, { borderColor: colors.border }]}
              onPress={() => setShowWeekConfirm(false)}
            >
              <Text style={[styles.modalCancelButtonText, { color: colors.secondaryText }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={confirmApplyForWeek}
            >
              <Text style={styles.modalButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    <Modal visible={showWeekModal} transparent animationType="fade" onRequestClose={() => setShowWeekModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={[styles.modalIcon]}>&#128197;</Text>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Week Plan Applied</Text>
          <Text style={[styles.modalMessage, { color: colors.secondaryText }]}>
            The suggested meal plan has been saved for every day from today through Sunday.
          </Text>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowWeekModal(false)}
          >
            <Text style={styles.modalButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },

  statusCard: {
    marginHorizontal: 16,
    marginVertical: 14,
    borderRadius: 14,
    padding: 14,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statusTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  statusMetric: { fontSize: 13, fontWeight: '600' },
  statusTarget: { fontSize: 13, marginBottom: 8 },
  statusAdvice: { fontSize: 13, lineHeight: 18 },

  maintainCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  maintainTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  maintainText: { fontSize: 13 },

  historyButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  historyButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  clearButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  clearButtonText: { fontSize: 14, fontWeight: '600' },

  suggestedCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  suggestedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  suggestedTitle: { fontSize: 15, fontWeight: '800' },
  suggestedSubtitle: { fontSize: 12, marginTop: 2 },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  applyButtons: { flexDirection: 'row', gap: 8 },
  applyButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  applyWeekButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  applyWeekButtonText: { fontWeight: '700', fontSize: 13 },
  suggestedCategoryBlock: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  suggestedCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  suggestedCategoryLabel: { flex: 1, fontSize: 11, marginLeft: 6 },
  suggestedEmoji: { fontSize: 16 },
  suggestedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 22,
    marginBottom: 3,
  },
  suggestedMealName: { fontSize: 13, fontWeight: '700', flex: 1, paddingRight: 8 },
  suggestedMealSub: { fontSize: 12 },
  suggestedMealKcal: { color: '#86EFAC', fontSize: 13, fontWeight: '700' },
  suggestedTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    marginTop: 2,
  },
  suggestedTotalLabel: { fontWeight: '700', fontSize: 14 },
  suggestedTotalValue: { color: '#86EFAC', fontWeight: '800', fontSize: 14 },

  categoryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  dropdownHeaderLeft: { flex: 1 },
  dropdownChevron: { fontSize: 12, marginLeft: 8 },
  categoryTitle: { fontSize: 15, fontWeight: '700' },
  categoryHint: { fontSize: 12, marginTop: 2 },
  selectedPreview: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  selectedPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  selectedPreviewName: { fontSize: 13, fontWeight: '600', flex: 1, paddingRight: 8 },
  selectedPreviewKcal: { fontSize: 13, fontWeight: '700' },
  dropdownList: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    paddingTop: 8,
  },

  optionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionInfo: { flex: 1, paddingRight: 10 },
  optionName: { fontSize: 14, fontWeight: '700' },
  optionMeta: { fontSize: 12, marginTop: 3 },
  optionKcal: { fontSize: 13, fontWeight: '700' },

  finalPlanCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
  },
  finalPlanTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  finalPlanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  finalPlanMeal: { fontSize: 13, flex: 1, paddingRight: 8 },
  finalPlanMealKcal: { color: '#86EFAC', fontSize: 13, fontWeight: '700' },
  finalPlanDivider: { height: 1, marginVertical: 8 },
  finalPlanTotalLabel: { fontWeight: '700', fontSize: 14 },
  finalPlanTotalValue: { color: '#86EFAC', fontWeight: '800', fontSize: 14 },

  emptyCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
  },
  empty: { textAlign: 'center', fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalCard: {
    width: '100%',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalIcon: {
    fontSize: 40,
    color: '#4CAF50',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  modalMessage: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modalButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalButtonRow: { flexDirection: 'row', gap: 12 },
  modalCancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  modalCancelButtonText: { fontWeight: '700', fontSize: 14 },
});
