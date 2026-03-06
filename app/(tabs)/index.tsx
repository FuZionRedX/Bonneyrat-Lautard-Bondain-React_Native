import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Meal {
  name: string;
  detail: string;
  kcal: number;
  planned?: boolean;
}

interface MealSection {
  type: string;
  totalKcal: number;
  meals: Meal[];
}

const MEAL_SECTIONS: MealSection[] = [
  {
    type: 'Breakfast',
    totalKcal: 380,
    meals: [{ name: 'Avocado Toast & Egg', detail: '1 serving • 380 kcal', kcal: 380 }],
  },
  {
    type: 'Lunch',
    totalKcal: 540,
    meals: [
      { name: 'Quinoa Buddha Bowl', detail: '1 bowl • 455 kcal', kcal: 455 },
      { name: 'Roasted Almonds', detail: '15 pieces • 85 kcal', kcal: 85 },
    ],
  },
  {
    type: 'Dinner',
    totalKcal: 0,
    meals: [{ name: 'Grilled Salmon & Greens', detail: '1 serving • 420 kcal', kcal: 420, planned: true }],
  },
];

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

export default function PlannerScreen() {
  const router = useRouter();
  const dailyTarget = 2000;
  const consumed = 1340;
  const remaining = dailyTarget - consumed;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning, John 👋</Text>
          <Text style={styles.subGreeting}>Let&apos;s track your nutrition today</Text>
        </View>
        <TouchableOpacity style={styles.bmiBadge} onPress={() => router.push('/health-overview' as any)}>
          <Text style={styles.bmiValue}>22.4</Text>
          <Text style={styles.bmiLabel}>BMI</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Target Card */}
      <View style={styles.targetCard}>
        <View style={styles.targetHeader}>
          <Text style={styles.targetTitle}>DAILY TARGET</Text>
          <Text style={styles.targetKcal}>{dailyTarget.toLocaleString()} kcal</Text>
        </View>
        <View style={styles.targetRow}>
          <Text style={styles.targetConsumed}>
            CALORIES CONSUMED{'\n'}
            <Text style={styles.targetConsumedValue}>{consumed.toLocaleString()} / {dailyTarget.toLocaleString()}</Text>
          </Text>
          <Text style={styles.remainingBadge}>{remaining} remaining</Text>
        </View>
        <ProgressBar value={consumed} max={dailyTarget} color="#4CAF50" />
      </View>

      {/* Meal Sections */}
      {MEAL_SECTIONS.map((section) => (
        <View key={section.type} style={styles.mealSection}>
          <View style={styles.mealSectionHeader}>
            <Text style={styles.mealSectionTitle}>🥗 {section.type}</Text>
            {section.totalKcal > 0 && (
              <Text style={styles.mealSectionKcal}>{section.totalKcal} kcal</Text>
            )}
            {section.meals[0]?.planned && (
              <Text style={styles.plannedBadge}>Planned</Text>
            )}
          </View>
          {section.meals.map((meal) => (
            <View key={meal.name} style={styles.mealRow}>
              <View style={styles.mealIcon}>
                <Text style={styles.mealIconText}>🍽</Text>
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealDetail}>{meal.detail}</Text>
              </View>
              <TouchableOpacity style={styles.mealEditBtn}>
                <Text style={styles.mealEditText}>✎</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ))}

      {/* Daily Goals */}
      <View style={styles.goalsCard}>
        <Text style={styles.goalsTitle}>📊 Daily Goals</Text>
        <View style={styles.goalRow}>
          <Text style={styles.goalLabel}>Steps</Text>
          <Text style={styles.goalValue}>7,500 / 10,000</Text>
        </View>
        <ProgressBar value={7500} max={10000} color="#2196F3" />
        <View style={[styles.goalRow, { marginTop: 12 }]}>
          <Text style={styles.goalLabel}>Active Minutes</Text>
          <Text style={styles.goalValue}>28 / 45</Text>
        </View>
        <ProgressBar value={28} max={45} color="#FF9800" />
        <View style={[styles.goalRow, { marginTop: 12 }]}>
          <Text style={styles.goalLabel}>Calories Burned</Text>
          <Text style={styles.goalValue}>420 / 600</Text>
        </View>
        <ProgressBar value={420} max={600} color="#F44336" />
      </View>

      {/* Ready for lunch recommendation */}
      <View style={styles.recommendCard}>
        <View>
          <Text style={styles.recommendTitle}>Ready for lunch?</Text>
          <Text style={styles.recommendSub}>
            Follow your personalised nutrition plan to maintain your BMI goal.
          </Text>
          <Text style={styles.recommendNote}>3 meals tailored for you</Text>
        </View>
        <TouchableOpacity style={styles.recommendBtn}>
          <Text style={styles.recommendBtnText}>See Meal Plan  →</Text>
        </TouchableOpacity>
      </View>

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
  greeting: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  subGreeting: { fontSize: 13, color: '#9E9E9E', marginTop: 2 },
  bmiBadge: {
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bmiValue: { fontSize: 20, fontWeight: '800', color: '#4CAF50' },
  bmiLabel: { fontSize: 11, color: '#4CAF50', fontWeight: '600' },

  targetCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  targetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  targetTitle: { fontSize: 11, fontWeight: '700', color: '#9E9E9E', letterSpacing: 1 },
  targetKcal: { fontSize: 22, fontWeight: '800', color: '#1A1A2E' },
  targetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  targetConsumed: { fontSize: 11, color: '#9E9E9E', fontWeight: '600' },
  targetConsumedValue: { fontSize: 15, color: '#1A1A2E', fontWeight: '700' },
  remainingBadge: { fontSize: 12, color: '#4CAF50', fontWeight: '700', backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  progressTrack: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },

  mealSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  mealSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  mealSectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  mealSectionKcal: { fontSize: 13, color: '#9E9E9E', fontWeight: '600' },
  plannedBadge: { fontSize: 12, color: '#9E9E9E', fontStyle: 'italic' },
  mealRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  mealIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  mealIconText: { fontSize: 18 },
  mealInfo: { flex: 1 },
  mealName: { fontSize: 14, fontWeight: '600', color: '#1A1A2E' },
  mealDetail: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  mealEditBtn: { padding: 6 },
  mealEditText: { fontSize: 16, color: '#9E9E9E' },

  goalsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  goalsTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  goalLabel: { fontSize: 13, color: '#555', fontWeight: '600' },
  goalValue: { fontSize: 13, color: '#9E9E9E' },

  recommendCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  recommendTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 6 },
  recommendSub: { fontSize: 13, color: '#B0BEC5', marginBottom: 4, lineHeight: 18 },
  recommendNote: { fontSize: 12, color: '#4CAF50', fontWeight: '600', marginBottom: 14 },
  recommendBtn: { backgroundColor: '#4CAF50', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  recommendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
