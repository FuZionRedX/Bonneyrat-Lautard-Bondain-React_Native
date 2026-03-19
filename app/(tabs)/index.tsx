import { useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { useProfile } from "@/contexts/profile-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface Meal {
  name: string;
  detail: string;
  kcal: number;
  planned?: boolean;
}

interface MealSection {
  type: string;
  totalKcal: number;
  meals: Meal[];
}

const MEAL_SECTIONS: MealSection[] = [
  {
    type: "Breakfast",
    totalKcal: 380,
    meals: [
      {
        name: "Avocado Toast & Egg",
        detail: "1 serving - 380 kcal",
        kcal: 380,
      },
    ],
  },
  {
    type: "Lunch",
    totalKcal: 540,
    meals: [
      { name: "Quinoa Buddha Bowl", detail: "1 bowl - 455 kcal", kcal: 455 },
      { name: "Roasted Almonds", detail: "15 pieces - 85 kcal", kcal: 85 },
    ],
  },
  {
    type: "Dinner",
    totalKcal: 0,
    meals: [
      {
        name: "Grilled Salmon & Greens",
        detail: "1 serving - 420 kcal",
        kcal: 420,
        planned: true,
      },
    ],
  },
];

function parseProfileNumber(value: string) {
  return Number.parseFloat(value.replace(",", "."));
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
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const dailyTarget = 2000;
  const consumed = 1340;
  const remaining = dailyTarget - consumed;
  const firstName = profile.fullName.trim().split(/\s+/)[0] || "there";
  const heightCm = parseProfileNumber(profile.height);
  const weightKg = parseProfileNumber(profile.weight);
  const hasValidMetrics = heightCm > 0 && weightKg > 0;
  const bmi = hasValidMetrics ? weightKg / (heightCm / 100) ** 2 : null;
  const bmiDisplay = bmi === null ? "--" : bmi.toFixed(1);

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
            CALORIES CONSUMED{"\n"}
            <Text style={[styles.targetConsumedValue, { color: colors.text }]}>
              {consumed.toLocaleString()} / {dailyTarget.toLocaleString()}
            </Text>
          </Text>
          <Text style={[styles.remainingBadge, { color: colors.primary, backgroundColor: colors.primaryLight }]}>{remaining} remaining</Text>
        </View>
        <ProgressBar value={consumed} max={dailyTarget} color={colors.primary} trackColor={colors.progressTrack} />
      </View>

      {/* Meal Sections */}
      {MEAL_SECTIONS.map((section) => (
        <View key={section.type} style={[styles.mealSection, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <View style={styles.mealSectionHeader}>
            <Text style={[styles.mealSectionTitle, { color: colors.text }]}>{section.type}</Text>
            {section.totalKcal > 0 && (
              <Text style={[styles.mealSectionKcal, { color: colors.secondaryText }]}>
                {section.totalKcal} kcal
              </Text>
            )}
            {section.meals[0]?.planned && (
              <Text style={[styles.plannedBadge, { color: colors.secondaryText }]}>Planned</Text>
            )}
          </View>
          {section.meals.map((meal) => (
            <View key={meal.name} style={styles.mealRow}>
              <View style={[styles.mealIcon, { backgroundColor: colors.chipBackground }]}>
                <Text style={styles.mealIconText}></Text>
              </View>
              <View style={styles.mealInfo}>
                <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
                <Text style={[styles.mealDetail, { color: colors.secondaryText }]}>{meal.detail}</Text>
              </View>
              <TouchableOpacity style={styles.mealEditBtn}>
                <Text style={[styles.mealEditText, { color: colors.secondaryText }]}></Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ))}

      {/* Daily Goals */}
      <View style={[styles.goalsCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
        <Text style={[styles.goalsTitle, { color: colors.text }]}>Daily Goals</Text>
        <View style={styles.goalRow}>
          <Text style={[styles.goalLabel, { color: colors.tertiaryText }]}>Steps</Text>
          <Text style={[styles.goalValue, { color: colors.secondaryText }]}>7,500 / 10,000</Text>
        </View>
        <ProgressBar value={7500} max={10000} color={colors.info} trackColor={colors.progressTrack} />
        <View style={[styles.goalRow, { marginTop: 12 }]}>
          <Text style={[styles.goalLabel, { color: colors.tertiaryText }]}>Active Minutes</Text>
          <Text style={[styles.goalValue, { color: colors.secondaryText }]}>28 / 45</Text>
        </View>
        <ProgressBar value={28} max={45} color={colors.warning} trackColor={colors.progressTrack} />
        <View style={[styles.goalRow, { marginTop: 12 }]}>
          <Text style={[styles.goalLabel, { color: colors.tertiaryText }]}>Calories Burned</Text>
          <Text style={[styles.goalValue, { color: colors.secondaryText }]}>420 / 600</Text>
        </View>
        <ProgressBar value={420} max={600} color={colors.danger} trackColor={colors.progressTrack} />
      </View>

      {/* Ready for lunch recommendation */}
      <View style={[styles.recommendCard, { backgroundColor: colors.darkCard, shadowColor: colors.shadow }]}>
        <View>
          <Text style={[styles.recommendTitle, { color: colors.darkCardText }]}>Ready for lunch?</Text>
          <Text style={[styles.recommendSub, { color: colors.darkCardSubtext }]}>
            Follow your personalised nutrition plan to maintain your BMI goal.
          </Text>
          <Text style={[styles.recommendNote, { color: colors.primary }]}>3 meals tailored for you</Text>
        </View>
        <TouchableOpacity style={[styles.recommendBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.recommendBtnText}>See Meal Plan </Text>
        </TouchableOpacity>
      </View>

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
  plannedBadge: { fontSize: 12, fontStyle: "italic" },
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
  mealEditBtn: { padding: 6 },
  mealEditText: { fontSize: 16 },

  goalsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  goalsTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  goalLabel: { fontSize: 13, fontWeight: "600" },
  goalValue: { fontSize: 13 },

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
