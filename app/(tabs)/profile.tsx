import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function StatCard({ label, value, unit, emoji, color }: {
  label: string; value: string; unit: string; emoji: string; color: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({ emoji, label, onPress }: { emoji: string; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>JD</Text>
        </View>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.email}>john.doe@example.com</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/profile-setup' as any)}
        >
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* BMI Card */}
      <View style={styles.bmiCard}>
        <View>
          <Text style={styles.bmiTitle}>BODY MASS INDEX</Text>
          <Text style={styles.bmiValue}>22.4</Text>
          <View style={styles.bmiNormalBadge}>
            <Text style={styles.bmiNormalText}>NORMAL</Text>
          </View>
        </View>
        <View style={styles.bmiRight}>
          <Text style={styles.bmiDesc}>
            Your BMI is in the healthy range. Keep up the balanced diet and regular activity!
          </Text>
          {/* BMI scale */}
          <View style={styles.bmiScaleRow}>
            {[
              { label: '0', color: '#2196F3' },
              { label: '18.5', color: '#4CAF50' },
              { label: '25', color: '#FF9800' },
              { label: '30', color: '#F44336' },
              { label: '40+', color: '#B71C1C' },
            ].map((s) => (
              <View key={s.label} style={[styles.scaleSegment, { backgroundColor: s.color }]} />
            ))}
          </View>
        </View>
      </View>

      {/* Health Stats Row */}
      <View style={styles.statsRow}>
        <StatCard label="Heart Rate" value="72" unit="bpm" emoji="❤️" color="#F44336" />
        <StatCard label="Hydration" value="1.8" unit="L" emoji="💧" color="#2196F3" />
        <StatCard label="Weight" value="75" unit="kg" emoji="⚖️" color="#9C27B0" />
      </View>

      {/* Body Info */}
      <View style={styles.bodyInfoCard}>
        <Text style={styles.sectionTitle}>Body Information</Text>
        <View style={styles.bodyInfoRow}>
          <View style={styles.bodyInfoItem}>
            <Text style={styles.bodyInfoLabel}>Age</Text>
            <Text style={styles.bodyInfoValue}>25</Text>
          </View>
          <View style={styles.bodyInfoItem}>
            <Text style={styles.bodyInfoLabel}>Gender</Text>
            <Text style={styles.bodyInfoValue}>Male</Text>
          </View>
          <View style={styles.bodyInfoItem}>
            <Text style={styles.bodyInfoLabel}>Height</Text>
            <Text style={styles.bodyInfoValue}>180 cm</Text>
          </View>
          <View style={styles.bodyInfoItem}>
            <Text style={styles.bodyInfoLabel}>Weight</Text>
            <Text style={styles.bodyInfoValue}>75 kg</Text>
          </View>
        </View>
      </View>

      {/* Primary Goal */}
      <View style={styles.goalCard}>
        <Text style={styles.sectionTitle}>Primary Goal</Text>
        <View style={styles.goalRow}>
          <TouchableOpacity style={styles.goalChip}>
            <Text style={styles.goalChipText}>🏋️ Gain Muscle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.goalChip, styles.goalChipInactive]}>
            <Text style={[styles.goalChipText, styles.goalChipTextInactive]}>⚖️ Lose Weight</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menuCard}>
        <MenuItem emoji="🔔" label="Notifications" />
        <MenuItem emoji="🔗" label="Sync Devices" />
        <MenuItem emoji="⚙️" label="Settings" />
        <MenuItem emoji="❓" label="Help & Support" />
        <MenuItem emoji="🚪" label="Log Out" />
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#fff' },
  name: { fontSize: 20, fontWeight: '800', color: '#1A1A2E' },
  email: { fontSize: 13, color: '#9E9E9E', marginTop: 2 },
  editBtn: {
    marginTop: 12,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editBtnText: { color: '#4CAF50', fontWeight: '700', fontSize: 13 },

  bmiCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bmiTitle: { fontSize: 10, fontWeight: '700', color: '#9E9E9E', letterSpacing: 1 },
  bmiValue: { fontSize: 38, fontWeight: '900', color: '#1A1A2E', marginTop: 2 },
  bmiNormalBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  bmiNormalText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  bmiRight: { flex: 1, justifyContent: 'center' },
  bmiDesc: { fontSize: 12, color: '#555', lineHeight: 17, marginBottom: 8 },
  bmiScaleRow: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 },
  scaleSegment: { flex: 1, borderRadius: 2 },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statUnit: { fontSize: 11, color: '#9E9E9E' },
  statLabel: { fontSize: 11, color: '#555', fontWeight: '600', marginTop: 4, textAlign: 'center' },

  bodyInfoCard: {
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
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  bodyInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bodyInfoItem: { alignItems: 'center' },
  bodyInfoLabel: { fontSize: 11, color: '#9E9E9E', fontWeight: '600' },
  bodyInfoValue: { fontSize: 16, fontWeight: '700', color: '#1A1A2E', marginTop: 4 },

  goalCard: {
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
  goalRow: { flexDirection: 'row', gap: 10 },
  goalChip: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  goalChipInactive: { backgroundColor: '#F5F7FA', borderWidth: 1, borderColor: '#E0E0E0' },
  goalChipText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  goalChipTextInactive: { color: '#555' },

  menuCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  menuEmoji: { fontSize: 18, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, color: '#1A1A2E', fontWeight: '500' },
  menuArrow: { fontSize: 20, color: '#BDBDBD' },
});
