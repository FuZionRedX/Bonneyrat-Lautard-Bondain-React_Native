import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Feather from "@expo/vector-icons/Feather";

import { Button, Card, CapsLabel, GroupCard, heading, ListRow, Pill, SectionHeader, softShadow } from "@/components/ui/kit";
import { getNutrition } from "@/lib/nutrition";
import { Colors, LAST_PROFILE_EMAIL_KEY } from "@/constants/theme";
import { useMealPlan } from "@/contexts/meal-plan-context";
import { getProfileInitials, useProfile } from "@/contexts/profile-context";
import { useLanguage } from "@/contexts/language-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

type BmiMeta = {
  label: string;
  tone: "neutral" | "info" | "good" | "warn" | "bad";
  description: string;
};

// WHO BMI classification thresholds: <18.5 underweight, 18.5–24.9 normal, 25–29.9 overweight, ≥30 obese
function getBmiMeta(bmi: number | null): BmiMeta {
  if (bmi === null) {
    return {
      label: "N/A",
      tone: "neutral",
      description: "Add valid height and weight to calculate your BMI.",
    };
  }

  if (bmi < 18.5) {
    return {
      label: "UNDERWEIGHT",
      tone: "info",
      description:
        "Your BMI is below the healthy range. Consider consulting a professional about balanced nutrition.",
    };
  }

  if (bmi < 25) {
    return {
      label: "NORMAL",
      tone: "good",
      description:
        "Your BMI is in the healthy range. Keep up the balanced diet and regular activity!",
    };
  }

  if (bmi < 30) {
    return {
      label: "OVERWEIGHT",
      tone: "warn",
      description:
        "Your BMI is above the healthy range. Small daily habits can help improve your health trajectory.",
    };
  }

  return {
    label: "OBESE",
    tone: "bad",
    description:
      "Your BMI is in a high range. Consider speaking with a healthcare professional for a personalized plan.",
  };
}

