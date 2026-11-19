import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { CATEGORY_LABELS, CATEGORY_ORDER, getMealEmoji, toLocalDateKey } from "@/constants/meals";
import { getNutrition } from "@/lib/nutrition";
import { Colors } from "@/constants/theme";
import { useMealPlan } from "@/contexts/meal-plan-context";
import { useProfile } from "@/contexts/profile-context";
import { useLanguage } from "@/contexts/language-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

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
  const { selectedMeals, planDate, setPlanDate } = useMealPlan();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { locale, t } = useLanguage();

  const firstName = profile.fullName.trim().split(/\s+/)[0] || t("there");
  const nutrition = getNutrition(profile);
  const { bmi } = nutrition;
  const bmiDisplay = bmi === null ? "--" : bmi.toFixed(1);
  const dailyTarget = nutrition.dailyTarget ?? 2000;

  // Today and the next 6 days, so the week can be planned day by day.
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      key: toLocalDateKey(d),
      weekday: i === 0 ? t("Today") : d.toLocaleDateString(locale, { weekday: "short" }),
      day: d.getDate(),
      long: d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "short" }),
    };
  });
  const planDay = days.find((d) => d.key === planDate) ?? days[0];
  const isToday = planDay.key === days[0].key;

  const mealSections = useMemo(() => {
    return CATEGORY_ORDER.map((category) => {
      const meals = selectedMeals.filter((m) => m.category === category);
      const totalKcal = meals.reduce((sum, m) => sum + m.totalCalories, 0);
      return { category, label: t(CATEGORY_LABELS[category]), totalKcal, meals };
    });
  }, [selectedMeals, t]);

  const totalPlanned = selectedMeals.reduce(
    (sum, m) => sum + m.totalCalories,
    0,
  );
  const isOverLimit = totalPlanned > dailyTarget;
  const remaining = Math.max(dailyTarget - totalPlanned, 0);
  const excess = totalPlanned - dailyTarget;
  const hasMealPlan = selectedMeals.length > 0;
  const wasOverLimitRef = useRef(false);
  const [showOverLimitModal, setShowOverLimitModal] = useState(false);

  // Show the over-limit modal only on the transition into over-limit (not on every re-render).
  // wasOverLimitRef tracks the previous state so the modal fires exactly once per breach.
  useEffect(() => {
    if (isOverLimit && !wasOverLimitRef.current) {
      setShowOverLimitModal(true);
    }

    wasOverLimitRef.current = isOverLimit;
  }, [excess, isOverLimit]);

  return (
    <>
    <ScrollView
      style={[styles.container, { backgroundColor: colors.screenBackground }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {t("Good morning, {name}", { name: firstName })}{" "}
          </Text>
          <Text style={[styles.subGreeting, { color: colors.secondaryText }]}>
            {isToday ? t("Let's track your nutrition today") : t("Planning {date}", { date: planDay.long })}
          </Text>
        </View>
        <View
          style={[styles.bmiBadge, { backgroundColor: colors.primaryLight }]}
        >
          <Text style={[styles.bmiValue, { color: colors.primary }]}>
            {bmiDisplay}
          </Text>
          <Text style={[styles.bmiLabel, { color: colors.primary }]}>{t("BMI")}</Text>
        </View>
      </View>

      {profile.email ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayStrip}
        >
          {days.map((d) => {
            const selected = d.key === planDay.key;
            return (
              <TouchableOpacity
                key={d.key}
                onPress={() => setPlanDate(d.key)}
                style={[
                  styles.dayChip,
                  { backgroundColor: colors.cardBackground, borderColor: colors.border },
                  selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("Plan {date}", { date: d.long })}
                accessibilityState={{ selected }}
              >
                <Text style={[styles.dayChipWeekday, { color: selected ? "#fff" : colors.secondaryText }]}>
                  {d.weekday}
                </Text>
                <Text style={[styles.dayChipNumber, { color: selected ? "#fff" : colors.text }]}>
                  {d.day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      <View
        style={[
          styles.targetCard,
          {
            backgroundColor: colors.cardBackground,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View style={styles.targetHeader}>
          <Text style={[styles.targetTitle, { color: colors.secondaryText }]}>
            {t("DAILY TARGET")}
          </Text>
          <Text style={[styles.targetKcal, { color: colors.text }]}>
            {dailyTarget.toLocaleString()} kcal
          </Text>
        </View>
        <View style={styles.targetRow}>
          <Text
            style={[styles.targetConsumed, { color: colors.secondaryText }]}
          >
            {t("CALORIES PLANNED")}{"\n"}
            <Text style={[styles.targetConsumedValue, { color: colors.text }]}>
              {totalPlanned.toLocaleString()} / {dailyTarget.toLocaleString()}
            </Text>
          </Text>
          <Text
            style={[
              styles.remainingBadge,
              isOverLimit
                ? { color: colors.danger, backgroundColor: "#FDECEA" }
                : {
                    color: colors.primary,
                    backgroundColor: colors.primaryLight,
                  },
            ]}
          >
            {isOverLimit ? t("{n} over limit", { n: excess }) : t("{n} remaining", { n: remaining })}
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
            {t("You are {n} kcal above your daily target. Consider removing some meals.", { n: excess })}
          </Text>
        )}
      </View>

      {hasMealPlan ? (
        mealSections.map((section) => (
          <View
            key={section.category}
            style={[
              styles.mealSection,
              {
                backgroundColor: colors.cardBackground,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={styles.mealSectionHeader}>
              <Text style={[styles.mealSectionTitle, { color: colors.text }]}>
                {getMealEmoji(section.category)} {section.label}
              </Text>
              {section.totalKcal > 0 && (
                <Text
                  style={[
                    styles.mealSectionKcal,
                    { color: colors.secondaryText },
                  ]}
                >
                  {section.totalKcal} kcal
                </Text>
              )}
            </View>
            {section.meals.length > 0 ? (
              section.meals.map((meal) => (
                <View key={meal.id} style={styles.mealRow}>
                  <View
                    style={[
                      styles.mealIcon,
                      { backgroundColor: colors.chipBackground },
                    ]}
                  >
                    <Text style={styles.mealIconText}>
                      {getMealEmoji(meal.category)}
                    </Text>
                  </View>
                  <View style={styles.mealInfo}>
                    <Text style={[styles.mealName, { color: colors.text }]}>
                      {meal.name}
                    </Text>
                    <Text
                      style={[
                        styles.mealDetail,
                        { color: colors.secondaryText },
                      ]}
                    >
                      {t("{n} ingredients", { n: meal.ingredients.length })} -{" "}
                      {meal.totalCalories} kcal
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text
                style={[
                  styles.mealDetail,
                  { color: colors.secondaryText, paddingVertical: 4 },
                ]}
              >
                {t("No {categoryLower} selected", { category: section.label, categoryLower: section.label.toLowerCase() })}
              </Text>
            )}
          </View>
        ))
      ) : (
        <View
          style={[
            styles.mealSection,
            {
              backgroundColor: colors.cardBackground,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text
            style={[
              styles.mealSectionTitle,
              { color: colors.text, marginBottom: 6 },
            ]}
          >
            {t("No meals planned yet")}
          </Text>
          <Text style={[styles.mealDetail, { color: colors.secondaryText }]}>
            {t("Go to the Recipes tab to select your meals")}
          </Text>
        </View>
      )}

      {!hasMealPlan && (
        <View
          style={[
            styles.recommendCard,
            { backgroundColor: colors.darkCard, shadowColor: colors.shadow },
          ]}
        >
          <View>
            <Text
              style={[styles.recommendTitle, { color: colors.darkCardText }]}
            >
              {t("Ready for lunch?")}
            </Text>
            <Text
              style={[styles.recommendSub, { color: colors.darkCardSubtext }]}
            >
              {t("Follow your personalised nutrition plan to maintain your BMI goal.")}
            </Text>
            <Text style={[styles.recommendNote, { color: colors.primary }]}>
              {t("Meals tailored for you")}
            </Text>
          </View>
          <TouchableOpacity accessibilityRole="button"
            style={[styles.recommendBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/recipes" as any)}
          >
            <Text style={styles.recommendBtnText}>{t("See Meal Plan")}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>

    <Modal visible={showOverLimitModal} transparent animationType="fade" onRequestClose={() => setShowOverLimitModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={styles.modalIcon}>&#9888;</Text>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{t("Daily limit exceeded")}</Text>
          <Text style={[styles.modalMessage, { color: colors.secondaryText }]}>
            {t("You are {n} kcal above your target. Consider removing some meals.", { n: excess })}
          </Text>
          <TouchableOpacity accessibilityRole="button"
            style={[styles.modalButton, { backgroundColor: "#D32F2F" }]}
            onPress={() => setShowOverLimitModal(false)}
          >
            <Text style={styles.modalButtonText}>{t("OK")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dayStrip: { paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  dayChip: {
    width: 54,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  dayChipWeekday: { fontSize: 11, fontWeight: "600" },
  dayChipNumber: { fontSize: 16, fontWeight: "800", marginTop: 2 },
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  modalCard: {
    width: "100%",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalIcon: {
    fontSize: 40,
    color: "#D32F2F",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  modalMessage: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modalButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
