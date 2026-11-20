import { useIsFocused, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Feather from "@expo/vector-icons/Feather";

import {
  Button,
  Card,
  CapsLabel,
  CategoryPicker,
  categoryColors,
  heading,
  MealThumb,
  Pill,
  ProgressRing,
  SectionHeader,
  Sheet,
  softShadow,
} from "@/components/ui/kit";
import { CATEGORY_LABELS, CATEGORY_ORDER, toLocalDateKey } from "@/constants/meals";
import { getNutrition } from "@/lib/nutrition";
import { Colors } from "@/constants/theme";
import { MealCategory, useMealPlan } from "@/contexts/meal-plan-context";
import { useProfile } from "@/contexts/profile-context";
import { useLanguage } from "@/contexts/language-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function PlannerScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { selectedMeals, setSelectedByCategory, addCustomFood, planDate, setPlanDate, loadFailed, history } = useMealPlan();
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
  const isFocused = useIsFocused();

  // Show the over-limit modal only on the transition into over-limit (not on every re-render).
  // wasOverLimitRef tracks the previous state so the modal fires exactly once per breach.
  // The Planner runs in the background too; a native Modal would cover whatever screen
  // is open (e.g. the login screen), so it only opens while the Planner is on screen.
  useEffect(() => {
    if (isFocused && isOverLimit && !wasOverLimitRef.current) {
      setShowOverLimitModal(true);
    }

    wasOverLimitRef.current = isOverLimit;
  }, [excess, isOverLimit, isFocused]);

  // Days that already have a saved plan get a small dot in the day strip.
  const plannedDays = new Set(
    (history ?? []).filter((e) => Object.values(e.meal_ids).some((ids) => ids.length > 0)).map((e) => e.saved_at.slice(0, 10)),
  );
  // The selected day follows the live plan; history is a snapshot from when the day was picked.
  if (hasMealPlan) plannedDays.add(planDay.key);
  else plannedDays.delete(planDay.key);
  const progress = totalPlanned / dailyTarget;

  // "Add your own food" form; the plan stores it under `custom` (see PlanSelection).
  const [showAddFood, setShowAddFood] = useState(false);
  const [foodName, setFoodName] = useState("");
  const [foodKcal, setFoodKcal] = useState("");
  const [foodCategory, setFoodCategory] = useState<MealCategory>("breakfast");
  const kcal = Number.parseInt(foodKcal, 10);
  const canAddFood = foodName.trim().length > 0 && kcal > 0 && kcal <= 5000;

  function addFood() {
    if (!canAddFood) return;
    addCustomFood(foodName.trim(), foodCategory, kcal);
    setShowAddFood(false);
    setFoodName("");
    setFoodKcal("");
  }

  function removeFood(id: number) {
    setSelectedByCategory((prev) => ({ ...prev, custom: prev.custom?.filter((m) => m.id !== id) }));
  }

  return (
    <>
    <ScrollView
      style={[styles.container, { backgroundColor: colors.screenBackground }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={[heading(26), { color: colors.text }]} accessibilityRole="header">
            {t("Good morning, {name}", { name: firstName })}
          </Text>
          <Text style={[styles.subGreeting, { color: colors.tertiaryText }]}>
            {isToday ? t("Let's track your nutrition today") : t("Planning {date}", { date: planDay.long })}
          </Text>
        </View>
        <View style={[styles.bmiBadge, { backgroundColor: colors.primaryLight }]} accessible accessibilityLabel={`${t("BMI")} ${bmiDisplay}`}>
          <Text style={[heading(20), { color: colors.primaryText }]}>{bmiDisplay}</Text>
          <Text style={[styles.bmiLabel, { color: colors.primaryText }]}>{t("BMI")}</Text>
        </View>
      </View>

      {profile.email ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
          {days.map((d) => {
            const selected = d.key === planDay.key;
            const fg = selected ? colors.onPrimary : colors.text;
            return (
              <TouchableOpacity
                key={d.key}
                onPress={() => setPlanDate(d.key)}
                style={[
                  styles.dayChip,
                  selected ? { backgroundColor: colors.primary } : [{ backgroundColor: colors.cardBackground }, softShadow(colors)],
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("Plan {date}", { date: d.long })}
                accessibilityState={{ selected }}
              >
                <Text style={[styles.dayChipWeekday, { color: selected ? fg : colors.secondaryText }]}>{d.weekday}</Text>
                <Text style={[heading(19), { color: fg }]}>{d.day}</Text>
                <View
                  style={[
                    styles.dayDot,
                    plannedDays.has(d.key) && { backgroundColor: selected ? colors.onPrimary : colors.primary },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {loadFailed ? (
        <View style={[styles.syncWarning, { backgroundColor: colors.dangerLight }]}>
          <Feather name="wifi-off" size={16} color={colors.dangerText} />
          <Text style={[styles.syncWarningText, { color: colors.dangerText }]}>
            {t("Could not reach the server. Changes to this day are not saved.")}
          </Text>
        </View>
      ) : null}

      <Card style={styles.targetCard}>
        <ProgressRing
          progress={progress}
          size={128}
          stroke={13}
          label={(isOverLimit ? excess : remaining).toLocaleString(locale)}
          sublabel={isOverLimit ? t("kcal over") : t("kcal left")}
          color={isOverLimit ? colors.danger : undefined}
          accessibilityLabel={isOverLimit ? t("{n} over limit", { n: excess }) : t("{n} remaining", { n: remaining })}
        />
        <View style={styles.targetInfo}>
          <View>
            <CapsLabel>{t("DAILY TARGET")}</CapsLabel>
            <Text style={[heading(22), { color: colors.text }]}>{dailyTarget.toLocaleString(locale)} kcal</Text>
          </View>
          <View>
            <CapsLabel>{t("CALORIES PLANNED")}</CapsLabel>
            <Text style={[heading(22), { color: isOverLimit ? colors.dangerText : colors.text }]}>
              {totalPlanned.toLocaleString(locale)}
            </Text>
          </View>
          {isOverLimit ? (
            <Pill label={t("{n} over limit", { n: excess })} bg={colors.dangerLight} fg={colors.dangerText} />
          ) : (
            <Pill label={t("{n} remaining", { n: remaining })} bg={colors.primaryLight} fg={colors.primaryText} />
          )}
        </View>
      </Card>
      {isOverLimit && (
        <Text style={[styles.overLimitAlert, { color: colors.dangerText }]}>
          {t("You are {n} kcal above your daily target. Consider removing some meals.", { n: excess })}
        </Text>
      )}

      <SectionHeader title={t("Meals")} />
      <View style={styles.meals}>
        {hasMealPlan ? (
          mealSections.map((section) => {
            const cat = categoryColors(colors, section.category);
            return (
              <Card key={section.category}>
                <View style={styles.mealSectionHeader}>
                  <View style={styles.mealSectionTitleRow}>
                    <View style={[styles.catDot, { backgroundColor: cat.fg }]} />
                    <Text style={[heading(16, "bold"), { color: colors.text }]}>{section.label}</Text>
                  </View>
                  {section.totalKcal > 0 && <Pill label={`${section.totalKcal} kcal`} bg={cat.bg} fg={cat.fg} />}
                </View>
                {section.meals.length > 0 ? (
                  section.meals.map((meal) => (
                    <View key={meal.id} style={styles.mealRow}>
                      <MealThumb meal={meal} size={56} />
                      <View style={styles.flex}>
                        <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
                        <Text style={[styles.mealDetail, { color: colors.secondaryText }]}>
                          {meal.id < 0 ? t("Added by you") : t("{n} ingredients", { n: meal.ingredients.length })}
                        </Text>
                      </View>
                      <Text style={[styles.mealKcal, { color: colors.tertiaryText }]}>{meal.totalCalories} kcal</Text>
                      {meal.id < 0 ? (
                        <TouchableOpacity
                          onPress={() => removeFood(meal.id)}
                          hitSlop={12}
                          accessibilityRole="button"
                          accessibilityLabel={t("Remove {name}", { name: meal.name })}
                        >
                          <Feather name="x" size={18} color={colors.secondaryText} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))
                ) : (
                  <Text style={[styles.mealDetail, { color: colors.secondaryText }]}>
                    {t("No {categoryLower} selected", { category: section.label, categoryLower: section.label.toLowerCase() })}
                  </Text>
                )}
              </Card>
            );
          })
        ) : (
          <Card style={styles.emptyCard}>
            <Image source={require("@/assets/images/food/quinoa-bowl.png")} style={styles.emptyImage} accessible={false} />
            <Text style={[heading(18), { color: colors.text, textAlign: "center" }]}>{t("No meals planned yet")}</Text>
            <Text style={[styles.emptyText, { color: colors.tertiaryText }]}>
              {t("Follow your personalised nutrition plan to maintain your BMI goal.")}
            </Text>
            <Button
              label={t("See Meal Plan")}
              icon="arrow-right"
              onPress={() => router.navigate("/recipes")}
              style={styles.emptyButton}
            />
          </Card>
        )}

        <TouchableOpacity
          onPress={() => setShowAddFood(true)}
          accessibilityRole="button"
          style={[styles.historyLink, { borderColor: colors.border }]}
        >
          <Feather name="plus" size={19} color={colors.primaryText} />
          <Text style={[styles.historyText, { color: colors.primaryText }]}>{t("Add your own food")}</Text>
        </TouchableOpacity>
        {profile.email ? (
          <TouchableOpacity
            onPress={() => router.push("/meal-history")}
            accessibilityRole="button"
            style={[styles.historyLink, { borderColor: colors.border }]}
          >
            <Feather name="clock" size={19} color={colors.primaryText} />
            <Text style={[styles.historyText, { color: colors.primaryText }]}>{t("View Meal History")}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </ScrollView>

    <Sheet
      visible={showOverLimitModal}
      onClose={() => setShowOverLimitModal(false)}
      icon="alert-triangle"
      tone="danger"
      title={t("Daily limit exceeded")}
      message={t("You are {n} kcal above your target. Consider removing some meals.", { n: excess })}
    >
      <Button label={t("OK")} variant="secondary" onPress={() => setShowOverLimitModal(false)} style={styles.flex} />
      <Button
        label={t("Adjust meals")}
        onPress={() => {
          setShowOverLimitModal(false);
          router.navigate("/recipes");
        }}
        style={styles.flex}
      />
    </Sheet>

    <Sheet
      visible={showAddFood}
      onClose={() => setShowAddFood(false)}
      icon="plus"
      tone="info"
      title={t("Add your own food")}
    >
      <View style={styles.form}>
        <Text style={[styles.inputLabel, { color: colors.labelText }]}>{t("Food name")}</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
          placeholder={t("e.g. Ham sandwich")}
          placeholderTextColor={colors.placeholderText}
          value={foodName}
          onChangeText={setFoodName}
          maxLength={60}
          accessibilityLabel={t("Food name")}
        />
        <Text style={[styles.inputLabel, { color: colors.labelText }]}>{t("Calories (kcal)")}</Text>
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBackground }]}
          placeholder="350"
          placeholderTextColor={colors.placeholderText}
          value={foodKcal}
          onChangeText={(text) => setFoodKcal(text.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          maxLength={4}
          accessibilityLabel={t("Calories (kcal)")}
        />
        <CategoryPicker value={foodCategory} onChange={setFoodCategory} />
        <View style={styles.formButtons}>
          <Button label={t("Cancel")} variant="secondary" onPress={() => setShowAddFood(false)} style={styles.flex} />
          <Button label={t("Add")} onPress={addFood} disabled={!canAddFood} style={styles.flex} />
        </View>
      </View>
    </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 24 },
  flex: { flex: 1 },

  header: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 20, paddingTop: 60 },
  subGreeting: { fontSize: 14, marginTop: 3 },
  bmiBadge: { alignItems: "center", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  bmiLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },

  dayStrip: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8, gap: 8 },
  dayChip: { width: 54, height: 72, borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 2 },
  dayChipWeekday: { fontSize: 11, fontWeight: "600" },
  dayDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },

  syncWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
  },
  syncWarningText: { flex: 1, fontSize: 13, fontWeight: "600" },

  targetCard: { marginHorizontal: 20, marginTop: 12, borderRadius: 26, padding: 18, flexDirection: "row", alignItems: "center", gap: 18 },
  targetInfo: { flex: 1, gap: 10 },
  overLimitAlert: { marginHorizontal: 24, marginTop: 10, fontSize: 13, fontWeight: "600" },

  meals: { paddingHorizontal: 20, gap: 10 },
  mealSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  mealSectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  mealRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  mealName: { fontSize: 15, fontWeight: "700" },
  mealDetail: { fontSize: 12, marginTop: 2 },
  mealKcal: { fontSize: 14, fontWeight: "700" },

  emptyCard: { alignItems: "center", gap: 8, padding: 20 },
  emptyImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 4 },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  emptyButton: { alignSelf: "stretch", marginTop: 8 },

  historyLink: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  historyText: { fontSize: 15, fontWeight: "700" },

  form: { flex: 1 },
  inputLabel: { fontSize: 13, fontWeight: "700", marginBottom: 6, marginTop: 4 },
  input: { minHeight: 50, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, fontSize: 16, marginBottom: 8 },
  formButtons: { flexDirection: "row", gap: 10, marginTop: 16 },
});