// BMI scale shown under the value: 15 to 40, with the WHO thresholds.
const BMI_MIN = 15;
const BMI_MAX = 40;
const BMI_SEGMENTS = [
  { from: 15, to: 18.5, color: "#7CB9F5" },
  { from: 18.5, to: 25, color: "#8EDB5A" },
  { from: 25, to: 30, color: "#F5C26B" },
  { from: 30, to: 40, color: "#F08A5D" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { t } = useLanguage();
  const { connectProfileByEmail, hasProcessedInput, logout, profile } =
    useProfile();
  const { setSelectedByCategory } = useMealPlan();
  const [emailToConnect, setEmailToConnect] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordToConnect, setPasswordToConnect] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const initials = getProfileInitials(profile.fullName);

  const { bmi } = getNutrition(profile);
  const bmiDisplay = bmi === null ? "--" : bmi.toFixed(1);
  const bmiMeta = getBmiMeta(bmi);

  useEffect(() => {
    AsyncStorage.getItem(LAST_PROFILE_EMAIL_KEY)
      .then((savedEmail) => {
        if (savedEmail) {
          setEmailToConnect(savedEmail);
        }
      })
      .catch(() => {
        /* no-op: local storage might be unavailable */
      });
  }, []);

  const handleConnectProfile = async () => {
    const trimmedEmail = emailToConnect.trim();
    const enteredPassword = passwordToConnect;

    if (!trimmedEmail) {
      setEmailError(t("Enter your email to connect your profile."));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError(t("Enter a valid email address (e.g. name@example.com)."));
      return;
    }

    setEmailError("");

    if (!enteredPassword.trim()) {
      setConnectError(t("Enter your password to connect your profile."));
      return;
    }

    try {
      setIsConnecting(true);
      setConnectError("");
      const status = await connectProfileByEmail(trimmedEmail, enteredPassword);

      if (status === "not_found") {
        setConnectError(t("No profile found for this email."));
        return;
      }

      if (status === "wrong_password") {
        setConnectError(t("Incorrect password."));
        return;
      }

      await AsyncStorage.setItem(LAST_PROFILE_EMAIL_KEY, trimmedEmail);
    } catch {
      setConnectError(t("Connection failed. Check XAMPP and your API URL."));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = () => {
    setPasswordToConnect("");
    setShowPassword(false);
    setConnectError("");
    setSelectedByCategory({}); // don't show this user's plan to the next one
    logout();
  };

  const toneColors = {
    neutral: { bg: colors.cardMuted, fg: colors.tertiaryText },
    info: { bg: colors.dinnerBg, fg: colors.dinnerText },
    good: { bg: colors.primaryLight, fg: colors.primaryText },
    warn: { bg: colors.breakfastBg, fg: colors.breakfastText },
    bad: { bg: colors.dangerLight, fg: colors.dangerText },
  }[bmiMeta.tone];
  const markerPct = bmi === null ? null : Math.min(Math.max((bmi - BMI_MIN) / (BMI_MAX - BMI_MIN), 0), 1) * 100;

  if (!hasProcessedInput) {
    return (
      // Lifts the form above the keyboard so the field being typed in stays visible and the page can scroll.
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding" // "height" barely shrinks the view on edge-to-edge Android
      >
      <ScrollView
        style={[styles.flex, { backgroundColor: colors.screenBackground }]}
        contentContainerStyle={styles.loginContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.hero, { backgroundColor: colors.primaryLight, paddingTop: insets.top }]}>
          <Image source={require("@/assets/images/food/chicken-salad.png")} style={[styles.heroFood, styles.heroFood1]} accessible={false} />
          <Image source={require("@/assets/images/food/oatmeal.png")} style={[styles.heroFood, styles.heroFood2]} accessible={false} />
          <Image source={require("@/assets/images/food/salmon.png")} style={[styles.heroFood, styles.heroFood3]} accessible={false} />
          <Image source={require("@/assets/images/food/curry.png")} style={[styles.heroFood, styles.heroFood4]} accessible={false} />
          <View style={[styles.logoTile, softShadow(colors)]}>
            <Image
              source={require("@/assets/images/logo-cropped.png")}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="VitalSync"
            />
          </View>
        </View>

        <View style={styles.loginPanel}>
          <Text style={[heading(30), styles.center, { color: colors.text }]} accessibilityRole="header">
            {t("Welcome")}
          </Text>
          <Text style={[styles.loginSubtitle, { color: colors.tertiaryText }]}>
            {t("Log in to sync your health goals and track your diet.")}
          </Text>

          <Text style={[styles.inputLabel, { color: colors.labelText }]}>{t("Email")}</Text>
          <View style={[styles.inputShell, { borderColor: emailError ? colors.danger : colors.border, backgroundColor: colors.inputBackground }]}>
            <Feather name="mail" size={19} color={colors.secondaryText} />
            <TextInput
              style={[styles.loginInput, { color: colors.text }]}
              placeholder="name@example.com"
              placeholderTextColor={colors.placeholderText}
              value={emailToConnect}
              onChangeText={(text) => {
                setEmailToConnect(text);
                if (emailError) setEmailError("");
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              accessibilityLabel={t("Email")}
            />
          </View>
          {emailError ? <Text style={[styles.loginError, { color: colors.dangerText }]}>{emailError}</Text> : null}

          <Text style={[styles.inputLabel, { color: colors.labelText }]}>{t("Password")}</Text>
          <View style={[styles.inputShell, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
            <Feather name="lock" size={19} color={colors.secondaryText} />
            <TextInput
              style={[styles.loginInput, { color: colors.text }]}
              placeholder={t("Enter your password")}
              placeholderTextColor={colors.placeholderText}
              value={passwordToConnect}
              onChangeText={setPasswordToConnect}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              accessibilityLabel={t("Password")}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={showPassword ? t("Hide") : t("Show")}
              style={styles.eyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
            >
              <Feather name={showPassword ? "eye-off" : "eye"} size={20} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>

          {connectError ? <Text style={[styles.loginError, { color: colors.dangerText }]}>{connectError}</Text> : null}

          <Button label={t("Log In")} onPress={handleConnectProfile} loading={isConnecting} style={styles.loginButton} />

          <TouchableOpacity accessibilityRole="button" style={styles.signupRow} onPress={() => router.push("/profile-setup")}>
            <Text style={[styles.signupMuted, { color: colors.tertiaryText }]}>{t("Don't have an account?")} </Text>
            <Text style={[styles.signupLink, { color: colors.primaryText }]}>{t("Sign Up")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  const stat = (label: string, value: string, unit = "") => (
    <View style={[styles.stat, { backgroundColor: colors.cardBackground }, softShadow(colors)]}>
      <Text style={[styles.statLabel, { color: colors.secondaryText }]}>{label}</Text>
      <Text style={[heading(20), { color: colors.text }]}>
        {value || "--"}
        {unit && value ? <Text style={[styles.statUnit, { color: colors.secondaryText }]}> {unit}</Text> : null}
      </Text>
    </View>
  );

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.screenBackground }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.brandLime }]}>
          <Text style={[heading(32), { color: "#06150D" }]}>{initials}</Text>
        </View>
        <Text style={[heading(24), styles.center, { color: colors.text, marginTop: 12 }]} accessibilityRole="header">
          {profile.fullName}
        </Text>
        <Text style={[styles.email, { color: colors.secondaryText }]}>{profile.email}</Text>
        {profile.goal ? (
          <View style={[styles.goalPill, { backgroundColor: colors.primaryLight }]}>
            <Feather name="target" size={14} color={colors.primaryText} />
            <Text style={[styles.goalText, { color: colors.primaryText }]}>
              {t("Primary Goal")}: {t(profile.goal)}
            </Text>
          </View>
        ) : null}
      </View>

      <Card style={styles.bmiCard}>
        <View style={styles.bmiTop}>
          <View>
            <CapsLabel>{t("BODY MASS INDEX")}</CapsLabel>
            <Text style={[heading(34), { color: colors.text }]}>{bmiDisplay}</Text>
          </View>
          <Pill label={t(bmiMeta.label)} bg={toneColors.bg} fg={toneColors.fg} style={styles.bmiPill} />
        </View>
        <View style={styles.scale} accessible={false}>
          {BMI_SEGMENTS.map((seg) => (
            <View key={seg.from} style={{ flex: seg.to - seg.from, height: 10, backgroundColor: seg.color }} />
          ))}
          {markerPct !== null ? (
            <View style={[styles.marker, { left: `${markerPct}%`, backgroundColor: colors.text, borderColor: colors.cardBackground }]} />
          ) : null}
        </View>
        <View style={styles.scaleLabels}>
          {["15", "18.5", "25", "30", "40"].map((l) => (
            <Text key={l} style={[styles.scaleLabel, { color: colors.secondaryText }]}>{l}</Text>
          ))}
        </View>
        <Text style={[styles.bmiDesc, { color: colors.tertiaryText }]}>{t(bmiMeta.description)}</Text>
      </Card>

      <SectionHeader title={t("Body Information")} />
      <View style={styles.stats}>
        {stat(t("Age"), profile.age)}
        {stat(t("Gender"), profile.gender ? t(profile.gender) : "")}
        {stat(t("Height"), profile.height, "cm")}
        {stat(t("Weight"), profile.weight, "kg")}
      </View>

      <GroupCard title={t("Account Information")}>
        <ListRow icon="user" label={t("Name")} value={profile.fullName} />
        <ListRow icon="mail" label={t("Email")} value={profile.email} last />
      </GroupCard>

      <GroupCard>
        <ListRow icon="sliders" label={t("Settings")} onPress={() => router.push("/settings")} />
        <ListRow icon="clock" label={t("View Meal History")} onPress={() => router.push("/meal-history")} />
        <ListRow icon="help-circle" label={t("Help & Support")} onPress={() => router.push("/help-support")} />
        <ListRow icon="log-out" label={t("Log Out")} onPress={handleLogout} danger last />
      </GroupCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: "center" },
  content: { paddingBottom: 24 },

  // Login
  loginContent: { flexGrow: 1, paddingBottom: 120 }, // room to scroll the last field and button above the keyboard
  hero: { height: 280, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  heroFood: { position: "absolute", opacity: 0.9 },
  heroFood1: { width: 160, height: 160, borderRadius: 80, top: 30, left: -40 },
  heroFood2: { width: 120, height: 120, borderRadius: 60, top: 20, right: -20 },
  heroFood3: { width: 110, height: 110, borderRadius: 55, bottom: -10, right: 40 },
  heroFood4: { width: 90, height: 90, borderRadius: 45, bottom: 10, left: 30 },
  logoTile: { width: 150, height: 150, borderRadius: 42, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginTop: 24 },
  logo: { width: 120, height: 104 },
  loginPanel: { paddingHorizontal: 24, paddingTop: 24 },
  loginSubtitle: { fontSize: 15, lineHeight: 21, textAlign: "center", marginTop: 6, marginBottom: 12 },
  inputLabel: { fontSize: 13, fontWeight: "700", marginTop: 14, marginBottom: 6 },
  inputShell: { minHeight: 54, borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  loginInput: { flex: 1, fontSize: 16, paddingVertical: 12 },
  eyeButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: -10 },
  loginError: { marginTop: 6, fontSize: 13, fontWeight: "600" },
  loginButton: { marginTop: 22 },
  signupRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", minHeight: 48, marginTop: 6 },
  signupMuted: { fontSize: 15 },
  signupLink: { fontSize: 15, fontWeight: "800" },

  // Profile
  header: { alignItems: "center", paddingTop: 60, paddingHorizontal: 20 },
  avatar: { width: 88, height: 88, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  email: { fontSize: 14, marginTop: 2 },
  goalPill: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  goalText: { fontSize: 12, fontWeight: "700" },

  bmiCard: { marginHorizontal: 20, marginTop: 18 },
  bmiTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  bmiPill: { marginTop: 4 },
  scale: { flexDirection: "row", borderRadius: 5, overflow: "visible", marginTop: 12, height: 10 },
  marker: { position: "absolute", top: -5, width: 8, height: 20, borderRadius: 4, borderWidth: 2, marginLeft: -4 },
  scaleLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  scaleLabel: { fontSize: 10, fontWeight: "600" },
  bmiDesc: { fontSize: 13, lineHeight: 19, marginTop: 10 },

  stats: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 20 },
  stat: { flexBasis: "48%", flexGrow: 1, borderRadius: 16, padding: 12 },
  statLabel: { fontSize: 11, fontWeight: "700" },
  statUnit: { fontSize: 12 },
});
