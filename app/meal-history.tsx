import mealsData from '@/data/meals.json';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getMealHistory, MealHistoryEntry } from '@/constants/api';
import { CATEGORY_LABELS, CATEGORY_ORDER, getMealEmoji } from '@/constants/meals';
import { Meal } from '@/contexts/meal-plan-context';
import { useProfile } from '@/contexts/profile-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface MealsFile {
  meals: Meal[];
}

const MEALS = (mealsData as MealsFile).meals;
const MEALS_BY_ID = new Map(MEALS.map((m) => [m.id, m]));

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

function toDateKey(dateStr: string) {
  return new Date(dateStr).toISOString().split('T')[0];
}

export default function MealHistoryScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [history, setHistory] = useState<MealHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile.email) {
      setLoading(false);
      return;
    }
    getMealHistory(profile.email)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [profile.email]);

  const { futureEntries, pastEntries } = useMemo(() => {
    const todayKey = toDateKey(new Date().toISOString());
    const sorted = [...history].sort(
      (a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime(),
    );
    const future: MealHistoryEntry[] = [];
    const past: MealHistoryEntry[] = [];
    for (const entry of sorted) {
      if (toDateKey(entry.saved_at) > todayKey) {
        future.push(entry);
      } else {
        past.push(entry);
      }
    }
    // Future: nearest day first (ascending)
    future.sort((a, b) => new Date(a.saved_at).getTime() - new Date(b.saved_at).getTime());
    return { futureEntries: future, pastEntries: past };
  }, [history]);

  function renderDayCard(entry: MealHistoryEntry, isFuture: boolean) {
    const dayTotal = CATEGORY_ORDER.reduce((sum, cat) => {
      const ids = entry.meal_ids[cat] ?? [];
      return sum + ids.reduce((s, id) => s + (MEALS_BY_ID.get(id)?.totalCalories ?? 0), 0);
    }, 0);

    return (
      <View
        key={entry.saved_at}
        style={[
          styles.dayCard,
          { backgroundColor: colors.cardBackground, shadowColor: colors.shadow },
          isFuture && { opacity: 0.55 },
        ]}
      >
        <View style={styles.dayHeader}>
          <View style={styles.dayHeaderLeft}>
            <Text style={[styles.dayDate, { color: isFuture ? colors.secondaryText : colors.text }]}>
              {formatDate(entry.saved_at)}
            </Text>
            {isFuture && (
              <View style={[styles.previewBadge, { backgroundColor: colors.borderLight }]}>
                <Text style={[styles.previewBadgeText, { color: colors.secondaryText }]}>Planned</Text>
              </View>
            )}
          </View>
          <Text style={[styles.dayTotal, { color: isFuture ? colors.secondaryText : colors.primary }]}>
            {dayTotal} kcal
          </Text>
        </View>

        {CATEGORY_ORDER.map((cat) => {
          const ids = entry.meal_ids[cat] ?? [];
          if (ids.length === 0) return null;
          const meals = ids.map((id) => MEALS_BY_ID.get(id)).filter(Boolean) as Meal[];
          const catTotal = meals.reduce((s, m) => s + m.totalCalories, 0);

          return (
            <View key={cat} style={[styles.categoryBlock, { borderTopColor: colors.borderLight }]}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryEmoji}>{getMealEmoji(cat)}</Text>
                <Text style={[styles.categoryLabel, { color: colors.secondaryText }]}>
                  {CATEGORY_LABELS[cat]}
                </Text>
                <Text style={[styles.categoryKcal, { color: isFuture ? colors.secondaryText : colors.primary }]}>
                  {catTotal} kcal
                </Text>
              </View>
              {meals.map((meal) => (
                <View key={meal.id} style={styles.mealRow}>
                  <Text style={[styles.mealName, { color: isFuture ? colors.secondaryText : colors.text }]}>
                    {meal.name}
                  </Text>
                  <Text style={[styles.mealKcal, { color: colors.secondaryText }]}>
                    {meal.totalCalories} kcal
                  </Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.screenBackground }]} showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 12 }}>
          <Text style={{ fontSize: 22, color: colors.text }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Meal History</Text>
      </View>

      {loading && (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      )}

      {!loading && futureEntries.length === 0 && pastEntries.length === 0 && (
        <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            No meal history yet. Your saved meal plans will appear here.
          </Text>
        </View>
      )}

      {/* Future / upcoming entries */}
      {!loading && futureEntries.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.secondaryText }]}>Upcoming</Text>
          </View>
          {futureEntries.map((entry) => renderDayCard(entry, true))}
        </>
      )}

      {/* Divider between future and past */}
      {!loading && (futureEntries.length > 0 || pastEntries.length > 0) && (
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {futureEntries.length > 0 ? 'Today & Past' : 'History'}
          </Text>
          <View style={[styles.sectionDivider, { backgroundColor: colors.border }]} />
        </View>
      )}

      {/* Past / today entries */}
      {!loading && pastEntries.map((entry) => renderDayCard(entry, false))}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },

  emptyCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, textAlign: 'center' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 4,
    gap: 10,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },
  sectionDivider: { flex: 1, height: 1 },

  dayCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    padding: 14,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayDate: { fontSize: 15, fontWeight: '700' },
  dayTotal: { fontSize: 14, fontWeight: '800' },

  previewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  previewBadgeText: { fontSize: 11, fontWeight: '700' },

  categoryBlock: {
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryEmoji: { fontSize: 16 },
  categoryLabel: { flex: 1, fontSize: 12, fontWeight: '600', marginLeft: 6 },
  categoryKcal: { fontSize: 12, fontWeight: '700' },

  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 22,
    marginBottom: 4,
  },
  mealName: { fontSize: 13, flex: 1, paddingRight: 8 },
  mealKcal: { fontSize: 12 },
});
