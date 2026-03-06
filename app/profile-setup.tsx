import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface FormData {
  email: string;
  password: string;
  fullName: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  goal: string;
}

const GENDERS = ['Male', 'Female', 'Other'];
const GOALS = ['Lose Weight', 'Gain Muscle', 'Stay Fit', 'Eat Healthier'];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.stepDot, i < current ? styles.stepDotDone : i === current - 1 ? styles.stepDotActive : styles.stepDotInactive]}
        />
      ))}
    </View>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#BDBDBD"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
      />
    </View>
  );
}

export default function ProfileSetupScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    email: '',
    password: '',
    fullName: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    goal: '',
  });

  const set = (key: keyof FormData) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const next = () => {
    if (step < 3) setStep((s) => s + 1);
    else router.replace('/(tabs)');
  };
  const back = () => {
    if (step > 1) setStep((s) => s - 1);
    else router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Profile Details</Text>
            <Text style={styles.headerStep}>Step {step} of 3</Text>
          </View>
          <StepIndicator current={step} total={3} />
        </View>

        <View style={styles.body}>
          {/* Step 1: Account Info */}
          {step === 1 && (
            <>
              <Text style={styles.sectionHeading}>Tell us about yourself</Text>
              <Text style={styles.sectionSubtitle}>
                This helps us calculate your daily caloric needs and body mass index.
              </Text>

              <InputField
                label="Email Address"
                placeholder="example@email.com"
                value={form.email}
                onChangeText={set('email')}
                keyboardType="email-address"
              />
              <InputField
                label="Password"
                placeholder="••••••••"
                value={form.password}
                onChangeText={set('password')}
                secureTextEntry
              />
              <InputField
                label="Full Name"
                placeholder="John Doe"
                value={form.fullName}
                onChangeText={set('fullName')}
              />
            </>
          )}

          {/* Step 2: Body Info */}
          {step === 2 && (
            <>
              <Text style={styles.sectionHeading}>Your body details</Text>
              <Text style={styles.sectionSubtitle}>
                We use this information to personalise your nutrition plan.
              </Text>

              <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                  <InputField
                    label="Age"
                    placeholder="25"
                    value={form.age}
                    onChangeText={set('age')}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.fieldLabel}>Gender</Text>
                  <View style={styles.selectRow}>
                    {GENDERS.map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.selectChip, form.gender === g && styles.selectChipActive]}
                        onPress={() => set('gender')(g)}
                      >
                        <Text style={[styles.selectChipText, form.gender === g && styles.selectChipTextActive]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                  <InputField
                    label="Height (cm)"
                    placeholder="180"
                    value={form.height}
                    onChangeText={set('height')}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <InputField
                    label="Weight (kg)"
                    placeholder="75"
                    value={form.weight}
                    onChangeText={set('weight')}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </>
          )}

          {/* Step 3: Goal */}
          {step === 3 && (
            <>
              <Text style={styles.sectionHeading}>Your primary goal</Text>
              <Text style={styles.sectionSubtitle}>
                Choose the goal that best describes what you want to achieve.
              </Text>

              <View style={styles.goalGrid}>
                {GOALS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.goalCard, form.goal === g && styles.goalCardActive]}
                    onPress={() => set('goal')(g)}
                  >
                    <Text style={styles.goalEmoji}>
                      {g === 'Lose Weight' ? '⚖️' : g === 'Gain Muscle' ? '🏋️' : g === 'Stay Fit' ? '🏃' : '🥗'}
                    </Text>
                    <Text style={[styles.goalCardText, form.goal === g && styles.goalCardTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.backBtn} onPress={back}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nextBtn} onPress={next}>
          <Text style={styles.nextBtnText}>
            {step < 3 ? 'Continue →' : 'Finish Setup ✓'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A2E' },
  headerStep: { fontSize: 13, color: '#9E9E9E', fontWeight: '600' },

  stepIndicator: { flexDirection: 'row', gap: 8 },
  stepDot: { height: 6, flex: 1, borderRadius: 3 },
  stepDotDone: { backgroundColor: '#4CAF50' },
  stepDotActive: { backgroundColor: '#4CAF50' },
  stepDotInactive: { backgroundColor: '#E0E0E0' },

  body: { padding: 20 },

  sectionHeading: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', marginBottom: 8 },
  sectionSubtitle: { fontSize: 14, color: '#9E9E9E', marginBottom: 24, lineHeight: 20 },

  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A2E',
  },

  rowFields: { flexDirection: 'row', marginBottom: 0 },

  selectRow: { flexDirection: 'column', gap: 6, marginTop: 6 },
  selectChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  selectChipActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  selectChipText: { fontSize: 12, fontWeight: '600', color: '#555' },
  selectChipTextActive: { color: '#fff' },

  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  goalCard: {
    width: '46%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  goalCardActive: { borderColor: '#4CAF50', backgroundColor: '#E8F5E9' },
  goalEmoji: { fontSize: 30, marginBottom: 8 },
  goalCardText: { fontSize: 14, fontWeight: '700', color: '#555', textAlign: 'center' },
  goalCardTextActive: { color: '#2E7D32' },

  bottomNav: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  backBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  backBtnText: { fontSize: 15, fontWeight: '700', color: '#555' },
  nextBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#4CAF50',
  },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
