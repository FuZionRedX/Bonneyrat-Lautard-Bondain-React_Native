import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CATEGORY_LABELS } from '@/constants/meals';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import type { Meal } from '@/contexts/meal-plan-context';
import { useProfile } from '@/contexts/profile-context';
import mealsData from '@/data/meals.json';
import news from '@/data/news.json';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ALL_MEALS = (mealsData as { meals: Meal[] }).meals;
const RECIPES_PER_DAY = 3;

// Landing page: tip, recipes and articles that change with the day, in the app language.
export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { t, language, locale } = useLanguage();
  const { profile } = useProfile();
  const router = useRouter();
  const [openArticle, setOpenArticle] = useState<string | null>(null);

  const now = new Date();
  // Same number all day long on this device (local calendar day).
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
  const content = news[language];
  const tip = content.tips[day % content.tips.length];
  const recipes = Array.from(
    { length: RECIPES_PER_DAY },
    (_, i) => ALL_MEALS[(day * RECIPES_PER_DAY + i) % ALL_MEALS.length],
  );
  const firstName = profile.fullName.trim().split(/\s+/)[0];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.screenBackground }]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.date, { color: colors.secondaryText }]}>
          {now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          {firstName ? t('Hello, {name}', { name: firstName }) : t('Hello')}
        </Text>
      </View>

      <View style={[styles.tipCard, { backgroundColor: colors.darkCard }]}>
        <Text style={[styles.tipLabel, { color: colors.primary }]}>{t('Tip of the day')}</Text>
        <Text style={[styles.tipText, { color: colors.darkCardText }]}>{tip}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.secondaryText }]} accessibilityRole="header">
            {t('Recipes of the day')}
          </Text>
          <TouchableOpacity accessibilityRole="link" onPress={() => router.navigate('/recipes')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>{t('See all')}</Text>
          </TouchableOpacity>
        </View>
        {recipes.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            style={[styles.card, styles.recipeRow, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}
            onPress={() => router.navigate('/recipes')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityHint={t('Opens the Recipes tab')}
          >
            <View style={styles.flex}>
              <Text style={[styles.chip, { backgroundColor: colors.primaryLight, color: colors.primaryText }]}>
                {t(CATEGORY_LABELS[meal.category])}
              </Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{meal.name}</Text>
              <Text style={[styles.meta, { color: colors.secondaryText }]}>
                {t('{n} ingredients', { n: meal.ingredients.length })}
              </Text>
            </View>
            <Text style={[styles.kcal, { color: colors.primary }]}>{meal.totalCalories} kcal</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.secondaryText }]} accessibilityRole="header">
          {t('Articles')}
        </Text>
        {content.articles.map((article) => {
          const open = openArticle === article.id;
          return (
            <TouchableOpacity
              key={article.id}
              style={[styles.card, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}
              onPress={() => setOpenArticle(open ? null : article.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
            >
              <Text style={[styles.meta, { color: colors.primaryText }]}>
                {article.tag} · {t('{n} min read', { n: article.minutes })}
              </Text>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{article.title}</Text>
              <Text style={[styles.body, { color: colors.tertiaryText }]}>{open ? article.body : article.summary}</Text>
              <Text style={[styles.seeAll, { color: colors.primary }]}>{open ? t('Show less') : t('Read more')}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  date: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  title: { fontSize: 24, fontWeight: '800', marginTop: 2 },

  tipCard: { marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16 },
  tipLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  tipText: { fontSize: 15, lineHeight: 22 },

  section: { marginHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  seeAll: { fontSize: 13, fontWeight: '700', marginTop: 6 },

  card: { borderRadius: 12, padding: 14, marginBottom: 8, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  recipeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chip: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  meta: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  body: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  kcal: { fontSize: 15, fontWeight: '800' },
});
