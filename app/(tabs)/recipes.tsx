import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Recipe {
  id: number;
  name: string;
  category: string;
  kcal: number;
  time: string;
  emoji: string;
}

const CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const RECIPES: Recipe[] = [
  { id: 1, name: 'Avocado Toast & Egg', category: 'Breakfast', kcal: 380, time: '10 min', emoji: '🥑' },
  { id: 2, name: 'Quinoa Buddha Bowl', category: 'Lunch', kcal: 455, time: '20 min', emoji: '🥗' },
  { id: 3, name: 'Grilled Salmon & Greens', category: 'Dinner', kcal: 420, time: '25 min', emoji: '🐟' },
  { id: 4, name: 'Greek Yogurt Parfait', category: 'Breakfast', kcal: 220, time: '5 min', emoji: '🥛' },
  { id: 5, name: 'Roasted Almonds', category: 'Snacks', kcal: 85, time: '5 min', emoji: '🥜' },
  { id: 6, name: 'Chicken Caesar Salad', category: 'Lunch', kcal: 390, time: '15 min', emoji: '🥙' },
  { id: 7, name: 'Pasta Primavera', category: 'Dinner', kcal: 510, time: '30 min', emoji: '🍝' },
  { id: 8, name: 'Berry Smoothie', category: 'Snacks', kcal: 140, time: '5 min', emoji: '🍓' },
];

export default function RecipesScreen() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = RECIPES.filter((r) => {
    const matchCat = activeCategory === 'All' || r.category === activeCategory;
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
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
            key={cat}
            style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.catChipText, activeCategory === cat && styles.catChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recipe List */}
      <View style={styles.list}>
        {filtered.map((recipe) => (
          <TouchableOpacity key={recipe.id} style={styles.card}>
            <View style={styles.recipeEmoji}>
              <Text style={styles.emojiText}>{recipe.emoji}</Text>
            </View>
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeName}>{recipe.name}</Text>
              <Text style={styles.recipeMeta}>
                {recipe.category}  •  {recipe.time}  •  {recipe.kcal} kcal
              </Text>
            </View>
            <View style={styles.kcalBadge}>
              <Text style={styles.kcalBadgeText}>{recipe.kcal}</Text>
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
