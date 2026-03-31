import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { saveProfile } from "@/constants/api";
import { Colors } from "@/constants/theme";
import {
  ProfileData,
  maskPassword,
  useProfile,
} from "@/contexts/profile-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

const GENDERS = ["Male", "Female", "Other"];
const GOALS = ["Lose Weight", "Gain Muscle", "Stay Fit", "Eat Healthier"];

function StepIndicator({ current, total, colors }: { current: number; total: number; colors: typeof Colors.light }) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            { backgroundColor: i < current ? colors.primary : colors.progressTrack },
          ]}
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
  colors,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.tertiaryText }]}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.cardBackground, borderColor: colors.border, color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize="none"
      />
    </View>
  );
}

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ProfileData>(profile);
  const [statusMessage, setStatusMessage] = useState("");
  const [ageError, setAgeError] = useState("");
  const [heightError, setHeightError] = useState("");
  const [weightError, setWeightError] = useState("");

  const set = (key: keyof ProfileData) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const next = async () => {
    if (step === 2) {
      const age = parseInt(form.age, 10);
      if (!form.age.trim() || isNaN(age) || age <= 0) {
        setAgeError("Please enter a valid age.");
        return;
      }
      if (age < 18) {
        setAgeError("You must be at least 18 years old.");
        return;
      }
      setAgeError("");

      const height = parseFloat(form.height);
      if (!form.height.trim() || isNaN(height) || height <= 0) {
        setHeightError("Please enter a valid height.");
        return;
      }
      setHeightError("");

      const weight = parseFloat(form.weight);
      if (!form.weight.trim() || isNaN(weight) || weight <= 0) {
        setWeightError("Please enter a valid weight.");
        return;
      }
      setWeightError("");
    }

    if (step < 3) {
      setStatusMessage("");
      setStep((s) => s + 1);
      return;
    }

    try {
      await saveProfile(form);
      updateProfile(form);
      setStatusMessage("User input processing completed.");
      router.replace("/(tabs)/profile");
    } catch (e) {
      setStatusMessage("Failed to save profile. Check your connection.");
    }
  };

  const back = () => {
    if (step > 1) setStep((s) => s - 1);
    else router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.screenBackground }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Profile Details</Text>
            <Text style={[styles.headerStep, { color: colors.secondaryText }]}>Step {step} of 3</Text>
          </View>
          <StepIndicator current={step} total={3} colors={colors} />
        </View>

        <View style={styles.body}>
          {/* Step 1: Account Info */}
          {step === 1 && (
            <>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Tell us about yourself</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>
                This helps us calculate your daily caloric needs and body mass
                index.
              </Text>

              <InputField
                label="Email Address"
                placeholder="example@email.com"
                value={form.email}
                onChangeText={set("email")}
                keyboardType="email-address"
                colors={colors}
              />
              <InputField
                label="Password"
                placeholder="--------"
                value={form.password}
                onChangeText={set("password")}
                secureTextEntry
                colors={colors}
              />
              <InputField
                label="Full Name"
                placeholder="John Doe"
                value={form.fullName}
                onChangeText={set("fullName")}
                colors={colors}
              />

              <View style={[styles.previewCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <Text style={[styles.previewTitle, { color: colors.primaryDark }]}>Live Input Preview</Text>
                <Text style={[styles.previewLine, { color: colors.primaryText }]}>
                  Name: {form.fullName || "Not set yet"}
                </Text>
                <Text style={[styles.previewLine, { color: colors.primaryText }]}>
                  Email: {form.email || "Not set yet"}
                </Text>
                <Text style={[styles.previewLine, { color: colors.primaryText }]}>
                  Password: {maskPassword(form.password)}
                </Text>
              </View>
            </>
          )}

          {/* Step 2: Body Info */}
          {step === 2 && (
            <>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Your body details</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>
                We use this information to personalise your nutrition plan.
              </Text>

              <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                  <InputField
                    label="Age"
                    placeholder="25"
                    value={form.age}
                    onChangeText={(v) => { set("age")(v); if (ageError) setAgeError(""); }}
                    keyboardType="numeric"
                    colors={colors}
                  />
                  {ageError ? (
                    <Text style={{ color: colors.dangerText, fontSize: 12, marginTop: 2 }}>
                      {ageError}
                    </Text>
                  ) : null}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.fieldLabel, { color: colors.tertiaryText }]}>Gender</Text>
                  <View style={styles.selectRow}>
                    {GENDERS.map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.selectChip,
                          { borderColor: colors.border, backgroundColor: colors.cardBackground },
                          form.gender === g && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                        onPress={() => set("gender")(g)}
                      >
                        <Text
                          style={[
                            styles.selectChipText,
                            { color: colors.tertiaryText },
                            form.gender === g && { color: "#fff" },
                          ]}
                        >
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
                    onChangeText={(v) => { set("height")(v); if (heightError) setHeightError(""); }}
                    keyboardType="numeric"
                    colors={colors}
                  />
                  {heightError ? (
                    <Text style={{ color: colors.dangerText, fontSize: 12, marginTop: 2 }}>
                      {heightError}
                    </Text>
                  ) : null}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <InputField
                    label="Weight (kg)"
                    placeholder="75"
                    value={form.weight}
                    onChangeText={(v) => { set("weight")(v); if (weightError) setWeightError(""); }}
                    keyboardType="numeric"
                    colors={colors}
                  />
                  {weightError ? (
                    <Text style={{ color: colors.dangerText, fontSize: 12, marginTop: 2 }}>
                      {weightError}
                    </Text>
                  ) : null}
                </View>
              </View>
            </>
          )}

          {/* Step 3: Goal */}
          {step === 3 && (
            <>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Your primary goal</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.secondaryText }]}>
                Choose the goal that best describes what you want to achieve.
              </Text>

              <View style={styles.goalGrid}>
                {GOALS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.goalCard,
                      { backgroundColor: colors.cardBackground, borderColor: colors.border, shadowColor: colors.shadow },
                      form.goal === g && { borderColor: colors.primary, backgroundColor: colors.primaryLight },
                    ]}
                    onPress={() => set("goal")(g)}
                  >
                    <Text style={styles.goalEmoji}>
                      {g === "Lose Weight"
                        ? "\u2696\uFE0F"
                        : g === "Gain Muscle"
                          ? "\u{1F3CB}\uFE0F"
                          : g === "Stay Fit"
                            ? "\u{1F3C3}"
                            : "\u{1F957}"}
                    </Text>
                    <Text
                      style={[
                        styles.goalCardText,
                        { color: colors.tertiaryText },
                        form.goal === g && { color: colors.primaryText },
                      ]}
                    >
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
      <View style={[styles.bottomNav, { backgroundColor: colors.cardBackground, borderTopColor: colors.borderLight }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.screenBackground, borderColor: colors.border }]} onPress={back}>
          <Text style={[styles.backBtnText, { color: colors.tertiaryText }]}>&larr; Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.primary }]} onPress={next}>
          <Text style={styles.nextBtnText}>
            {step < 3 ? "Continue \u2192" : "Finish Setup \u2713"}
          </Text>
        </TouchableOpacity>
      </View>

      {statusMessage ? (
        <View style={[styles.statusBanner, { backgroundColor: colors.primaryDark }]}>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  headerStep: { fontSize: 13, fontWeight: "600" },

  stepIndicator: { flexDirection: "row", gap: 8 },
  stepDot: { height: 6, flex: 1, borderRadius: 3 },

  body: { padding: 20 },

  sectionHeading: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },

  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  previewCard: {
    marginTop: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  previewLine: { fontSize: 13, marginBottom: 4 },

  rowFields: { flexDirection: "row", marginBottom: 0 },

  selectRow: { flexDirection: "column", gap: 6, marginTop: 6 },
  selectChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  selectChipText: { fontSize: 12, fontWeight: "600" },

  goalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  goalCard: {
    width: "46%",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  goalEmoji: { fontSize: 30, marginBottom: 8 },
  goalCardText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  bottomNav: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  backBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  backBtnText: { fontSize: 15, fontWeight: "700" },
  nextBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  nextBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  statusBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  statusText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
