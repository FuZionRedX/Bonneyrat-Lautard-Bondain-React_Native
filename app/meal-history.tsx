import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BackHeader, Card, CapsLabel, categoryColors, heading, MealThumb, Pill, ProgressBar } from '@/components/ui/kit';
import { getMealHistory, MealHistoryEntry } from '@/lib/api';
import { getNutrition } from '@/lib/nutrition';
import { CATEGORY_LABELS, toLocalDateKey } from '@/constants/meals';
import { planMeals } from '@/contexts/meal-plan-context';
import { useProfile } from '@/contexts/profile-context';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

// saved_at is the server's local "YYYY-MM-DD HH:MM:SS"; the "T" makes every JS engine parse it as local time.
function formatDate(dateStr: string, locale: string) {
  const d = new Date(dateStr.replace(' ', 'T'));
  return d.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

export default function MealHistoryScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { locale, t } = useLanguage();

  const [history, setHistory] = useState<MealHistoryEntry[] | null>(null);
  const loading = !!profile.email && history === null;

  useEffect(() => {
    if (!profile.email) return;
    getMealHistory(profile.email, profile.password).then((entries) => setHistory(entries ?? []));
  }, [profile.email, profile.password]);

  const { futureEntries, pastEntries } = useMemo(() => {
    const todayKey = toLocalDateKey(new Date());
    // "YYYY-MM-DD HH:MM:SS" strings sort correctly as plain text.
    const sorted = [...(history ?? [])].sort((a, b) => b.saved_at.localeCompare(a.saved_at));
    const future: MealHistoryEntry[] = [];
    const past: MealHistoryEntry[] = [];
    for (const entry of sorted) {
      if (entry.saved_at.slice(0, 10) > todayKey) {
        future.push(entry);
      } else {
        past.push(entry);
      }
    }
    // Future: nearest day first (ascending)
    future.reverse();
    return { futureEntries: future, pastEntries: past };
  }, [history]);

  const dailyTarget = getNutrition(profile).dailyTarget ?? 2000;

  function renderDayCard(entry: MealHistoryEntry, isFuture: boolean) {
    const meals = planMeals(entry.meal_ids);
    const dayTotal = meals.reduce((sum, m) => sum + m.totalCalories, 0);
    const over = dayTotal > dailyTarget;

    return (
      <Card key={entry.saved_at} style={styles.dayCard}>
        <View style={styles.dayHeader}>
          <View style={styles.flex}>
            <Text style={[heading(17), { color: colors.text }]}>
              {formatDate(entry.saved_at, locale).replace(/^./, (c) => c.toUpperCase())}
            </Text>
            {isFuture ? <Pill label={t("Planned")} bg={colors.cardMuted} fg={colors.tertiaryText} style={styles.planned} /> : null}
          </View>
          <Text style={[styles.dayTotal, { color: over ? colors.dangerText : colors.text }]}>
            {dayTotal.toLocaleString(locale)}
            <Text style={[styles.dayTarget, { color: colors.secondaryText }]}> / {dailyTarget.toLocaleString(locale)} kcal</Text>
          </Text>
        </View>
        <View style={styles.bar}>
          <ProgressBar progress={dayTotal / dailyTarget} height={6} color={over ? colors.danger : isFuture ? colors.secondaryText : colors.primary} />
        </View>

        {meals.map((meal) => {
          const cat = categoryColors(colors, meal.category);
          return (
            <View key={`${meal.category}-${meal.id}`} style={styles.mealRow}>
              <MealThumb meal={meal} size={44} radius={14} />
              <View style={styles.flex}>
                <Text style={[styles.mealName, { color: colors.text }]} numberOfLines={1}>{meal.name}</Text>
                <Text style={[styles.mealCat, { color: cat.fg }]}>{t(CATEGORY_LABELS[meal.category])}</Text>
              </View>
              <Text style={[styles.mealKcal, { color: colors.tertiaryText }]}>{meal.totalCalories} kcal</Text>
            </View>
          );
        })}
      </Card>
    );
  }

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.screenBackground }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <BackHeader title={t("Meal History")} onBack={() => router.back()} backLabel={t("Go back")} />

      {loading && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}

      {!loading && futureEntries.length === 0 && pastEntries.length === 0 && (
        <Card style={[styles.dayCard, styles.empty]}>
          <Image source={require('@/assets/images/food/parfait.png')} style={styles.emptyImage} accessible={false} />
          <Text style={[styles.emptyText, { color: colors.tertiaryText }]}>
            {t("No meal history yet. Your saved meal plans will appear here.")}
          </Text>
        </Card>
      )}

      {!loading && futureEntries.length > 0 && (
        <>
          <CapsLabel style={styles.sectionTitle}>{t("Upcoming")}</CapsLabel>
          {futureEntries.map((entry) => renderDayCard(entry, true))}
        </>
      )}

      {!loading && pastEntries.length > 0 && (
        <>
          <CapsLabel style={styles.sectionTitle}>{futureEntries.length > 0 ? t("Today & Past") : t("History")}</CapsLabel>
          {pastEntries.map((entry) => renderDayCard(entry, false))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 32 },
  loader: { marginTop: 40 },
  sectionTitle: { marginHorizontal: 24, marginTop: 18, marginBottom: 2 },

  dayCard: { marginHorizontal: 20, marginTop: 10 },
  dayHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  planned: { marginTop: 4 },
  dayTotal: { fontSize: 14, fontWeight: '800' },
  dayTarget: { fontSize: 12, fontWeight: '600' },
  bar: { marginTop: 10, marginBottom: 6 },

  mealRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  mealName: { fontSize: 14, fontWeight: '600' },
  mealCat: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  mealKcal: { fontSize: 13, fontWeight: '700' },

  empty: { alignItems: 'center', gap: 10, padding: 20 },
  emptyImage: { width: 110, height: 110, borderRadius: 55 },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
