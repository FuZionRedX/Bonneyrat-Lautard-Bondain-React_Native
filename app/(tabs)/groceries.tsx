import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface GroceryItem {
  id: number;
  name: string;
  qty: string;
  category: string;
  checked: boolean;
}

const INITIAL_ITEMS: GroceryItem[] = [
  { id: 1, name: 'Avocado', qty: '3 pcs', category: 'Fruits & Veggies', checked: false },
  { id: 2, name: 'Eggs', qty: '12 pcs', category: 'Dairy & Eggs', checked: true },
  { id: 3, name: 'Quinoa', qty: '500g', category: 'Grains', checked: false },
  { id: 4, name: 'Salmon Fillet', qty: '400g', category: 'Meat & Fish', checked: false },
  { id: 5, name: 'Baby Spinach', qty: '200g', category: 'Fruits & Veggies', checked: true },
  { id: 6, name: 'Greek Yogurt', qty: '2 cups', category: 'Dairy & Eggs', checked: false },
  { id: 7, name: 'Almonds', qty: '150g', category: 'Snacks', checked: false },
  { id: 8, name: 'Mixed Berries', qty: '250g', category: 'Fruits & Veggies', checked: false },
  { id: 9, name: 'Whole Grain Bread', qty: '1 loaf', category: 'Grains', checked: false },
  { id: 10, name: 'Olive Oil', qty: '1 bottle', category: 'Pantry', checked: true },
];

function groupByCategory(items: GroceryItem[]) {
  return items.reduce<Record<string, GroceryItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

export default function GroceriesScreen() {
  const [items, setItems] = useState<GroceryItem[]>(INITIAL_ITEMS);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const toggle = (id: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));

  const grouped = groupByCategory(items);
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.screenBackground }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Groceries</Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            {checkedCount} / {items.length} items checked
          </Text>
        </View>
        <View style={[styles.progressCircle, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
          <Text style={[styles.progressPct, { color: colors.primary }]}>
            {Math.round((checkedCount / items.length) * 100)}%
          </Text>
        </View>
      </View>

      {/* Progress bar */}
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

      {/* Grouped Items */}
      {Object.entries(grouped).map(([category, catItems]) => (
        <View key={category} style={styles.categorySection}>
          <Text style={[styles.categoryTitle, { color: colors.secondaryText }]}>{category}</Text>
          {catItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.itemRow, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}
              onPress={() => toggle(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, { borderColor: colors.border }, item.checked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                {item.checked && <Text style={styles.checkmark}>&#10003;</Text>}
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: colors.text }, item.checked && { textDecorationLine: 'line-through', color: colors.secondaryText }]}>
                  {item.name}
                </Text>
                <Text style={[styles.itemQty, { color: colors.secondaryText }]}>{item.qty}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}

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
});
