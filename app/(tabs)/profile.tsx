import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { getProfileInitials, useProfile } from "@/contexts/profile-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

const LAST_PROFILE_EMAIL_KEY = "last_profile_email";

type ConnectResult =
  | "connected"
  | "not_found"
  | "wrong_password"
  | {
      status: "connected" | "not_found" | "wrong_password";
      wasFirstOpen?: boolean;
    };

type BmiMeta = {
  label: string;
  color: string;
  description: string;
};

function parseProfileNumber(value: string) {
  return Number.parseFloat(value.replace(",", "."));
}

function getBmiMeta(bmi: number | null): BmiMeta {
  if (bmi === null) {
    return {
      label: "N/A",
      color: "#64748B",
      description: "Add valid height and weight to calculate your BMI.",
    };
  }

  if (bmi < 18.5) {
    return {
      label: "UNDERWEIGHT",
      color: "#2196F3",
      description:
        "Your BMI is below the healthy range. Consider consulting a professional about balanced nutrition.",
    };
  }

  if (bmi < 25) {
    return {
      label: "NORMAL",
      color: "#4CAF50",
      description:
        "Your BMI is in the healthy range. Keep up the balanced diet and regular activity!",
    };
  }

  if (bmi < 30) {
    return {
      label: "OVERWEIGHT",
      color: "#FF9800",
      description:
        "Your BMI is above the healthy range. Small daily habits can help improve your health trajectory.",
    };
  }

  return {
    label: "OBESE",
    color: "#F44336",
    description:
      "Your BMI is in a high range. Consider speaking with a healthcare professional for a personalized plan.",
  };
}

