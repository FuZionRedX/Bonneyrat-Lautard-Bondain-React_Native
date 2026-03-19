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

import { getProfileInitials, useProfile } from "@/contexts/profile-context";

const LAST_PROFILE_EMAIL_KEY = "last_profile_email";

type ConnectResult =
  | "connected"
  | "not_found"
  | "wrong_password"
  | {
      // Some API responses include extra metadata alongside the status.
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
}: {
  emoji: string;
  label: string;
  onPress?: () => void;
}) {
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
    // Prefill the email field with the most recently used account.
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
    // Normalize inputs to avoid accidental spaces breaking auth.
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
      // Support both legacy string responses and object responses.
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
    // Clear only transient login UI state, then reset profile context.
    setPasswordToConnect("");
    setShowPassword(false);
    setConnectError("");
    logout();
  };

  if (!hasProcessedInput) {
    // Unauthenticated state: show login/connect screen.
    return (
      <ScrollView
        style={styles.loginScreen}
        contentContainerStyle={styles.loginContent}
      >
        <View style={styles.loginTopBar}>
          <Text style={styles.loginBack}>←</Text>
          <Text style={styles.loginBrand}>VitalSync</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.heroBlock}>
          <Image
            source={require("@/assets/images/splash-icon.png")}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.loginPanel}>
          <Text style={styles.loginTitle}>Welcome</Text>
          <Text style={styles.loginSubtitle}>
            Log in to sync your health goals and track your diet.
          </Text>

          <Text style={styles.inputLabel}>EMAIL</Text>
          <View style={styles.inputShell}>
            <Text style={styles.inputIcon}>✉</Text>
            <TextInput
              style={styles.loginInput}
              placeholder="name@example.com"
              placeholderTextColor="#7D8A99"
              value={emailToConnect}
              onChangeText={setEmailToConnect}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.inputLabel}>PASSWORD</Text>
          <View style={styles.inputShell}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.loginInput}
              placeholder="Enter your password"
              placeholderTextColor="#7D8A99"
              value={passwordToConnect}
              onChangeText={setPasswordToConnect}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword((prev) => !prev)}
            >
              <Text style={styles.eyeText}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {connectError ? (
            <Text style={styles.loginError}>{connectError}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleConnectProfile}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator color="#0C111D" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.socialDividerRow}>
            <View style={styles.socialDividerLine} />
            <Text style={styles.socialDividerText}>OR CONTINUE WITH</Text>
            <View style={styles.socialDividerLine} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.signupRow}
            onPress={() => router.push("/profile-setup" as any)}
          >
            <Text style={styles.signupMuted}>Don&apos;t have an account? </Text>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Authenticated state: show profile, stats, and settings.
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{profile.fullName}</Text>
        <Text style={styles.email}>{profile.email}</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push("/profile-setup" as any)}
        >
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {hasProcessedInput ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>
            User input processing completed
          </Text>
          <Text style={styles.statusSubtitle}>
            Your latest name, email, and password are now active in the app.
          </Text>
        </View>
      ) : null}

      <View style={styles.accountCard}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>Name</Text>
          <Text style={styles.accountValue}>{profile.fullName}</Text>
        </View>
        <View style={styles.accountRow}>
          <Text style={styles.accountLabel}>Email</Text>
          <Text style={styles.accountValue}>{profile.email}</Text>
        </View>
      </View>

      {/* BMI Card */}
      <View style={styles.bmiCard}>
        <View>
          <Text style={styles.bmiTitle}>BODY MASS INDEX</Text>
          <Text style={styles.bmiValue}>{bmiDisplay}</Text>
          <View
            style={[styles.bmiNormalBadge, { backgroundColor: bmiMeta.color }]}
          >
            <Text style={styles.bmiNormalText}>{bmiMeta.label}</Text>
          </View>
        </View>
        <View style={styles.bmiRight}>
          <Text style={styles.bmiDesc}>{bmiMeta.description}</Text>
          {/* BMI scale */}
          <View style={styles.bmiScaleRow}>
            {/* Visual threshold markers for BMI ranges. */}
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
      <View style={styles.bodyInfoCard}>
        <Text style={styles.sectionTitle}>Body Information</Text>
        <View style={styles.bodyInfoRow}>
          <View style={styles.bodyInfoItem}>
            <Text style={styles.bodyInfoLabel}>Age</Text>
            <Text style={styles.bodyInfoValue}>{profile.age}</Text>
          </View>
          <View style={styles.bodyInfoItem}>
            <Text style={styles.bodyInfoLabel}>Gender</Text>
            <Text style={styles.bodyInfoValue}>{profile.gender}</Text>
          </View>
          <View style={styles.bodyInfoItem}>
            <Text style={styles.bodyInfoLabel}>Height</Text>
            <Text style={styles.bodyInfoValue}>{profile.height} cm</Text>
          </View>
          <View style={styles.bodyInfoItem}>
            <Text style={styles.bodyInfoLabel}>Weight</Text>
            <Text style={styles.bodyInfoValue}>{profile.weight} kg</Text>
          </View>
        </View>
      </View>

      {/* Primary Goal */}
      <View style={styles.goalCard}>
        <Text style={styles.sectionTitle}>Primary Goal</Text>
        <View style={styles.goalRow}>
          <TouchableOpacity style={styles.goalChip}>
            <Text style={styles.goalChipText}>{profile.goal}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menuCard}>
        <MenuItem emoji="🔔" label="Notifications" />
        <MenuItem emoji="🔗" label="Sync Devices" />
        <MenuItem emoji="⚙️" label="Settings" />
        <MenuItem emoji="❓" label="Help & Support" />
        <MenuItem emoji="🚪" label="Log Out" onPress={handleLogout} />
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  loginScreen: { flex: 1, backgroundColor: "#E7EBEC" },
  loginContent: { flexGrow: 1 },
  loginTopBar: {
    height: 52,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EEF1F1",
  },
  loginBack: { fontSize: 22, color: "#111827", fontWeight: "600" },
  loginBrand: { fontSize: 18, fontWeight: "800", color: "#111827" },
  heroBlock: {
    height: 190,
    backgroundColor: "#A7BEB5",
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
    color: "#101828",
    fontWeight: "900",
  },
  loginSubtitle: {
    marginTop: 8,
    color: "#4B5B70",
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
    color: "#38495D",
  },
  inputShell: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#C4ECCC",
    borderRadius: 12,
    backgroundColor: "#EFF2F4",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  inputIcon: { fontSize: 16, color: "#8597AA", marginRight: 8 },
  loginInput: {
    flex: 1,
    color: "#26374C",
    fontSize: 14,
    lineHeight: 18,
    paddingVertical: 10,
  },
  eyeButton: { paddingHorizontal: 4, paddingVertical: 4 },
  eyeText: { color: "#8597AA", fontWeight: "600" },
  forgotBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
  },
  forgotText: { color: "#22C55E", fontSize: 13, fontWeight: "700" },
  loginError: {
    marginTop: 8,
    fontSize: 16,
    color: "#B42318",
    fontWeight: "700",
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: "#2EEB56",
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#13B83A",
    shadowOpacity: 0.26,
    shadowRadius: 12,
    elevation: 4,
  },
  loginButtonText: { color: "#0C111D", fontSize: 28, fontWeight: "800" },
  socialDividerRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  socialDividerLine: { flex: 1, height: 1, backgroundColor: "#CBD5E1" },
  socialDividerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.3,
  },
  socialRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 12,
  },
  socialButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7DCE2",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  socialButtonText: { color: "#344054", fontSize: 14, fontWeight: "700" },
  signupRow: {
    marginTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signupMuted: { fontSize: 13, color: "#475467" },
  signupLink: { fontSize: 13, color: "#22C55E", fontWeight: "700" },

  header: {
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 24,
    backgroundColor: "#fff",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: { fontSize: 24, fontWeight: "800", color: "#fff" },
  name: { fontSize: 20, fontWeight: "800", color: "#1A1A2E" },
  email: { fontSize: 13, color: "#9E9E9E", marginTop: 2 },
  editBtn: {
    marginTop: 12,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editBtnText: { color: "#4CAF50", fontWeight: "700", fontSize: 13 },
  statusCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 4,
  },
  statusSubtitle: { fontSize: 13, color: "#2E7D32", lineHeight: 18 },
  accountCard: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
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
    borderBottomColor: "#F5F7FA",
  },
  accountLabel: { fontSize: 13, fontWeight: "700", color: "#9E9E9E" },
  accountValue: { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },

  bmiCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bmiTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9E9E9E",
    letterSpacing: 1,
  },
  bmiValue: { fontSize: 38, fontWeight: "900", color: "#1A1A2E", marginTop: 2 },
  bmiNormalBadge: {
    backgroundColor: "#4CAF50",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  bmiNormalText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  bmiRight: { flex: 1, justifyContent: "center" },
  bmiDesc: { fontSize: 12, color: "#555", lineHeight: 17, marginBottom: 8 },
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
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 12,
  },
  bodyInfoRow: { flexDirection: "row", justifyContent: "space-between" },
  bodyInfoItem: { alignItems: "center" },
  bodyInfoLabel: { fontSize: 11, color: "#9E9E9E", fontWeight: "600" },
  bodyInfoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginTop: 4,
  },

  goalCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  goalRow: { flexDirection: "row", gap: 10 },
  goalChip: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  goalChipText: { fontSize: 14, fontWeight: "700", color: "#fff" },

  menuCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F7FA",
  },
  menuEmoji: { fontSize: 18, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, color: "#1A1A2E", fontWeight: "500" },
  menuArrow: { fontSize: 20, color: "#BDBDBD" },
});
