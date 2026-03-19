import mealsData from '@/data/meals.json';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface MealIngredient {
  name: string;
  quantity: string;
  calories: number;
}

interface Meal {
  id: number;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  totalCalories: number;
  calorieBand: string;
  ingredients: MealIngredient[];
}

interface MealsFile {
  meals: Meal[];
}

type CategoryFilter = 'all' | Meal['category'];

const CATEGORIES: Array<{ label: string; value: CategoryFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snacks', value: 'snack' },
];

const MEALS = (mealsData as MealsFile).meals;

function getMealEmoji(category: Meal['category']) {
  if (category === 'breakfast') return '🥣';
  if (category === 'lunch') return '🥗';
  if (category === 'dinner') return '🍽️';
  return '🍎';
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function RecipesScreen() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const filtered = MEALS.filter((meal) => {
    const matchCat = activeCategory === 'all' || meal.category === activeCategory;
    const ingredientBlob = meal.ingredients
      .map((ingredient) => ingredient.name)
      .join(' ')
      .toLowerCase();
    const matchSearch = meal.name.toLowerCase().includes(search.toLowerCase());
    const matchIngredient = ingredientBlob.includes(search.toLowerCase());
    return matchCat && (matchSearch || matchIngredient);
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recipes</Text>
        <Text style={styles.subtitle}>Discover healthy meals</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          placeholderTextColor="#BDBDBD"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContainer}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[styles.catChip, activeCategory === cat.value && styles.catChipActive]}
            onPress={() => setActiveCategory(cat.value)}
          >
            <Text
              style={[
                styles.catChipText,
                activeCategory === cat.value && styles.catChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recipe List */}
      <View style={styles.list}>
        {filtered.map((meal) => (
          <TouchableOpacity key={meal.id} style={styles.card}>
            <View style={styles.recipeEmoji}>
              <Text style={styles.emojiText}>{getMealEmoji(meal.category)}</Text>
            </View>
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeName}>{meal.name}</Text>
              <Text style={styles.recipeMeta}>
                {toTitleCase(meal.category)}  •  {meal.ingredients.length} ingredients  •  {toTitleCase(meal.calorieBand)} cal
              </Text>
            </View>
            <View style={styles.kcalBadge}>
              <Text style={styles.kcalBadgeText}>{meal.totalCalories}</Text>
              <Text style={styles.kcalBadgeLabel}>kcal</Text>
            </View>
          </TouchableOpacity>
        ))}
        {filtered.length === 0 && (
          <Text style={styles.empty}>No recipes found</Text>
        )}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1A1A2E' },
  subtitle: { fontSize: 14, color: '#9E9E9E', marginTop: 2 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A2E' },

  catScroll: { marginBottom: 8 },
  catContainer: { paddingHorizontal: 16, gap: 8 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  catChipActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  catChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
  catChipTextActive: { color: '#fff' },

  list: { paddingHorizontal: 16, marginTop: 8 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  recipeEmoji: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emojiText: { fontSize: 24 },
  recipeInfo: { flex: 1 },
  recipeName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  recipeMeta: { fontSize: 12, color: '#9E9E9E', marginTop: 3 },
  kcalBadge: { alignItems: 'center' },
  kcalBadgeText: { fontSize: 16, fontWeight: '800', color: '#4CAF50' },
  kcalBadgeLabel: { fontSize: 10, color: '#9E9E9E' },

  empty: { textAlign: 'center', color: '#BDBDBD', marginTop: 40, fontSize: 15 },
});
