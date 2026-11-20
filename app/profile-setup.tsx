import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import Feather from "@expo/vector-icons/Feather";

import { Button, heading, softShadow, type IconName } from "@/components/ui/kit";
import { saveProfile } from "@/lib/api";
import { Colors } from "@/constants/theme";
import {
  ProfileData,
  maskPassword,
  useProfile,
} from "@/contexts/profile-context";
import { useLanguage } from "@/contexts/language-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

const GENDERS = ["Male", "Female", "Other"];
const GOALS = ["Lose Weight", "Gain Muscle", "Stay Fit", "Eat Healthier"];
const GOAL_ICONS: Record<string, IconName> = {
  "Lose Weight": "trending-down",
  "Gain Muscle": "zap",
  "Stay Fit": "activity",
  "Eat Healthier": "feather",
};

function StepIndicator({ current, total, colors }: { current: number; total: number; colors: typeof Colors.light }) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[styles.stepDot, { backgroundColor: i < current ? colors.primary : colors.progressTrack }]}
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
  icon,
  error,
  colors,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  icon?: IconName;
  error?: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.labelText }]}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          { backgroundColor: colors.inputBackground, borderColor: error ? colors.danger : colors.border },
        ]}
      >
        {icon ? <Feather name={icon} size={19} color={colors.secondaryText} /> : null}
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholderText}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType ?? "default"}
          autoCapitalize="none"
          accessibilityLabel={label}
        />
      </View>
      {error ? <Text style={[styles.fieldError, { color: colors.dangerText }]}>{error}</Text> : null}
    </View>
  );
}

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { profile, hasProcessedInput, updateProfile } = useProfile();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { language, t } = useLanguage();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ProfileData>(profile);
  const [statusMessage, setStatusMessage] = useState("");
  const [ageError, setAgeError] = useState("");
  const [heightError, setHeightError] = useState("");
  const [weightError, setWeightError] = useState("");

  // Curried setter: set("field") returns an onChangeText handler for that field
  const set = (key: keyof ProfileData) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const next = async () => {
    if (step === 1 && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) || !form.password)) {
      setStatusMessage(t("Enter a valid email and a password."));
      return;
    }

    if (step === 2) {
      const age = parseInt(form.age, 10);
      if (!form.age.trim() || isNaN(age) || age <= 0) {
        setAgeError(t("Please enter a valid age."));
        return;
      }
      if (age < 18) {
        setAgeError(t("You must be at least 18 years old."));
        return;
      }
      setAgeError("");

      const height = parseFloat(form.height);
      if (!form.height.trim() || isNaN(height) || height <= 0) {
        setHeightError(t("Please enter a valid height."));
        return;
      }
      setHeightError("");

      const weight = parseFloat(form.weight);
      if (!form.weight.trim() || isNaN(weight) || weight <= 0) {
        setWeightError(t("Please enter a valid weight."));
        return;
      }
      setWeightError("");
    }

    if (step < 3) {
      setStatusMessage("");
      setStep((s) => s + 1);
      return;
    }

    const savedForm = { ...form, email: form.email.trim(), language };
    try {
      const result = await saveProfile(savedForm);
      if (!result.success) {
        setStatusMessage(
          result.error === "email_taken"
            ? t("An account with this email already exists. Log in instead.")
            : t("Failed to save profile."),
        );
        return;
      }
      updateProfile(savedForm);
      setStatusMessage(t("User input processing completed."));
      router.replace("/(tabs)/profile");
    } catch {
      setStatusMessage(t("Failed to save profile. Check your connection."));
    }
  };

  const back = () => {
    if (step > 1) setStep((s) => s - 1);
    else router.back();
  };

  const isError = statusMessage !== "" && statusMessage !== t("User input processing completed.");

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="padding" // also on Android: without it the keyboard covers the fields
    >
      <ScrollView
        style={[styles.flex, { backgroundColor: colors.screenBackground }]}
        contentContainerStyle={{ paddingBottom: 120 }} // scroll room above the keyboard
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t("Go back")}
            onPress={back}
            style={[styles.iconButton, { backgroundColor: colors.cardBackground }, softShadow(colors)]}
          >
            <Feather name="chevron-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <StepIndicator current={step} total={3} colors={colors} />
          <Text style={[styles.headerStep, { color: colors.secondaryText }]}>{t("Step {step} of 3", { step })}</Text>
        </View>

        <View style={styles.body}>
          {step === 1 && (
            <>
              <Text style={[heading(28), { color: colors.text }]} accessibilityRole="header">{t("Tell us about yourself")}</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.tertiaryText }]}>
                {t("This helps us calculate your daily caloric needs and body mass index.")}
              </Text>

              {/* Editing (already logged in) keeps the account's email and password:
                  the server matches the account by both, so changing them here would fail or fork it. */}
              {!hasProcessedInput && (
                <>
                  <InputField
                    label={t("Email Address")}
                    placeholder="example@email.com"
                    value={form.email}
                    onChangeText={set("email")}
                    keyboardType="email-address"
                    icon="mail"
                    colors={colors}
                  />
                  <InputField
                    label={t("Password")}
                    placeholder="--------"
                    value={form.password}
                    onChangeText={set("password")}
                    secureTextEntry
                    icon="lock"
                    colors={colors}
                  />
                </>
              )}
              <InputField
                label={t("Full Name")}
                placeholder="John Doe"
                value={form.fullName}
                onChangeText={set("fullName")}
                icon="user"
                colors={colors}
              />

              <View style={[styles.previewCard, { backgroundColor: colors.primaryLight }]}>
                <View style={styles.previewHead}>
                  <Feather name="eye" size={16} color={colors.primaryText} />
                  <Text style={[styles.previewTitle, { color: colors.primaryText }]}>{t("Live Input Preview")}</Text>
                </View>
                <Text style={[styles.previewLine, { color: colors.text }]}>
                  {t("Name: {value}", { value: form.fullName || t("Not set yet") })}
                </Text>
                <Text style={[styles.previewLine, { color: colors.text }]}>
                  {t("Email: {value}", { value: form.email || t("Not set yet") })}
                </Text>
                <Text style={[styles.previewLine, { color: colors.text }]}>
                  {t("Password: {value}", { value: maskPassword(form.password) })}
                </Text>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={[heading(28), { color: colors.text }]} accessibilityRole="header">{t("Your body details")}</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.tertiaryText }]}>
                {t("We use this information to personalise your nutrition plan.")}
              </Text>

              <Text style={[styles.fieldLabel, { color: colors.labelText }]}>{t("Gender")}</Text>
              <View style={[styles.segment, { backgroundColor: colors.cardMuted }]} accessibilityRole="radiogroup">
                {GENDERS.map((g) => {
                  const selected = form.gender === g;
                  return (
                    <TouchableOpacity
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      key={g}
                      style={[styles.segmentItem, selected && [{ backgroundColor: colors.cardBackground }, softShadow(colors)]]}
                      onPress={() => set("gender")(g)}
                    >
                      <Text style={[styles.segmentText, { color: selected ? colors.text : colors.secondaryText }]}>{t(g)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <InputField
                label={t("Age")}
                placeholder="25"
                value={form.age}
                onChangeText={(v) => { set("age")(v); if (ageError) setAgeError(""); }}
                keyboardType="numeric"
                icon="calendar"
                error={ageError}
                colors={colors}
              />
              <View style={styles.rowFields}>
                <View style={styles.flex}>
                  <InputField
                    label={t("Height (cm)")}
                    placeholder="180"
                    value={form.height}
                    onChangeText={(v) => { set("height")(v); if (heightError) setHeightError(""); }}
                    keyboardType="numeric"
                    error={heightError}
                    colors={colors}
                  />
                </View>
                <View style={styles.flex}>
                  <InputField
                    label={t("Weight (kg)")}
                    placeholder="75"
                    value={form.weight}
                    onChangeText={(v) => { set("weight")(v); if (weightError) setWeightError(""); }}
                    keyboardType="numeric"
                    error={weightError}
                    colors={colors}
                  />
                </View>
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={[heading(28), { color: colors.text }]} accessibilityRole="header">{t("Your primary goal")}</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.tertiaryText }]}>
                {t("Choose the goal that best describes what you want to achieve.")}
              </Text>

              <View style={styles.goalGrid} accessibilityRole="radiogroup">
                {GOALS.map((g, i) => {
                  const selected = form.goal === g;
                  const tone = [
                    { bg: colors.snackBg, fg: colors.snackText },
                    { bg: colors.dinnerBg, fg: colors.dinnerText },
                    { bg: colors.breakfastBg, fg: colors.breakfastText },
                    { bg: colors.lunchBg, fg: colors.lunchText },
                  ][i];
                  return (
                    <TouchableOpacity
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={t(g)}
                      key={g}
                      activeOpacity={0.8}
                      style={[
                        styles.goalCard,
                        selected
                          ? { backgroundColor: colors.selectedBackground, borderColor: colors.primary }
                          : [{ backgroundColor: colors.cardBackground, borderColor: "transparent" }, softShadow(colors)],
                      ]}
                      onPress={() => set("goal")(g)}
                    >
                      <View style={[styles.goalIcon, { backgroundColor: tone.bg }]}>
                        <Feather name={GOAL_ICONS[g]} size={22} color={tone.fg} />
                      </View>
                      <Text style={[heading(17), { color: colors.text }]}>{t(g)}</Text>
                      {selected ? (
                        <View style={[styles.goalCheck, { backgroundColor: colors.primary }]}>
                          <Feather name="check" size={14} color={colors.onPrimary} />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {statusMessage ? (
        <View style={[styles.statusBanner, { backgroundColor: isError ? colors.dangerLight : colors.primaryLight }]} accessibilityLiveRegion="polite">
          <Feather name={isError ? "alert-circle" : "check-circle"} size={18} color={isError ? colors.dangerText : colors.primaryText} />
          <Text style={[styles.statusText, { color: isError ? colors.dangerText : colors.primaryText }]}>{statusMessage}</Text>
        </View>
      ) : null}

      <View style={[styles.bottomNav, { backgroundColor: colors.screenBackground }]}>
        <Button
          label={step < 3 ? t("Continue") : t("Finish Setup")}
          icon={step < 3 ? "arrow-right" : "check"}
          iconRight={step < 3}
          onPress={next}
          style={styles.flex}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 56 },
  iconButton: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerStep: { fontSize: 13, fontWeight: "700" },
  stepIndicator: { flex: 1, flexDirection: "row", gap: 6 },
  stepDot: { height: 6, flex: 1, borderRadius: 3 },

  body: { paddingHorizontal: 24, paddingTop: 28 },
  sectionSubtitle: { fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 22 },

  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  inputShell: { minHeight: 54, borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  input: { flex: 1, minWidth: 0, fontSize: 16, paddingVertical: 12 },
  fieldError: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  rowFields: { flexDirection: "row", gap: 12 },

  segment: { flexDirection: "row", padding: 4, borderRadius: 18, gap: 4, marginBottom: 16 },
  segmentItem: { flex: 1, minHeight: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  segmentText: { fontSize: 15, fontWeight: "700" },

  previewCard: { borderRadius: 20, padding: 16, marginTop: 6, gap: 4 },
  previewHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  previewTitle: { fontSize: 13, fontWeight: "800" },
  previewLine: { fontSize: 14 },

  goalGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  goalCard: { flexBasis: "47%", flexGrow: 1, minHeight: 140, borderRadius: 22, padding: 16, gap: 12, borderWidth: 2 },
  goalIcon: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  goalCheck: { position: "absolute", top: 12, right: 12, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  statusBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 24, padding: 12, borderRadius: 14 },
  statusText: { flex: 1, fontSize: 13, fontWeight: "600" },
  bottomNav: { flexDirection: "row", paddingHorizontal: 24, paddingTop: 12, paddingBottom: 30 },
});
