import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

export default function HealthOverviewScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Overview</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* BMI Card */}
      <View style={styles.bmiCard}>
        <Text style={styles.bmiLabel}>BODY MASS INDEX</Text>
        <View style={styles.bmiRow}>
          <Text style={styles.bmiNumber}>22.4</Text>
          <View style={styles.bmiNormalBadge}>
            <Text style={styles.bmiNormalText}>NORMAL</Text>
          </View>
        </View>

        {/* BMI Scale */}
        <View style={styles.bmiScaleWrap}>
          <View style={styles.bmiScaleBar}>
            <View style={[styles.bmiSegment, { backgroundColor: '#2196F3', flex: 18.5 }]} />
            <View style={[styles.bmiSegment, { backgroundColor: '#4CAF50', flex: 6.5 }]} />
            <View style={[styles.bmiSegment, { backgroundColor: '#FF9800', flex: 5 }]} />
            <View style={[styles.bmiSegment, { backgroundColor: '#F44336', flex: 10 }]} />
          </View>
          <View style={styles.bmiScaleLabels}>
            <Text style={styles.bmiScaleLabel}>0</Text>
            <Text style={styles.bmiScaleLabel}>18.5</Text>
            <Text style={styles.bmiScaleLabel}>25</Text>
            <Text style={styles.bmiScaleLabel}>30</Text>
            <Text style={styles.bmiScaleLabel}>40</Text>
          </View>
        </View>

        <Text style={styles.bmiDesc}>
          Your BMI is in the healthy range. Keep up the balanced diet and regular activity!
        </Text>
      </View>

      {/* Vitals Row */}
      <View style={styles.vitalsRow}>
        <View style={[styles.vitalCard, { borderTopColor: '#F44336' }]}>
          <Text style={styles.vitalEmoji}>❤️</Text>
          <Text style={styles.vitalTitle}>Heart Rate</Text>
          <Text style={[styles.vitalValue, { color: '#F44336' }]}>72</Text>
          <Text style={styles.vitalUnit}>bpm</Text>
          <Text style={styles.vitalStatus}>Normal</Text>
        </View>
        <View style={[styles.vitalCard, { borderTopColor: '#2196F3' }]}>
          <Text style={styles.vitalEmoji}>💧</Text>
          <Text style={styles.vitalTitle}>Hydration</Text>
          <Text style={[styles.vitalValue, { color: '#2196F3' }]}>1.8</Text>
          <Text style={styles.vitalUnit}>Litres</Text>
          <Text style={styles.vitalStatus}>Good</Text>
        </View>
      </View>

      {/* Daily Goals */}
      <View style={styles.goalsCard}>
        <Text style={styles.goalsTitle}>📊 Daily Goals</Text>

        <View style={styles.goalItem}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalName}>🚶 Steps</Text>
            <Text style={styles.goalValues}>7,500 / 10,000</Text>
          </View>
          <ProgressBar value={7500} max={10000} color="#2196F3" />
        </View>

        <View style={styles.goalItem}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalName}>⏱ Active Minutes</Text>
            <Text style={styles.goalValues}>28 / 45</Text>
          </View>
          <ProgressBar value={28} max={45} color="#FF9800" />
        </View>

        <View style={styles.goalItem}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalName}>🔥 Calories Burned</Text>
            <Text style={styles.goalValues}>420 / 600</Text>
          </View>
          <ProgressBar value={420} max={600} color="#F44336" />
        </View>
      </View>

      {/* Weekly Summary */}
      <View style={styles.weeklyCard}>
        <Text style={styles.goalsTitle}>📅 Weekly Summary</Text>
        <View style={styles.weekDays}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
            <View key={i} style={styles.dayCol}>
              <View style={[styles.dayBar, { height: [60, 80, 50, 90, 40, 70, 30][i], backgroundColor: i < 5 ? '#4CAF50' : '#E0E0E0' }]} />
              <Text style={styles.dayLabel}>{day}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { fontSize: 22, color: '#1A1A2E' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },

  bmiCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bmiLabel: { fontSize: 11, fontWeight: '700', color: '#9E9E9E', letterSpacing: 1, marginBottom: 8 },
  bmiRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  bmiNumber: { fontSize: 52, fontWeight: '900', color: '#1A1A2E' },
  bmiNormalBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bmiNormalText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  bmiScaleWrap: { marginBottom: 12 },
  bmiScaleBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2, marginBottom: 4 },
  bmiSegment: { height: 8 },
  bmiScaleLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  bmiScaleLabel: { fontSize: 10, color: '#9E9E9E' },
  bmiDesc: { fontSize: 13, color: '#555', lineHeight: 19 },

  vitalsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  vitalEmoji: { fontSize: 24, marginBottom: 6 },
  vitalTitle: { fontSize: 12, color: '#9E9E9E', fontWeight: '600', marginBottom: 8 },
  vitalValue: { fontSize: 34, fontWeight: '900' },
  vitalUnit: { fontSize: 12, color: '#9E9E9E', marginBottom: 6 },
  vitalStatus: { fontSize: 12, color: '#4CAF50', fontWeight: '700', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },

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
  goalsTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 16 },
  goalItem: { marginBottom: 14 },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  goalName: { fontSize: 13, fontWeight: '600', color: '#555' },
  goalValues: { fontSize: 13, color: '#9E9E9E' },
  progressTrack: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },

  weeklyCard: {
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
  weekDays: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 100 },
  dayCol: { alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  dayBar: { width: 24, borderRadius: 6 },
  dayLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '600' },
});
