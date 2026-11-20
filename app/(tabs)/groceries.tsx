import React, { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Feather from '@expo/vector-icons/Feather';

import { Button, Card, heading, ProgressBar, ScreenTitle, Sheet, softShadow } from '@/components/ui/kit';
import { Colors } from '@/constants/theme';
import { useMealPlan } from '@/contexts/meal-plan-context';
import { useLanguage } from '@/contexts/language-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface GroceryItem {
  key: string;
  name: string;
  // Each meal that needs it. Quantities are free text ("2 large"), so they are listed, not summed.
  uses: { qty: string; mealName: string }[];
}

export default function GroceriesScreen() {
  const { selectedMeals } = useMealPlan();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { t } = useLanguage();
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // New meal selection -> fresh list (React's "adjust state on prop change" pattern, no effect needed).
  const [listFor, setListFor] = useState(selectedMeals);
  if (listFor !== selectedMeals) {
    setListFor(selectedMeals);
    setDismissed(false);
    setCheckedKeys(new Set());
  }

  // One row per ingredient, merged across meals (same name, ignoring case and spaces).
  const items = useMemo<GroceryItem[]>(() => {
    const byName = new Map<string, GroceryItem>();
    for (const meal of selectedMeals) {
      for (const ing of meal.ingredients) {
        const key = ing.name.trim().toLowerCase();
        const item = byName.get(key) ?? { key, name: ing.name.trim(), uses: [] };
        item.uses.push({ qty: ing.quantity, mealName: meal.name });
        byName.set(key, item);
      }
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedMeals]);

  const toggle = (key: string) =>
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const visibleItems = dismissed ? [] : items;
  const checkedCount = visibleItems.filter((i) => checkedKeys.has(i.key)).length;

  const progress = visibleItems.length > 0 ? checkedCount / visibleItems.length : 0;

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.screenBackground }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle
          title={t("Groceries")}
          subtitle={visibleItems.length > 0 ? t("Shopping list") : t("No meals selected yet")}
        />

        {visibleItems.length > 0 ? (
          <>
            <Card style={styles.block}>
              <View style={styles.progressHead}>
                <Text style={[heading(22), { color: colors.text }]}>
                  {t("{checked} / {total} items checked", { checked: checkedCount, total: visibleItems.length })}
                </Text>
                <Text style={[heading(16, 'bold'), { color: colors.primaryText }]}>{Math.round(progress * 100)}%</Text>
              </View>
              <ProgressBar progress={progress} />
            </Card>

            <View style={[styles.list, { backgroundColor: colors.cardBackground }, softShadow(colors)]}>
              {visibleItems.map((item, index) => {
                const checked = checkedKeys.has(item.key);
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.itemRow, index < visibleItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                    onPress={() => toggle(item.key)}
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    accessibilityLabel={`${item.name}, ${item.uses.map((u) => t("{qty} for {meal}", { qty: u.qty, meal: u.mealName })).join(', ')}`}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        checked ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.border },
                      ]}
                    >
                      {checked && <Feather name="check" size={16} color={colors.onPrimary} />}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text
                        style={[
                          styles.itemName,
                          { color: colors.text },
                          checked && { textDecorationLine: 'line-through', color: colors.secondaryText },
                        ]}
                      >
                        {item.name}
                      </Text>
                      {item.uses.map((u, i) => (
                        <Text key={i} style={[styles.itemQty, { color: colors.secondaryText }]}>
                          {t("{qty} for {meal}", { qty: u.qty, meal: u.mealName })}
                        </Text>
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button label={t("Done")} icon="check-circle" onPress={() => setShowClearModal(true)} style={styles.doneButton} />
          </>
        ) : (
          <Card style={[styles.block, styles.empty]}>
            <Image source={require('@/assets/images/food/hummus.png')} style={styles.emptyImage} accessible={false} />
            <Text style={[styles.emptyText, { color: colors.tertiaryText }]}>
              {t("Select meals in the Recipes tab to generate your grocery list.")}
            </Text>
          </Card>
        )}
      </ScrollView>

      <Sheet
        visible={showClearModal}
        onClose={() => setShowClearModal(false)}
        icon="shopping-bag"
        title={t("All done shopping?")}
        message={t("This will clear your grocery list. Your meal plan will not be affected.")}
      >
        <Button label={t("Cancel")} variant="secondary" onPress={() => setShowClearModal(false)} style={styles.flex} />
        <Button
          label={t("Clear")}
          onPress={() => {
            setDismissed(true);
            setShowClearModal(false);
          }}
          style={styles.flex}
        />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 24 },
  flex: { flex: 1 },
  block: { marginHorizontal: 20, marginTop: 16 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, gap: 8 },

  list: { marginHorizontal: 20, marginTop: 14, borderRadius: 22, paddingHorizontal: 12, paddingVertical: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 10 },
  checkbox: { width: 26, height: 26, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },
  itemQty: { fontSize: 12, marginTop: 2 },

  doneButton: { marginHorizontal: 20, marginTop: 14 },

  empty: { alignItems: 'center', gap: 10, padding: 20 },
  emptyImage: { width: 110, height: 110, borderRadius: 55 },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
