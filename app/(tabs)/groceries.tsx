import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
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
  const [dismissed, setDismissed] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    setDismissed(false);
    setCheckedKeys(new Set());
  }, [selectedMeals]);

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

  const visibleItems = dismissed ? [] : items;
  const grouped = groupByMeal(visibleItems);
  const checkedCount = visibleItems.filter((i) => checkedKeys.has(i.key)).length;

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.screenBackground }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Groceries</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              {visibleItems.length > 0
                ? `${checkedCount} / ${visibleItems.length} items checked`
                : 'No meals selected yet'}
            </Text>
          </View>
          {visibleItems.length > 0 && (
            <View style={styles.headerRight}>
              <View style={[styles.progressCircle, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Text style={[styles.progressPct, { color: colors.primary }]}>
                  {Math.round((checkedCount / visibleItems.length) * 100)}%
                </Text>
              </View>
              <TouchableOpacity style={[styles.clearBtn, { backgroundColor: '#FF5252' }]} onPress={() => setShowClearModal(true)}>
                <Text style={styles.clearBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {visibleItems.length > 0 && (
          <View style={[styles.progressTrackWrap, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.progressTrack, { backgroundColor: colors.progressTrack }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(checkedCount / visibleItems.length) * 100}%` as any, backgroundColor: colors.progressFill },
                ]}
              />
            </View>
          </View>
        )}

        {visibleItems.length > 0 ? (
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

      <Modal visible={showClearModal} transparent animationType="fade" onRequestClose={() => setShowClearModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
            <Text style={styles.modalIcon}>&#10003;</Text>
            <Text style={[styles.modalTitle, { color: colors.text }]}>All done shopping?</Text>
            <Text style={[styles.modalMessage, { color: colors.secondaryText }]}>
              This will clear your grocery list. Your meal plan will not be affected.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.progressTrack }]}
                onPress={() => setShowClearModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#FF5252' }]}
                onPress={() => { setDismissed(true); setShowClearModal(false); }}
              >
                <Text style={styles.modalButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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

  headerRight: { alignItems: 'center', gap: 8 },
  clearBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  clearBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalCard: {
    width: '100%',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalIcon: { fontSize: 40, color: '#4CAF50', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  modalMessage: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { paddingHorizontal: 28, paddingVertical: 10, borderRadius: 20 },
  modalButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
