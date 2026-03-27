import mealsData from '@/data/meals.json';
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
import { Meal, MealCategory } from '@/contexts/meal-plan-context';
import { useProfile } from '@/contexts/profile-context';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';

interface MealsFile {
  meals: Meal[];
}

const MEALS = (mealsData as MealsFile).meals;
const MEALS_BY_ID = new Map(MEALS.map((m) => [m.id, m]));

const CATEGORY_ORDER: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const CATEGORY_LABELS: Record<MealCategory, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

function getMealEmoji(category: MealCategory) {
  if (category === 'breakfast') return '\u{1F963}';
  if (category === 'lunch') return '\u{1F957}';
  if (category === 'dinner') return '\u{1F37D}\uFE0F';
  return '\u{1F34E}';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
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

  // Sort entries newest first
  const sortedHistory = useMemo(
    () => [...history].sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime()),
    [history],
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.screenBackground }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Meal History</Text>
      </View>

      {loading && (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      )}

      {!loading && sortedHistory.length === 0 && (
        <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            No meal history yet. Your saved meal plans will appear here.
          </Text>
        </View>
      )}

      {!loading &&
        sortedHistory.map((entry, index) => {
          const dayTotal = CATEGORY_ORDER.reduce((sum, cat) => {
            const ids = entry.meal_ids[cat] ?? [];
            return sum + ids.reduce((s, id) => s + (MEALS_BY_ID.get(id)?.totalCalories ?? 0), 0);
          }, 0);

          return (
            <View
              key={`${entry.saved_at}-${index}`}
              style={[styles.dayCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}
            >
              <View style={styles.dayHeader}>
                <Text style={[styles.dayDate, { color: colors.text }]}>{formatDate(entry.saved_at)}</Text>
                <Text style={[styles.dayTotal, { color: colors.primary }]}>{dayTotal} kcal</Text>
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
                      <Text style={[styles.categoryKcal, { color: colors.primary }]}>{catTotal} kcal</Text>
                    </View>
                    {meals.map((meal) => (
                      <View key={meal.id} style={styles.mealRow}>
                        <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
                        <Text style={[styles.mealKcal, { color: colors.secondaryText }]}>{meal.totalCalories} kcal</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          );
        })}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  backIcon: { fontSize: 22 },
  headerTitle: { fontSize: 18, fontWeight: '800' },

  emptyCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, textAlign: 'center' },

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
  dayDate: { fontSize: 15, fontWeight: '700' },
  dayTotal: { fontSize: 14, fontWeight: '800' },

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
