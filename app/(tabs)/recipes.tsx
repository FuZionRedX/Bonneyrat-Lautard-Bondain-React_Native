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
import { useProfile } from '@/contexts/profile-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface MealIngredient {
  name: string;
  quantity: string;
  calories: number;
}

interface Meal {
  id: number;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  totalCalories: number;
  calorieBand: string;
  ingredients: MealIngredient[];
}

interface MealsFile {
  meals: Meal[];
}

type MealCategory = Meal['category'];
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

export default function RecipesScreen() {
  const { profile } = useProfile();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [selectedByCategory, setSelectedByCategory] = useState<Partial<Record<MealCategory, number>>>({});

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
    }, {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    });
  }, [dailyCalories]);

  const optionsByCategory = useMemo(() => {
    if (!categoryTargets) return null;

    return CATEGORY_ORDER.reduce<Record<MealCategory, Meal[]>>((acc, category) => {
      const target = categoryTargets[category];
      const options = MEALS
        .filter((meal) => meal.category === category)
        .sort(
          (a, b) =>
            Math.abs(a.totalCalories - target) - Math.abs(b.totalCalories - target),
        )
        .slice(0, 4);
      acc[category] = options;
      return acc;
    }, {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    });
  }, [categoryTargets]);

  useEffect(() => {
    if (!needsWeightLoss || !optionsByCategory) {
      return;
    }

    setSelectedByCategory((previous) => {
      const next: Partial<Record<MealCategory, number>> = { ...previous };

      CATEGORY_ORDER.forEach((category) => {
        if (!next[category] && optionsByCategory[category][0]) {
          next[category] = optionsByCategory[category][0].id;
        }
      });

      return next;
    });
  }, [needsWeightLoss, optionsByCategory]);

  const selectedMeals = useMemo(() => {
    if (!optionsByCategory) return [] as Meal[];

    return CATEGORY_ORDER.map((category) => {
      const selectedId = selectedByCategory[category];
      return optionsByCategory[category].find((meal) => meal.id === selectedId) ?? null;
    }).filter((meal): meal is Meal => meal !== null);
  }, [optionsByCategory, selectedByCategory]);

  const finalPlanCalories = selectedMeals.reduce((total, meal) => total + meal.totalCalories, 0);
  const hasMetrics = bmi !== null && bmr !== null && dailyCalories !== null;
  const bmiLabel = bmi === null ? 'N/A' : bmi.toFixed(1);
  const bmrLabel = bmr === null ? 'N/A' : Math.round(bmr).toString();
  const adviceText = !hasMetrics
    ? 'Add age, height, weight, and gender in your profile to generate a personalized meal plan.'
    : needsWeightLoss
      ? 'You should aim to lose weight. Choose one option per category to build your daily plan.'
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

      {needsWeightLoss && categoryTargets && optionsByCategory && (
        <>
          <View style={[styles.splitCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
            <Text style={[styles.splitTitle, { color: colors.text }]}>Calorie Split Across 4 Meals</Text>
            {CATEGORY_ORDER.map((category) => (
              <View key={category} style={[styles.splitRow, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.splitLabel, { color: colors.labelText }]}>{CATEGORY_LABELS[category]}</Text>
                <Text style={[styles.splitValue, { color: colors.text }]}>{categoryTargets[category]} kcal</Text>
              </View>
            ))}
          </View>

          {CATEGORY_ORDER.map((category) => (
            <View key={category} style={[styles.categoryCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
              <Text style={[styles.categoryTitle, { color: colors.text }]}>
                {getMealEmoji(category)} {CATEGORY_LABELS[category]} Options
              </Text>
              <Text style={[styles.categoryHint, { color: colors.secondaryText }]}>
                Target: {categoryTargets[category]} kcal
              </Text>

              {optionsByCategory[category].map((meal) => {
                const selected = selectedByCategory[category] === meal.id;

                return (
                  <TouchableOpacity
                    key={meal.id}
                    style={[
                      styles.optionCard,
                      { borderColor: colors.border, backgroundColor: colors.cardBackground },
                      selected && { borderColor: colors.primary, backgroundColor: colors.selectedBackground },
                    ]}
                    onPress={() =>
                      setSelectedByCategory((previous) => ({
                        ...previous,
                        [category]: meal.id,
                      }))
                    }
                  >
                    <View style={styles.optionInfo}>
                      <Text style={[styles.optionName, { color: colors.text }]}>{meal.name}</Text>
                      <Text style={[styles.optionMeta, { color: colors.secondaryText }]}>
                        {meal.ingredients.length} ingredients - {meal.calorieBand}
                      </Text>
                    </View>
                    <Text style={[styles.optionKcal, { color: colors.primary }]}>{meal.totalCalories} kcal</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

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

  categoryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 14,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryTitle: { fontSize: 15, fontWeight: '700' },
  categoryHint: { fontSize: 12, marginTop: 2, marginBottom: 10 },

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
