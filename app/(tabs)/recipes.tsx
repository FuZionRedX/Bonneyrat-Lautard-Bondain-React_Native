import mealsData from '@/data/meals.json';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useProfile } from '@/contexts/profile-context';

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
  if (category === 'breakfast') return '🥣';
  if (category === 'lunch') return '🥗';
  if (category === 'dinner') return '🍽️';
  return '🍎';
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Recipes</Text>
        <Text style={styles.subtitle}>BMI and BMR based recommendations</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Your Health Baseline</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusMetric}>BMI: {bmiLabel}</Text>
          <Text style={styles.statusMetric}>BMR: {bmrLabel} kcal</Text>
        </View>
        {dailyCalories !== null && (
          <Text style={styles.statusTarget}>
            Daily target for recommendation: {dailyCalories} kcal
          </Text>
        )}
        <Text style={styles.statusAdvice}>{adviceText}</Text>
      </View>

      {!needsWeightLoss && hasMetrics && (
        <View style={styles.maintainCard}>
          <Text style={styles.maintainTitle}>Current Plan Is Appropriate</Text>
          <Text style={styles.maintainText}>
            Keep following your current meal rhythm and monitor your progress weekly.
          </Text>
        </View>
      )}

      {needsWeightLoss && categoryTargets && optionsByCategory && (
        <>
          <View style={styles.splitCard}>
            <Text style={styles.splitTitle}>Calorie Split Across 4 Meals</Text>
            {CATEGORY_ORDER.map((category) => (
              <View key={category} style={styles.splitRow}>
                <Text style={styles.splitLabel}>{CATEGORY_LABELS[category]}</Text>
                <Text style={styles.splitValue}>{categoryTargets[category]} kcal</Text>
              </View>
            ))}
          </View>

          {CATEGORY_ORDER.map((category) => (
            <View key={category} style={styles.categoryCard}>
              <Text style={styles.categoryTitle}>
                {getMealEmoji(category)} {CATEGORY_LABELS[category]} Options
              </Text>
              <Text style={styles.categoryHint}>
                Target: {categoryTargets[category]} kcal
              </Text>

              {optionsByCategory[category].map((meal) => {
                const selected = selectedByCategory[category] === meal.id;

                return (
                  <TouchableOpacity
                    key={meal.id}
                    style={[styles.optionCard, selected && styles.optionCardSelected]}
                    onPress={() =>
                      setSelectedByCategory((previous) => ({
                        ...previous,
                        [category]: meal.id,
                      }))
                    }
                  >
                    <View style={styles.optionInfo}>
                      <Text style={styles.optionName}>{meal.name}</Text>
                      <Text style={styles.optionMeta}>
                        {meal.ingredients.length} ingredients - {meal.calorieBand}
                      </Text>
                    </View>
                    <Text style={styles.optionKcal}>{meal.totalCalories} kcal</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <View style={styles.finalPlanCard}>
            <Text style={styles.finalPlanTitle}>Final Daily Meal Plan</Text>
            {selectedMeals.map((meal) => (
              <View key={meal.id} style={styles.finalPlanRow}>
                <Text style={styles.finalPlanMeal}>{meal.name}</Text>
                <Text style={styles.finalPlanMealKcal}>{meal.totalCalories} kcal</Text>
              </View>
            ))}
            <View style={styles.finalPlanDivider} />
            <View style={styles.finalPlanRow}>
              <Text style={styles.finalPlanTotalLabel}>Total</Text>
              <Text style={styles.finalPlanTotalValue}>{finalPlanCalories} kcal</Text>
            </View>
          </View>
        </>
      )}

      {!hasMetrics && (
        <View style={styles.emptyCard}>
          <Text style={styles.empty}>
            Complete your profile details to unlock BMI and BMR based meal recommendations.
          </Text>
        </View>
      )}

      {hasMetrics && needsWeightLoss && selectedMeals.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.empty}>No matching meals found for your calorie targets.</Text>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A2E' },
  subtitle: { fontSize: 14, color: '#9E9E9E', marginTop: 2 },

  statusCard: {
    marginHorizontal: 16,
    marginVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  statusTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  statusMetric: { fontSize: 13, color: '#344054', fontWeight: '600' },
  statusTarget: { fontSize: 13, color: '#475467', marginBottom: 8 },
  statusAdvice: { fontSize: 13, color: '#475467', lineHeight: 18 },

  maintainCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D1FADF',
  },
  maintainTitle: { fontSize: 14, fontWeight: '700', color: '#065F46', marginBottom: 4 },
  maintainText: { fontSize: 13, color: '#065F46' },

  splitCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  splitTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 8 },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  splitLabel: { fontSize: 13, color: '#475467' },
  splitValue: { fontSize: 13, color: '#1A1A2E', fontWeight: '700' },

  categoryCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  categoryTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  categoryHint: { fontSize: 12, color: '#667085', marginTop: 2, marginBottom: 10 },

  optionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  optionCardSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#ECFDF3',
  },
  optionInfo: { flex: 1, paddingRight: 10 },
  optionName: { fontSize: 14, fontWeight: '700', color: '#1A1A2E' },
  optionMeta: { fontSize: 12, color: '#667085', marginTop: 3 },
  optionKcal: { fontSize: 13, fontWeight: '700', color: '#16A34A' },

  finalPlanCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    padding: 14,
  },
  finalPlanTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 10 },
  finalPlanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  finalPlanMeal: { color: '#E5E7EB', fontSize: 13, flex: 1, paddingRight: 8 },
  finalPlanMealKcal: { color: '#86EFAC', fontSize: 13, fontWeight: '700' },
  finalPlanDivider: { height: 1, backgroundColor: '#344054', marginVertical: 8 },
  finalPlanTotalLabel: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  finalPlanTotalValue: { color: '#86EFAC', fontWeight: '800', fontSize: 14 },

  emptyCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
  },
  empty: { textAlign: 'center', color: '#98A2B3', fontSize: 14 },
});
