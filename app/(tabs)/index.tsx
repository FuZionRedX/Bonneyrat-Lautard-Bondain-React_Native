import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { MealCategory, useMealPlan } from "@/contexts/meal-plan-context";
import { useProfile } from "@/contexts/profile-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

const CATEGORY_ORDER: MealCategory[] = ["breakfast", "lunch", "dinner", "snack"];
const CATEGORY_LABELS: Record<MealCategory, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function getMealEmoji(category: MealCategory) {
  if (category === "breakfast") return "\u{1F963}";
  if (category === "lunch") return "\u{1F957}";
  if (category === "dinner") return "\u{1F37D}\uFE0F";
  return "\u{1F34E}";
}

type Gender = "male" | "female" | "other";
const ACTIVITY_FACTOR = 1.35;
const WEIGHT_LOSS_DEFICIT = 500;

function parseProfileNumber(value: string) {
  return Number.parseFloat(value.replace(",", "."));
}

function getGender(genderValue: string): Gender {
  const normalized = genderValue.trim().toLowerCase();
  if (normalized.startsWith("m")) return "male";
  if (normalized.startsWith("f")) return "female";
  return "other";
}

function calculateBmr(weightKg: number, heightCm: number, ageYears: number, gender: Gender) {
  if (weightKg <= 0 || heightCm <= 0 || ageYears <= 0) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (gender === "male") return base + 5;
  if (gender === "female") return base - 161;
  return base - 78;
}

function ProgressBar({
  value,
  max,
  color,
  trackColor,
}: {
  value: number;
  max: number;
  color: string;
  trackColor: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={[styles.progressTrack, { backgroundColor: trackColor }]}>
      <View
        style={[
          styles.progressFill,
          { width: `${pct}%` as any, backgroundColor: color },
        ]}
      />
    </View>
  );
}

