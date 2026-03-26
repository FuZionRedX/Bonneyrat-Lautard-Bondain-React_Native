import mealsData from '@/data/meals.json';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { getMealHistory, saveMealHistory } from '@/constants/api';
import { Meal, MealCategory, useMealPlan } from '@/contexts/meal-plan-context';
import { useProfile } from '@/contexts/profile-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface MealsFile {
  meals: Meal[];
}

type Gender = 'male' | 'female' | 'other';

const CATEGORY_ORDER: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const CATEGORY_LABELS: Record<MealCategory, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};
const CALORIE_SPLIT: Record<MealCategory, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};
const ACTIVITY_FACTOR = 1.35;
const WEIGHT_LOSS_DEFICIT = 500;

const MEALS = (mealsData as MealsFile).meals;

function getMealEmoji(category: MealCategory) {
  if (category === 'breakfast') return '\u{1F963}';
  if (category === 'lunch') return '\u{1F957}';
  if (category === 'dinner') return '\u{1F37D}\uFE0F';
  return '\u{1F34E}';
}

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

// Finds the subset of meals (1–maxSize) closest to target, avoiding recently-used combos.
// recentlySeen: list of sorted meal-id arrays used in the past 7 days for this category.
// Strategy: prefer an unused combo, falling back to the best calorie match if all were used.
function findBestCombo(meals: Meal[], target: number, recentlySeen: number[][], maxSize = 3): Meal[] {
  type Candidate = { combo: Meal[]; diff: number; usedRecently: boolean };
  const candidates: Candidate[] = [];

  for (let size = 1; size <= Math.min(maxSize, meals.length); size++) {
    for (const combo of getCombinations(meals, size)) {
      const total = combo.reduce((s, m) => s + m.totalCalories, 0);
      const diff = Math.abs(total - target);
      const ids = combo.map((m) => m.id).sort((a, b) => a - b);
      const usedRecently = recentlySeen.some(
        (used) => used.length === ids.length && used.every((id, i) => id === ids[i]),
      );
      candidates.push({ combo, diff, usedRecently });
    }
  }

  // Prefer unused combos; among equals sort by calorie accuracy
  candidates.sort((a, b) => {
    if (a.usedRecently !== b.usedRecently) return a.usedRecently ? 1 : -1;
    return a.diff - b.diff;
  });

  return candidates[0]?.combo ?? [];
}

export default function RecipesScreen() {
  const { profile } = useProfile();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { selectedByCategory, setSelectedByCategory, selectedMeals } = useMealPlan();

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

  // Best combo per category: tries all subsets of 1–3 meals, avoids recently-used combos
  const suggestedCombo = useMemo(() => {
    if (!categoryTargets) return null;
    return CATEGORY_ORDER.reduce<Record<MealCategory, Meal[]>>((acc, category) => {
      acc[category] = findBestCombo(allMealsByCategory[category], categoryTargets[category], recentHistory[category]);
      return acc;
    }, { breakfast: [], lunch: [], dinner: [], snack: [] });
  }, [categoryTargets, allMealsByCategory, recentHistory]);

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
  }, [needsWeightLoss, suggestedCombo]);

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
          {/* Suggested combo card */}
          <View style={[styles.suggestedCard, { backgroundColor: colors.darkCard, shadowColor: colors.shadow }]}>
            <View style={styles.suggestedHeader}>
              <View>
                <Text style={[styles.suggestedTitle, { color: colors.darkCardText }]}>Suggested Combo</Text>
                <Text style={[styles.suggestedSubtitle, { color: colors.darkCardSubtext }]}>
                  Best match for your {dailyCalories} kcal target
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: colors.primary }]}
                onPress={applySuggestedCombo}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
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

          {/* Calorie split */}
          <View style={[styles.splitCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
            <Text style={[styles.splitTitle, { color: colors.text }]}>Calorie Split Across 4 Meals</Text>
            {CATEGORY_ORDER.map((category) => (
              <View key={category} style={[styles.splitRow, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.splitLabel, { color: colors.labelText }]}>{CATEGORY_LABELS[category]}</Text>
                <Text style={[styles.splitValue, { color: colors.text }]}>{categoryTargets[category]} kcal</Text>
              </View>
            ))}
          </View>

          {/* Category dropdowns */}
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

                {/* Selected preview when collapsed */}
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

                {/* Expanded list */}
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

          {/* Final plan summary */}
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

  // Suggested combo card
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
  applyButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
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

  splitCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  splitTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  splitLabel: { fontSize: 13 },
  splitValue: { fontSize: 13, fontWeight: '700' },

  // Category dropdown
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
});
