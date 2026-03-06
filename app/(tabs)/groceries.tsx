import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

  const toggle = (id: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));

  const grouped = groupByCategory(items);
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Groceries</Text>
          <Text style={styles.subtitle}>
            {checkedCount} / {items.length} items checked
          </Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressPct}>
            {Math.round((checkedCount / items.length) * 100)}%
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrackWrap}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${(checkedCount / items.length) * 100}%` as any },
            ]}
          />
        </View>
      </View>

      {/* Grouped Items */}
      {Object.entries(grouped).map(([category, catItems]) => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>{category}</Text>
          {catItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemRow}
              onPress={() => toggle(item.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                {item.checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
                  {item.name}
                </Text>
                <Text style={styles.itemQty}>{item.qty}</Text>
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
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A2E' },
  subtitle: { fontSize: 14, color: '#9E9E9E', marginTop: 2 },
  progressCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  progressPct: { fontSize: 14, fontWeight: '800', color: '#4CAF50' },

  progressTrackWrap: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff' },
  progressTrack: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: '#4CAF50', borderRadius: 3 },

  categorySection: { marginHorizontal: 16, marginTop: 16 },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9E9E9E',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },

  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1A1A2E' },
  itemNameChecked: { textDecorationLine: 'line-through', color: '#BDBDBD' },
  itemQty: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
});
