import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Feather from '@expo/vector-icons/Feather';

import {
  Card,
  CapsLabel,
  CategoryChip,
  heading,
  MealThumb,
  ProgressRing,
  SectionHeader,
  softShadow,
} from '@/components/ui/kit';
import { toLocalDateKey } from '@/constants/meals';
import { Colors } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { planMeals, useMealPlan, type Meal } from '@/contexts/meal-plan-context';
import { getProfileInitials, useProfile } from '@/contexts/profile-context';
import { getNutrition } from '@/lib/nutrition';
import mealsData from '@/data/meals.json';
import news from '@/data/news.json';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ALL_MEALS = (mealsData as { meals: Meal[] }).meals;
const RECIPES_PER_DAY = 3;

// Landing page: today's plan, then a tip, recipes and articles that change with the day.
export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { t, language, locale } = useLanguage();
  const { profile } = useProfile();
  const { selectedMeals, planDate, history } = useMealPlan();
  const router = useRouter();
  const [openArticle, setOpenArticle] = useState<string | null>(null);
  // Today's local date; refreshed when the app comes back on screen, so a night in
  // the background never leaves yesterday's tip and recipes.
  const [today, setToday] = useState(() => toLocalDateKey(new Date()));
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setToday(toLocalDateKey(new Date()));
    });
    return () => subscription.remove();
  }, []);

  const [year, month, date] = today.split('-').map(Number);
  // Same number all day long on this device (local calendar day).
  const day = Date.UTC(year, month - 1, date) / 86_400_000;
  // Capitalize only the first letter: French and Spanish keep month names lowercase.
  const dateLabel = new Date(year, month - 1, date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const content = news[language];
  const tip = content.tips[day % content.tips.length];
  const recipes = Array.from(
    { length: RECIPES_PER_DAY },
    (_, i) => ALL_MEALS[(day * RECIPES_PER_DAY + i) % ALL_MEALS.length],
  );
  const firstName = profile.fullName.trim().split(/\s+/)[0];

  // Today's plan summary. The context holds the live plan of planDate; when the
  // Planner shows another day, today's plan comes from the loaded history.
  const todayIds = history?.find((e) => e.saved_at.slice(0, 10) === today)?.meal_ids ?? {};
  const todayMeals = planDate === today ? selectedMeals : planMeals(todayIds);
  const planned = todayMeals.reduce((sum, m) => sum + m.totalCalories, 0);
  const mealCount = todayMeals.length;
  const dailyTarget = getNutrition(profile).dailyTarget ?? 2000;
  const progress = planned / dailyTarget;
  const left = Math.max(dailyTarget - planned, 0);
  const initials = profile.fullName.trim() ? getProfileInitials(profile.fullName) : '';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.screenBackground }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={[styles.date, { color: colors.secondaryText }]}>
            {dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
          </Text>
          <Text style={[heading(28), { color: colors.text }]} accessibilityRole="header">
            {firstName ? t('Hello, {name}', { name: firstName }) : t('Hello')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.navigate('/profile')}
          accessibilityRole="button"
          accessibilityLabel={t('Profile')}
          style={[styles.avatar, { backgroundColor: colors.brandLime }]}
        >
          {initials ? (
            <Text style={[heading(17), { color: '#06150D' }]}>{initials}</Text>
          ) : (
            <Feather name="user" size={22} color="#06150D" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.navigate('/planner')}
        accessibilityRole="button"
        accessibilityHint={t('Opens the Planner tab')}
        style={styles.todayWrap}
      >
        <Card style={styles.todayCard}>
          <ProgressRing
            progress={progress}
            size={104}
            stroke={11}
            label={`${Math.round(progress * 100)}%`}
            sublabel={t('planned')}
            color={planned > dailyTarget ? colors.danger : undefined}
          />
          <View style={styles.flex}>
            <CapsLabel>{t("Today's plan")}</CapsLabel>
            <Text style={[heading(22), { color: colors.text, marginTop: 2 }]}>
              {planned.toLocaleString(locale)}{' '}
              <Text style={[heading(14, 'bold'), { color: colors.secondaryText }]}>
                / {dailyTarget.toLocaleString(locale)} kcal
              </Text>
            </Text>
            <Text style={[styles.meta, { color: colors.tertiaryText }]}>
              {mealCount === 0
                ? t('Nothing planned yet')
                : mealCount === 1
                  ? t('{kcal} kcal left · 1 meal planned', { kcal: left.toLocaleString(locale) })
                  : t('{kcal} kcal left · {n} meals planned', { kcal: left.toLocaleString(locale), n: mealCount })}
            </Text>
            <View style={styles.linkRow}>
              <Text style={[styles.link, { color: colors.primaryText }]}>{t('Open planner')}</Text>
              <Feather name="chevron-right" size={16} color={colors.primaryText} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>

      <View style={[styles.tipCard, { backgroundColor: colors.tipBackground }]}>
        <View style={styles.tipIcon}>
          <Feather name="feather" size={19} color={colors.tipLabel} />
        </View>
        <View style={styles.flex}>
          <CapsLabel color={colors.tipLabel}>{t('Tip of the day')}</CapsLabel>
          <Text style={[styles.tipText, { color: colors.tipText }]}>{tip}</Text>
        </View>
      </View>

      <SectionHeader title={t('Recipes of the day')} actionLabel={t('See all')} onAction={() => router.navigate('/recipes')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recipeStrip}>
        {recipes.map((meal) => (
          <TouchableOpacity
            key={meal.id}
            style={[styles.recipeCard, { backgroundColor: colors.cardBackground }, softShadow(colors)]}
            onPress={() => router.navigate('/recipes')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`${meal.name}, ${meal.totalCalories} kcal`}
            accessibilityHint={t('Opens the Recipes tab')}
          >
            <MealThumb meal={meal} size={148} radius={18} />
            <CategoryChip category={meal.category} />
            <Text style={[heading(15, 'bold'), { color: colors.text }]} numberOfLines={2}>
              {meal.name}
            </Text>
            <View style={styles.recipeMeta}>
              <Text style={[styles.meta, { color: colors.secondaryText, marginTop: 0 }]}>
                {t('{n} ingredients', { n: meal.ingredients.length })}
              </Text>
              <Text style={[styles.kcal, { color: colors.primaryText }]}>{meal.totalCalories} kcal</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <SectionHeader title={t('Articles')} />
      <View style={styles.articles}>
        {content.articles.map((article, i) => {
          const open = openArticle === article.id;
          return (
            <TouchableOpacity
              key={article.id}
              style={[styles.article, { backgroundColor: colors.cardBackground }, softShadow(colors)]}
              onPress={() => setOpenArticle(open ? null : article.id)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
            >
              <View style={styles.articleTop}>
                <MealThumb meal={ARTICLE_IMAGES[i % ARTICLE_IMAGES.length]} size={72} radius={16} />
                <View style={styles.flex}>
                  <CapsLabel color={colors.primaryText}>
                    {article.tag} · {t('{n} min read', { n: article.minutes })}
                  </CapsLabel>
                  <Text style={[heading(15, 'bold'), { color: colors.text, marginTop: 2 }]}>{article.title}</Text>
                </View>
              </View>
              <Text style={[styles.body, { color: colors.tertiaryText }]}>{open ? article.body : article.summary}</Text>
              <Text style={[styles.link, { color: colors.primaryText }]}>{open ? t('Show less') : t('Read more')}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

// Illustrations shown next to the articles (picked like meal images).
const ARTICLE_IMAGES = [
  { name: 'Greek Yogurt Parfait', category: 'breakfast' },
  { name: 'Quinoa Veggie Bowl', category: 'lunch' },
  { name: 'Smoothie Bowl', category: 'breakfast' },
] as const;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 24 },
  flex: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 60 },
  date: { fontSize: 13, fontWeight: '600' },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  todayWrap: { marginHorizontal: 20, marginTop: 18 },
  todayCard: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 26 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 6 },
  link: { fontSize: 13, fontWeight: '700', marginTop: 6 },

  tipCard: { marginHorizontal: 20, marginTop: 14, borderRadius: 24, padding: 16, flexDirection: 'row', gap: 14 },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(142,219,90,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: { fontSize: 15, lineHeight: 22, marginTop: 4 },

  recipeStrip: { paddingHorizontal: 20, paddingBottom: 8, gap: 12 },
  recipeCard: { width: 168, borderRadius: 24, padding: 10, gap: 8 },
  recipeMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kcal: { fontSize: 12, fontWeight: '800' },

  articles: { paddingHorizontal: 20, gap: 10 },
  article: { borderRadius: 22, padding: 12 },
  articleTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meta: { fontSize: 13, marginTop: 4 },
  body: { fontSize: 14, lineHeight: 20, marginTop: 10 },
});
