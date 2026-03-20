import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useMealPlan } from '@/contexts/meal-plan-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface GroceryItem {
  key: string;
  name: string;
  qty: string;
  mealName: string;
}

function groupByMeal(items: GroceryItem[]) {
  return items.reduce<Record<string, GroceryItem[]>>((acc, item) => {
    if (!acc[item.mealName]) acc[item.mealName] = [];
    acc[item.mealName].push(item);
    return acc;
  }, {});
}

export default function GroceriesScreen() {
  const { selectedMeals } = useMealPlan();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());

  const items = useMemo<GroceryItem[]>(() => {
    return selectedMeals.flatMap((meal) =>
      meal.ingredients.map((ing) => ({
        key: `${meal.id}-${ing.name}`,
        name: ing.name,
        qty: ing.quantity,
        mealName: meal.name,
      }))
    );
  }, [selectedMeals]);

  const toggle = (key: string) =>
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const grouped = groupByMeal(items);
  const checkedCount = items.filter((i) => checkedKeys.has(i.key)).length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.screenBackground }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Groceries</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            {items.length > 0
              ? `${checkedCount} / ${items.length} items checked`
              : 'No meals selected yet'}
          </Text>
        </View>
        {items.length > 0 && (
          <View style={[styles.progressCircle, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <Text style={[styles.progressPct, { color: colors.primary }]}>
              {Math.round((checkedCount / items.length) * 100)}%
            </Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      {items.length > 0 && (
        <View style={[styles.progressTrackWrap, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.progressTrack, { backgroundColor: colors.progressTrack }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${(checkedCount / items.length) * 100}%` as any, backgroundColor: colors.progressFill },
              ]}
            />
          </View>
        </View>
      )}

      {/* Grouped by meal */}
      {items.length > 0 ? (
        Object.entries(grouped).map(([mealName, mealItems]) => (
          <View key={mealName} style={styles.categorySection}>
            <Text style={[styles.categoryTitle, { color: colors.secondaryText }]}>{mealName}</Text>
            {mealItems.map((item) => {
              const checked = checkedKeys.has(item.key);
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.itemRow, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}
                  onPress={() => toggle(item.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, { borderColor: colors.border }, checked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    {checked && <Text style={styles.checkmark}>&#10003;</Text>}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: colors.text }, checked && { textDecorationLine: 'line-through', color: colors.secondaryText }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemQty, { color: colors.secondaryText }]}>{item.qty}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
            Select meals in the Recipes tab to generate your grocery list.
          </Text>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 2 },
  progressCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  progressPct: { fontSize: 14, fontWeight: '800' },

  progressTrackWrap: { paddingHorizontal: 16, paddingVertical: 8 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  categorySection: { marginHorizontal: 16, marginTop: 16 },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },

  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600' },
  itemQty: { fontSize: 12, marginTop: 2 },

  emptyCard: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