function MenuItem({
  emoji,
  label,
  onPress,
  colors,
}: {
  emoji: string;
  label: string;
  onPress?: () => void;
  colors: typeof Colors.light;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
      onPress={onPress}
    >
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
      <Text style={[styles.menuArrow, { color: colors.secondaryText }]}>
        &rsaquo;
      </Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { connectProfileByEmail, hasProcessedInput, logout, profile } =
    useProfile();
  const [emailToConnect, setEmailToConnect] = useState("");
  const [passwordToConnect, setPasswordToConnect] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const initials = getProfileInitials(profile.fullName);

  const heightCm = parseProfileNumber(profile.height);
  const weightKg = parseProfileNumber(profile.weight);
  const hasValidBodyMetrics = heightCm > 0 && weightKg > 0;
  const bmi = hasValidBodyMetrics ? weightKg / (heightCm / 100) ** 2 : null;
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
      setConnectError("Enter your email to connect your profile.");
      return;
    }

    if (!enteredPassword.trim()) {
      setConnectError("Enter your password to connect your profile.");
      return;
    }

    try {
      setIsConnecting(true);
      setConnectError("");
      const result = (await connectProfileByEmail(
        trimmedEmail,
        enteredPassword,
      )) as ConnectResult;
      const status = typeof result === "string" ? result : result.status;

      if (status === "not_found") {
        setConnectError("No profile found for this email.");
        return;
      }

      if (status === "wrong_password") {
        setConnectError("Incorrect password.");
        return;
      }

      await AsyncStorage.setItem(LAST_PROFILE_EMAIL_KEY, trimmedEmail);
    } catch {
      setConnectError("Connection failed. Check XAMPP and your API URL.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = () => {
    setPasswordToConnect("");
    setShowPassword(false);
    setConnectError("");
    logout();
  };

  if (!hasProcessedInput) {
    // Unauthenticated state: show login/connect screen.
    return (
      <ScrollView
        style={[
          styles.loginScreen,
          { backgroundColor: colors.loginBarBackground },
        ]}
        contentContainerStyle={styles.loginContent}
      >
        <View
          style={[
            styles.loginTopBar,
            {
              paddingTop: insets.top,
              height: 52 + insets.top,
              backgroundColor: colors.loginBarBackground,
            },
          ]}
        >
          <Text style={[styles.loginBack, { color: colors.text }]}>&larr;</Text>
          <Text style={[styles.loginBrand, { color: colors.text }]}>
            VitalSync
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View
          style={[styles.heroBlock, { backgroundColor: colors.heroBackground }]}
        >
          <Image
            source={require("@/assets/images/splash-icon.png")}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.loginPanel}>
          <Text style={[styles.loginTitle, { color: colors.text }]}>
            Welcome
          </Text>
          <Text style={[styles.loginSubtitle, { color: colors.labelText }]}>
            Log in to sync your health goals and track your diet.
          </Text>

          <Text style={[styles.inputLabel, { color: colors.tertiaryText }]}>
            EMAIL
          </Text>
          <View
            style={[
              styles.inputShell,
              {
                borderColor: colors.selectedBorder,
                backgroundColor: colors.loginInputBackground,
              },
            ]}
          >
            <Text style={[styles.inputIcon, { color: colors.placeholderText }]}>
              {"\u2709"}
            </Text>
            <TextInput
              style={[styles.loginInput, { color: colors.text }]}
              placeholder="name@example.com"
              placeholderTextColor={colors.placeholderText}
              value={emailToConnect}
              onChangeText={setEmailToConnect}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={[styles.inputLabel, { color: colors.tertiaryText }]}>
            PASSWORD
          </Text>
          <View
            style={[
              styles.inputShell,
              {
                borderColor: colors.selectedBorder,
                backgroundColor: colors.loginInputBackground,
              },
            ]}
          >
            <Text style={[styles.inputIcon, { color: colors.placeholderText }]}>
              {"\u{1F512}"}
            </Text>
            <TextInput
              style={[styles.loginInput, { color: colors.text }]}
              placeholder="Enter your password"
              placeholderTextColor={colors.placeholderText}
              value={passwordToConnect}
              onChangeText={setPasswordToConnect}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
            >
              <Text style={[styles.eyeText, { color: colors.placeholderText }]}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={[styles.forgotText, { color: colors.primary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {connectError ? (
            <Text style={[styles.loginError, { color: colors.dangerText }]}>
              {connectError}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: colors.loginButtonBackground },
            ]}
            onPress={handleConnectProfile}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator color={colors.loginButtonText} />
            ) : (
              <Text
                style={[
                  styles.loginButtonText,
                  { color: colors.loginButtonText },
                ]}
              >
                Log In
              </Text>
            )}
          </TouchableOpacity>

          {/* Social login options removed as requested */}

          <TouchableOpacity
            style={styles.signupRow}
            onPress={() => router.push("/profile-setup" as any)}
          >
            <Text style={[styles.signupMuted, { color: colors.labelText }]}>
              Don&apos;t have an account?{" "}
            </Text>
            <Text style={[styles.signupLink, { color: colors.primary }]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Authenticated state: show profile, stats, and settings.
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.screenBackground }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>
          {profile.fullName}
        </Text>
        <Text style={[styles.email, { color: colors.secondaryText }]}>
          {profile.email}
        </Text>
      </View>

      <View
        style={[
          styles.accountCard,
          {
            backgroundColor: colors.cardBackground,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Account Information
        </Text>
        <View
          style={[styles.accountRow, { borderBottomColor: colors.borderLight }]}
        >
          <Text style={[styles.accountLabel, { color: colors.secondaryText }]}>
            Name
          </Text>
          <Text style={[styles.accountValue, { color: colors.text }]}>
            {profile.fullName}
          </Text>
        </View>
        <View
          style={[styles.accountRow, { borderBottomColor: colors.borderLight }]}
        >
          <Text style={[styles.accountLabel, { color: colors.secondaryText }]}>
            Email
          </Text>
          <Text style={[styles.accountValue, { color: colors.text }]}>
            {profile.email}
          </Text>
        </View>
      </View>

      {/* BMI Card */}
      <View
        style={[
          styles.bmiCard,
          {
            backgroundColor: colors.cardBackground,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View>
          <Text style={[styles.bmiTitle, { color: colors.secondaryText }]}>
            BODY MASS INDEX
          </Text>
          <Text style={[styles.bmiValue, { color: colors.text }]}>
            {bmiDisplay}
          </Text>
          <View
            style={[styles.bmiNormalBadge, { backgroundColor: bmiMeta.color }]}
          >
            <Text style={styles.bmiNormalText}>{bmiMeta.label}</Text>
          </View>
        </View>
        <View style={styles.bmiRight}>
          <Text style={[styles.bmiDesc, { color: colors.tertiaryText }]}>
            {bmiMeta.description}
          </Text>
          {/* BMI scale */}
          <View style={styles.bmiScaleRow}>
            {[
              { label: "0", color: "#2196F3" },
              { label: "18.5", color: "#4CAF50" },
              { label: "25", color: "#FF9800" },
              { label: "30", color: "#F44336" },
              { label: "40+", color: "#B71C1C" },
            ].map((s) => (
              <View
                key={s.label}
                style={[styles.scaleSegment, { backgroundColor: s.color }]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Body Info */}
      <View
        style={[
          styles.bodyInfoCard,
          {
            backgroundColor: colors.cardBackground,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Body Information
        </Text>
        <View style={styles.bodyInfoRow}>
          <View style={styles.bodyInfoItem}>
            <Text
              style={[styles.bodyInfoLabel, { color: colors.secondaryText }]}
            >
              Age
            </Text>
            <Text style={[styles.bodyInfoValue, { color: colors.text }]}>
              {profile.age}
            </Text>
          </View>
          <View style={styles.bodyInfoItem}>
            <Text
              style={[styles.bodyInfoLabel, { color: colors.secondaryText }]}
            >
              Gender
            </Text>
            <Text style={[styles.bodyInfoValue, { color: colors.text }]}>
              {profile.gender}
            </Text>
          </View>
          <View style={styles.bodyInfoItem}>
            <Text
              style={[styles.bodyInfoLabel, { color: colors.secondaryText }]}
            >
              Height
            </Text>
            <Text style={[styles.bodyInfoValue, { color: colors.text }]}>
              {profile.height} cm
            </Text>
          </View>
          <View style={styles.bodyInfoItem}>
            <Text
              style={[styles.bodyInfoLabel, { color: colors.secondaryText }]}
            >
              Weight
            </Text>
            <Text style={[styles.bodyInfoValue, { color: colors.text }]}>
              {profile.weight} kg
            </Text>
          </View>
        </View>
      </View>

      {/* Primary Goal */}
      <View
        style={[
          styles.goalCard,
          {
            backgroundColor: colors.cardBackground,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Primary Goal
        </Text>
        <View style={styles.goalRow}>
          <TouchableOpacity
            style={[styles.goalChip, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.goalChipText}>{profile.goal}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu */}
      <View
        style={[
          styles.menuCard,
          {
            backgroundColor: colors.cardBackground,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <MenuItem
          emoji={"\u2699\uFE0F"}
          label="Settings"
          onPress={() => router.push("/settings" as any)}
          colors={colors}
        />
        <MenuItem
          emoji={"\u2753"}
          label="Help & Support"
          onPress={() => router.push("/help-support" as any)}
          colors={colors}
        />
        <MenuItem
          emoji={"\u{1F6AA}"}
          label="Log Out"
          onPress={handleLogout}
          colors={colors}
        />
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loginScreen: { flex: 1 },
  loginContent: { flexGrow: 1 },
  loginTopBar: {
    height: 52,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  loginBack: { fontSize: 22, fontWeight: "600" },
  loginBrand: { fontSize: 18, fontWeight: "800" },
  heroBlock: {
    height: 190,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: { width: 145, height: 145, opacity: 0.95 },
  loginPanel: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,
  },
  loginTitle: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "900",
  },
  loginSubtitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 340,
  },
  inputLabel: {
    marginTop: 18,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  inputShell: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  inputIcon: { fontSize: 16, marginRight: 8 },
  loginInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
    paddingVertical: 10,
  },
  eyeButton: { paddingHorizontal: 4, paddingVertical: 4 },
  eyeText: { fontWeight: "600" },
  forgotBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
  },
  forgotText: { fontSize: 13, fontWeight: "700" },
  loginError: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "700",
  },
  loginButton: {
    marginTop: 20,
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#13B83A",
    shadowOpacity: 0.26,
    shadowRadius: 12,
    elevation: 4,
  },
  loginButtonText: { fontSize: 28, fontWeight: "800" },
  signupRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupMuted: { fontSize: 13 },
  signupLink: { fontSize: 13, fontWeight: "700" },

  header: {
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: { fontSize: 24, fontWeight: "800", color: "#fff" },
  name: { fontSize: 20, fontWeight: "800" },
  email: { fontSize: 13, marginTop: 2 },
  accountCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  accountLabel: { fontSize: 13, fontWeight: "700" },
  accountValue: { fontSize: 14, fontWeight: "600" },

  bmiCard: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    gap: 14,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bmiTitle: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  bmiValue: { fontSize: 38, fontWeight: "900", marginTop: 2 },
  bmiNormalBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  bmiNormalText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  bmiRight: { flex: 1, justifyContent: "center" },
  bmiDesc: { fontSize: 12, lineHeight: 17, marginBottom: 8 },
  bmiScaleRow: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    gap: 2,
  },
  scaleSegment: { flex: 1, borderRadius: 2 },

  bodyInfoCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 12,
  },
  bodyInfoRow: { flexDirection: "row", justifyContent: "space-between" },
  bodyInfoItem: { alignItems: "center" },
  bodyInfoLabel: { fontSize: 11, fontWeight: "600" },
  bodyInfoValue: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },

  goalCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  goalRow: { flexDirection: "row", gap: 10 },
  goalChip: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  goalChipText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  menuCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  menuEmoji: { fontSize: 18, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  menuArrow: { fontSize: 20 },
});