export default function PlannerScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { selectedMeals } = useMealPlan();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const firstName = profile.fullName.trim().split(/\s+/)[0] || "there";
  const heightCm = parseProfileNumber(profile.height);
  const weightKg = parseProfileNumber(profile.weight);
  const ageYears = parseProfileNumber(profile.age);
  const gender = getGender(profile.gender);
  const hasValidMetrics = heightCm > 0 && weightKg > 0;
  const bmi = hasValidMetrics ? weightKg / (heightCm / 100) ** 2 : null;
  const bmiDisplay = bmi === null ? "--" : bmi.toFixed(1);
  const bmr = calculateBmr(weightKg, heightCm, ageYears, gender);
  const needsWeightLoss = bmi !== null && bmi >= 25;

  const dailyTarget = useMemo(() => {
    if (bmr === null) return 2000;
    const maintenance = bmr * ACTIVITY_FACTOR;
    if (!needsWeightLoss) return Math.round(maintenance);
    return Math.max(Math.round(maintenance - WEIGHT_LOSS_DEFICIT), 1200);
  }, [bmr, needsWeightLoss]);

  const mealSections = useMemo(() => {
    return CATEGORY_ORDER.map((category) => {
      const meals = selectedMeals.filter((m) => m.category === category);
      const totalKcal = meals.reduce((sum, m) => sum + m.totalCalories, 0);
      return { category, label: CATEGORY_LABELS[category], totalKcal, meals };
    });
  }, [selectedMeals]);

  const totalPlanned = selectedMeals.reduce((sum, m) => sum + m.totalCalories, 0);
  const isOverLimit = totalPlanned > dailyTarget;
  const remaining = Math.max(dailyTarget - totalPlanned, 0);
  const excess = totalPlanned - dailyTarget;
  const hasMealPlan = selectedMeals.length > 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.screenBackground }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>Good morning, {firstName} </Text>
          <Text style={[styles.subGreeting, { color: colors.secondaryText }]}>
            Let&apos;s track your nutrition today
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bmiBadge, { backgroundColor: colors.primaryLight }]}
          onPress={() => router.push("/health-overview" as any)}
        >
          <Text style={[styles.bmiValue, { color: colors.primary }]}>{bmiDisplay}</Text>
          <Text style={[styles.bmiLabel, { color: colors.primary }]}>BMI</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Target Card */}
      <View style={[styles.targetCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
        <View style={styles.targetHeader}>
          <Text style={[styles.targetTitle, { color: colors.secondaryText }]}>DAILY TARGET</Text>
          <Text style={[styles.targetKcal, { color: colors.text }]}>
            {dailyTarget.toLocaleString()} kcal
          </Text>
        </View>
        <View style={styles.targetRow}>
          <Text style={[styles.targetConsumed, { color: colors.secondaryText }]}>
            CALORIES PLANNED{"\n"}
            <Text style={[styles.targetConsumedValue, { color: colors.text }]}>
              {totalPlanned.toLocaleString()} / {dailyTarget.toLocaleString()}
            </Text>
          </Text>
          <Text
            style={[
              styles.remainingBadge,
              isOverLimit
                ? { color: colors.danger, backgroundColor: "#FDECEA" }
                : { color: colors.primary, backgroundColor: colors.primaryLight },
            ]}
          >
            {isOverLimit ? `${excess} over limit` : `${remaining} remaining`}
          </Text>
        </View>
        <ProgressBar
          value={totalPlanned}
          max={dailyTarget}
          color={isOverLimit ? colors.danger : colors.primary}
          trackColor={colors.progressTrack}
        />
        {isOverLimit && (
          <Text style={styles.overLimitAlert}>
            You are {excess} kcal above your daily target. Consider removing some meals.
          </Text>
        )}
      </View>

      {/* Meal Sections from user selections */}
      {hasMealPlan ? (
        mealSections.map((section) => (
          <View key={section.category} style={[styles.mealSection, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
            <View style={styles.mealSectionHeader}>
              <Text style={[styles.mealSectionTitle, { color: colors.text }]}>
                {getMealEmoji(section.category)} {section.label}
              </Text>
              {section.totalKcal > 0 && (
                <Text style={[styles.mealSectionKcal, { color: colors.secondaryText }]}>
                  {section.totalKcal} kcal
                </Text>
              )}
            </View>
            {section.meals.length > 0 ? (
              section.meals.map((meal) => (
                <View key={meal.id} style={styles.mealRow}>
                  <View style={[styles.mealIcon, { backgroundColor: colors.chipBackground }]}>
                    <Text style={styles.mealIconText}>{getMealEmoji(meal.category)}</Text>
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
                    <Text style={[styles.mealDetail, { color: colors.secondaryText }]}>
                      {meal.ingredients.length} ingredients - {meal.totalCalories} kcal
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.mealDetail, { color: colors.secondaryText, paddingVertical: 4 }]}>
                No {section.label.toLowerCase()} selected
              </Text>
            )}
          </View>
        ))
      ) : (
        <View style={[styles.mealSection, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={[styles.mealSectionTitle, { color: colors.text, marginBottom: 6 }]}>
            No meals planned yet
          </Text>
          <Text style={[styles.mealDetail, { color: colors.secondaryText }]}>
            Go to the Recipes tab to select your meals
          </Text>
        </View>
      )}

      {/* Recommendation card */}
      {!hasMealPlan && (
        <View style={[styles.recommendCard, { backgroundColor: colors.darkCard, shadowColor: colors.shadow }]}>
          <View>
            <Text style={[styles.recommendTitle, { color: colors.darkCardText }]}>Ready for lunch?</Text>
            <Text style={[styles.recommendSub, { color: colors.darkCardSubtext }]}>
              Follow your personalised nutrition plan to maintain your BMI goal.
            </Text>
            <Text style={[styles.recommendNote, { color: colors.primary }]}>Meals tailored for you</Text>
          </View>
          <TouchableOpacity
            style={[styles.recommendBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/recipes" as any)}
          >
            <Text style={styles.recommendBtnText}>See Meal Plan</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  greeting: { fontSize: 18, fontWeight: "700" },
  subGreeting: { fontSize: 13, marginTop: 2 },
  bmiBadge: {
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bmiValue: { fontSize: 20, fontWeight: "800" },
  bmiLabel: { fontSize: 11, fontWeight: "600" },

  targetCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  targetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  targetTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  targetKcal: { fontSize: 22, fontWeight: "800" },
  targetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  targetConsumed: { fontSize: 11, fontWeight: "600" },
  targetConsumedValue: { fontSize: 15, fontWeight: "700" },
  remainingBadge: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  overLimitAlert: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "600",
    color: "#D32F2F",
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: 8, borderRadius: 4 },

  mealSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 14,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  mealSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  mealSectionTitle: { fontSize: 15, fontWeight: "700" },
  mealSectionKcal: { fontSize: 13, fontWeight: "600" },
  mealRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  mealIconText: { fontSize: 18 },
  mealInfo: { flex: 1 },
  mealName: { fontSize: 14, fontWeight: "600" },
  mealDetail: { fontSize: 12, marginTop: 2 },
  recommendCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 18,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  recommendSub: {
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  recommendNote: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 14,
  },
  recommendBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  recommendBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
