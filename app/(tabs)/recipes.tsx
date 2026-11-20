import mealsData from '@/data/meals.json';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Feather from '@expo/vector-icons/Feather';

import {
  Button,
  Card,
  CapsLabel,
  categoryColors,
  heading,
  MealThumb,
  ScreenTitle,
  SectionHeader,
  Sheet,
  softShadow,
} from '@/components/ui/kit';
import { Colors } from '@/constants/theme';
import { saveMealHistory } from '@/lib/api';
import { CATEGORY_LABELS, CATEGORY_ORDER, toLocalDateKey } from '@/constants/meals';
import { getNutrition } from '@/lib/nutrition';
import { findBestGlobalCombo, planWeek } from '@/lib/suggest';
import { Meal, MealCategory, useMealPlan } from '@/contexts/meal-plan-context';
import { useProfile } from '@/contexts/profile-context';
import { useLanguage } from '@/contexts/language-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';

interface MealsFile {
  meals: Meal[];
}

const CALORIE_SPLIT: Record<MealCategory, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};

const MEALS = (mealsData as MealsFile).meals;

export default function RecipesScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { t } = useLanguage();
  const { selectedByCategory, setSelectedByCategory, selectedMeals, planDate, loadFailed, history } =
    useMealPlan();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showWeekConfirm, setShowWeekConfirm] = useState(false);
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MealCategory>('breakfast');

  // Per-category list of sorted meal-id arrays used in the last 7 days,
  // from the history MealPlanProvider already loaded.
  const recentHistory = useMemo(() => {
    const recent: Record<MealCategory, number[][]> = {
      breakfast: [], lunch: [], dinner: [], snack: [],
    };
    const todayKey = toLocalDateKey(new Date());
    for (const entry of history ?? []) {
      // Days planned ahead with "Week" are not "recently eaten".
      if (entry.saved_at.slice(0, 10) > todayKey) continue;
      for (const cat of CATEGORY_ORDER) {
        const ids = (entry.meal_ids[cat] ?? []).slice().sort((a: number, b: number) => a - b);
        if (ids.length > 0) recent[cat].push(ids);
      }
    }
    return recent;
  }, [history]);

  const { bmi, bmr, needsWeightLoss, dailyTarget: dailyCalories } = getNutrition(profile);

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

  function applySuggestedCombo() {
    if (!suggestedCombo) return;
    const next: Partial<Record<MealCategory, number[]>> = {};
    CATEGORY_ORDER.forEach((category) => {
      next[category] = suggestedCombo[category].map((m) => m.id);
    });
    // Foods the user added themselves stay; MealPlanProvider saves today's plan.
    setSelectedByCategory((prev) => ({ ...next, custom: prev.custom }));
    setShowApplyModal(true);
  }

  function confirmApplyForWeek() {
    if (!categoryTargets || !dailyCalories || !profile.email) return;
    setShowWeekConfirm(false);

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    // A different combo for each day from today through Sunday.
    const week = planWeek(allMealsByCategory, categoryTargets, dailyCalories, recentHistory, daysUntilSunday + 1);

    // The day being planned is saved by MealPlanProvider; save the rest of the week here.
    const saves: Promise<boolean>[] = [];
    week.forEach((combo, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateKey = toLocalDateKey(date);
      const next: Partial<Record<MealCategory, number[]>> = {};
      CATEGORY_ORDER.forEach((category) => {
        next[category] = combo[category].map((m) => m.id);
      });
      if (dateKey === planDate) {
        setSelectedByCategory((prev) => ({ ...next, custom: prev.custom }));
      } else {
        saves.push(saveMealHistory(profile.email, profile.password, next, dateKey));
      }
    });
    Promise.all(saves).then((results) => {
      if (results.every(Boolean)) {
        setShowWeekModal(true);
      } else {
        Alert.alert(
          t("Week plan not saved"),
          t("Some days could not be saved. Check your connection and try again."),
        );
      }
    });
  }

  const finalPlanCalories = selectedMeals.reduce((total, meal) => total + meal.totalCalories, 0);
  const hasMetrics = bmi !== null && bmr !== null && dailyCalories !== null;
  const bmiLabel = bmi === null ? t("N/A") : bmi.toFixed(1);
  const bmrLabel = bmr === null ? t("N/A") : Math.round(bmr).toString();
  const adviceText = !hasMetrics
    ? t("Add age, height, weight, and gender in your profile to generate a personalized meal plan.")
    : needsWeightLoss
      ? t("You should aim to lose weight. Choose one or more options per category to build your daily plan.")
      : t("You do not currently need to lose weight. Continue with your current meal plan.");

  const adviceTone = !hasMetrics
    ? { bg: colors.cardMuted, fg: colors.tertiaryText, icon: 'info' as const }
    : needsWeightLoss
      ? { bg: colors.breakfastBg, fg: colors.breakfastText, icon: 'target' as const }
      : { bg: colors.primaryLight, fg: colors.primaryText, icon: 'check-circle' as const };

  const stat = (label: string, value: string) => (
    <View style={[styles.stat, { backgroundColor: colors.cardMuted }]}>
      <Text style={[styles.statLabel, { color: colors.secondaryText }]}>{label}</Text>
      <Text style={[heading(20), { color: colors.text }]}>{value}</Text>
    </View>
  );

  const categoryMeals = allMealsByCategory[activeCategory];
  const activeIds = selectedByCategory[activeCategory] ?? [];

  return (
    <>
    <ScrollView
      style={[styles.container, { backgroundColor: colors.screenBackground }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle title={t("Recipes")} subtitle={t("BMI and BMR based recommendations")} />

      {loadFailed ? (
        <Text style={[styles.syncWarning, { color: colors.dangerText }]}>
          {t("Could not reach the server. Changes to this day are not saved.")}
        </Text>
      ) : null}

      <Card style={styles.block}>
        <Text style={[heading(16, 'bold'), { color: colors.text, marginBottom: 12 }]} accessibilityRole="header">
          {t("Your Health Baseline")}
        </Text>
        <View style={styles.stats}>
          {stat(t("BMI"), bmiLabel)}
          {stat("BMR", bmrLabel)}
          {stat(t("Target"), dailyCalories === null ? t("N/A") : dailyCalories.toLocaleString())}
        </View>
        <View style={[styles.advice, { backgroundColor: adviceTone.bg }]}>
          <Feather name={adviceTone.icon} size={18} color={adviceTone.fg} />
          <View style={styles.flex}>
            {!needsWeightLoss && hasMetrics ? (
              <Text style={[styles.adviceTitle, { color: adviceTone.fg }]}>{t("Current Plan Is Appropriate")}</Text>
            ) : null}
            <Text style={[styles.adviceText, { color: adviceTone.fg }]}>
              {!needsWeightLoss && hasMetrics
                ? t("Keep following your current meal rhythm and monitor your progress weekly.")
                : adviceText}
            </Text>
          </View>
        </View>
      </Card>

      {needsWeightLoss && categoryTargets && suggestedCombo && (
        <>
          <View style={[styles.combo, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
            <View style={styles.comboHead}>
              <Feather name="zap" size={16} color={colors.primaryText} />
              <CapsLabel color={colors.primaryText}>{t("Suggested Combo")}</CapsLabel>
            </View>
            <Text style={[styles.comboSub, { color: colors.tertiaryText }]}>
              {t("Best match for your {n} kcal target", { n: dailyCalories ?? "" })} · {t("Total")} {suggestedComboCalories} kcal
            </Text>
            <View style={styles.comboRow}>
              {CATEGORY_ORDER.map((category) => {
                const meals = suggestedCombo[category];
                if (!meals.length) return null;
                const kcal = meals.reduce((sum, m) => sum + m.totalCalories, 0);
                return (
                  <View key={category} style={styles.comboItem} accessible accessibilityLabel={`${t(CATEGORY_LABELS[category])}: ${meals.map((m) => m.name).join(', ')}, ${kcal} kcal`}>
                    <MealThumb meal={meals[0]} size={58} radius={18} />
                    <Text style={[styles.comboCat, { color: colors.tertiaryText }]}>{t(CATEGORY_LABELS[category])}</Text>
                    <Text style={[styles.comboKcal, { color: colors.text }]}>{kcal}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.comboButtons}>
              <Button label={t("Apply")} onPress={applySuggestedCombo} style={styles.flex} />
              <Button label={t("Week")} icon="repeat" variant="secondary" onPress={() => setShowWeekConfirm(true)} style={styles.flex} />
            </View>
          </View>

          <SectionHeader
            title={t("Recipes")}
            right={
              selectedMeals.length > 0 ? (
                <TouchableOpacity accessibilityRole="button" onPress={() => setSelectedByCategory({})} hitSlop={10} style={styles.unselect}>
                  <Text style={[styles.unselectText, { color: colors.secondaryText }]}>{t("Unselect All")}</Text>
                </TouchableOpacity>
              ) : undefined
            }
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {CATEGORY_ORDER.map((category) => {
              const active = category === activeCategory;
              const count = (selectedByCategory[category] ?? []).length;
              return (
                <TouchableOpacity
                  key={category}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  onPress={() => setActiveCategory(category)}
                  style={[
                    styles.tab,
                    active ? { backgroundColor: colors.text } : [{ backgroundColor: colors.cardBackground }, softShadow(colors)],
                  ]}
                >
                  <Text style={[styles.tabText, { color: active ? colors.screenBackground : colors.tertiaryText }]}>
                    {t(CATEGORY_LABELS[category])}
                  </Text>
                  {count > 0 ? (
                    <View style={[styles.tabCount, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.tabCountText, { color: colors.onPrimary }]}>{count}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <Text style={[styles.tabHint, { color: colors.secondaryText }]}>
            {t("Target: {kcal} kcal · {n} options", { kcal: categoryTargets[activeCategory], n: categoryMeals.length })}
          </Text>

          <View style={styles.options}>
            {categoryMeals.map((meal) => {
              const selected = activeIds.includes(meal.id);
              return (
                <TouchableOpacity
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  key={meal.id}
                  activeOpacity={0.8}
                  style={[
                    styles.option,
                    selected
                      ? { backgroundColor: colors.selectedBackground, borderColor: colors.primary }
                      : [{ backgroundColor: colors.cardBackground, borderColor: 'transparent' }, softShadow(colors)],
                  ]}
                  onPress={() =>
                    setSelectedByCategory((previous) => {
                      const prev = previous[activeCategory] ?? [];
                      const next = prev.includes(meal.id) ? prev.filter((id) => id !== meal.id) : [...prev, meal.id];
                      return { ...previous, [activeCategory]: next };
                    })
                  }
                >
                  <MealThumb meal={meal} size={64} />
                  <View style={styles.flex}>
                    <Text style={[styles.optionName, { color: colors.text }]}>{meal.name}</Text>
                    <Text style={[styles.optionMeta, { color: colors.secondaryText }]}>
                      {t("{n} ingredients", { n: meal.ingredients.length })} · {meal.totalCalories} kcal
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.check,
                      selected ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.border },
                    ]}
                  >
                    <Feather name={selected ? 'check' : 'plus'} size={16} color={selected ? colors.onPrimary : colors.secondaryText} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.finalPlan, { backgroundColor: colors.tipBackground }]}>
            <CapsLabel color={colors.tipLabel}>{t("Final Daily Meal Plan")}</CapsLabel>
            {selectedMeals.map((meal) => {
              const cat = categoryColors(colors, meal.category);
              return (
                <View key={meal.id} style={styles.finalRow}>
                  <View style={[styles.finalDot, { backgroundColor: cat.bg }]} />
                  <Text style={[styles.finalMeal, { color: colors.tipText }]} numberOfLines={1}>{meal.name}</Text>
                  <Text style={[styles.finalKcal, { color: colors.tipLabel }]}>{meal.totalCalories} kcal</Text>
                </View>
              );
            })}
            <View style={[styles.finalDivider, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
            <View style={styles.finalRow}>
              <Text style={[heading(16, 'bold'), styles.flex, { color: colors.tipText }]}>{t("Total")}</Text>
              <Text style={[heading(20), { color: colors.brandLime }]}>{finalPlanCalories} kcal</Text>
            </View>
          </View>
        </>
      )}

      {!hasMetrics && (
        <Card style={[styles.block, styles.empty]}>
          <Image source={require('@/assets/images/food/chicken-salad.png')} style={styles.emptyImage} accessible={false} />
          <Text style={[styles.emptyText, { color: colors.tertiaryText }]}>
            {t("Complete your profile details to unlock BMI and BMR based meal recommendations.")}
          </Text>
          <Button label={t("Profile")} icon="user" onPress={() => router.navigate('/profile')} style={styles.emptyButton} />
        </Card>
      )}

      {hasMetrics && needsWeightLoss && selectedMeals.length === 0 && (
        <Card style={[styles.block, styles.empty]}>
          <Text style={[styles.emptyText, { color: colors.tertiaryText }]}>{t("No matching meals found for your calorie targets.")}</Text>
        </Card>
      )}

      {profile.email ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.push('/meal-history')}
          style={[styles.historyLink, { borderColor: colors.border }]}
        >
          <Feather name="clock" size={19} color={colors.primaryText} />
          <Text style={[styles.historyText, { color: colors.primaryText }]}>{t("View Meal History")}</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>

    <Sheet
      visible={showApplyModal}
      onClose={() => setShowApplyModal(false)}
      icon="check"
      title={t("Combo Applied")}
      message={t("The suggested meal plan has been applied to your daily plan.")}
    >
      <Button label={t("OK")} onPress={() => setShowApplyModal(false)} style={styles.flex} />
    </Sheet>

    <Sheet
      visible={showWeekConfirm}
      onClose={() => setShowWeekConfirm(false)}
      icon="calendar"
      tone="info"
      title={t("Apply for the week?")}
      message={t("This will save a different suggested meal plan for each day from today through Sunday.")}
    >
      <Button label={t("Cancel")} variant="secondary" onPress={() => setShowWeekConfirm(false)} style={styles.flex} />
      <Button label={t("Confirm")} onPress={confirmApplyForWeek} style={styles.flex} />
    </Sheet>

    <Sheet
      visible={showWeekModal}
      onClose={() => setShowWeekModal(false)}
      icon="calendar"
      title={t("Week Plan Applied")}
      message={t("A different meal plan has been saved for each day from today through Sunday.")}
    >
      <Button label={t("OK")} onPress={() => setShowWeekModal(false)} style={styles.flex} />
    </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 24 },
  flex: { flex: 1 },
  syncWarning: { marginHorizontal: 20, marginTop: 12, fontSize: 13, fontWeight: '600' },
  block: { marginHorizontal: 20, marginTop: 16 },

  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, borderRadius: 16, padding: 10 },
  statLabel: { fontSize: 11, fontWeight: '700' },
  advice: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 12, padding: 12, borderRadius: 16 },
  adviceTitle: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  adviceText: { fontSize: 13, lineHeight: 19 },

  combo: { marginHorizontal: 20, marginTop: 12, borderRadius: 26, padding: 16, borderWidth: 1 },
  comboHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  comboSub: { fontSize: 13, marginTop: 4 },
  comboRow: { flexDirection: 'row', marginVertical: 14 },
  comboItem: { flex: 1, alignItems: 'center', gap: 4 },
  comboCat: { fontSize: 11, fontWeight: '700' },
  comboKcal: { fontSize: 12, fontWeight: '700' },
  comboButtons: { flexDirection: 'row', gap: 8 },

  unselect: { paddingVertical: 8 },
  unselectText: { fontSize: 13, fontWeight: '700' },
  tabs: { paddingHorizontal: 20, gap: 8, paddingBottom: 6 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 16, borderRadius: 999 },
  tabText: { fontSize: 14, fontWeight: '700' },
  tabCount: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  tabCountText: { fontSize: 11, fontWeight: '800' },
  tabHint: { marginHorizontal: 24, marginTop: 6, marginBottom: 10, fontSize: 13, fontWeight: '600' },

  options: { paddingHorizontal: 20, gap: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 20, borderWidth: 2 },
  optionName: { fontSize: 15, fontWeight: '700' },
  optionMeta: { fontSize: 12, marginTop: 3 },
  check: { width: 30, height: 30, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },

  finalPlan: { marginHorizontal: 20, marginTop: 16, borderRadius: 24, padding: 18, gap: 8 },
  finalRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  finalDot: { width: 10, height: 10, borderRadius: 5 },
  finalMeal: { flex: 1, fontSize: 14 },
  finalKcal: { fontSize: 13, fontWeight: '700' },
  finalDivider: { height: 1, marginVertical: 4 },

  empty: { alignItems: 'center', gap: 10, padding: 20 },
  emptyImage: { width: 110, height: 110, borderRadius: 55 },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  emptyButton: { alignSelf: 'stretch' },

  historyLink: {
    marginHorizontal: 20,
    marginTop: 16,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  historyText: { fontSize: 15, fontWeight: '700' },
});
