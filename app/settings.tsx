import { deleteAccount } from "@/constants/api";
import { useProfile } from "@/contexts/profile-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Appearance,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type ThemePreference = "light" | "dark";

const THEME_PREF_KEY = "theme_preference";
const LAST_PROFILE_EMAIL_KEY = "last_profile_email";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  onPress,
  danger,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.rowLabel, danger ? styles.rowLabelDanger : null]}>
        {label}
      </Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {onPress ? <Text style={styles.rowArrow}>›</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, profile } = useProfile();
  const [themePreference, setThemePreference] =
    useState<ThemePreference>("light");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_PREF_KEY)
      .then((savedPreference: string | null) => {
        if (savedPreference === "light" || savedPreference === "dark") {
          setThemePreference(savedPreference);
          Appearance.setColorScheme(savedPreference);
        }
      })
      .catch(() => {
        /* no-op */
      });
  }, []);

  const applyThemePreference = async (nextPreference: ThemePreference) => {
    setThemePreference(nextPreference);
    Appearance.setColorScheme(nextPreference);
    await AsyncStorage.setItem(THEME_PREF_KEY, nextPreference);
  };

  const openLegal = (title: string) => {
    router.push({
      pathname: "/legal",
      params: { title },
    } as any);
  };

  const confirmDeleteAccount = () => {
    if (!profile.email) {
      Alert.alert(
        "No account connected",
        "Connect an account before deleting it.",
      );
      return;
    }

    Alert.alert(
      "Delete my account",
      "This will permanently remove your account and profile data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Final confirmation",
              "Are you absolutely sure? This action cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete account",
                  style: "destructive",
                  onPress: async () => {
                    setIsDeleting(true);
                    const ok = await deleteAccount(profile.email);
                    setIsDeleting(false);

                    if (!ok) {
                      Alert.alert(
                        "Deletion failed",
                        "Could not delete the account. Check your API endpoint delete_account.php.",
                      );
                      return;
                    }

                    await AsyncStorage.removeItem(LAST_PROFILE_EMAIL_KEY);
                    logout();
                    Alert.alert(
                      "Account deleted",
                      "Your account has been removed.",
                    );
                    router.replace("/(tabs)/profile");
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: "Settings" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.pageTitle}>Settings</Text>

        <Section title="Appearance">
          <View style={styles.themeSwitchRow}>
            <TouchableOpacity
              style={[
                styles.themeChip,
                themePreference === "light" ? styles.themeChipActive : null,
              ]}
              onPress={() => applyThemePreference("light")}
            >
              <Text
                style={[
                  styles.themeChipText,
                  themePreference === "light"
                    ? styles.themeChipTextActive
                    : null,
                ]}
              >
                White mode
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.themeChip,
                themePreference === "dark" ? styles.themeChipActive : null,
              ]}
              onPress={() => applyThemePreference("dark")}
            >
              <Text
                style={[
                  styles.themeChipText,
                  themePreference === "dark"
                    ? styles.themeChipTextActive
                    : null,
                ]}
              >
                Dark mode
              </Text>
            </TouchableOpacity>
          </View>
        </Section>

        <Section title="Personal Information">
          <Row
            label="Edit personal information"
            value="Open"
            onPress={() => router.push("/profile-setup" as any)}
          />
        </Section>

        <Section title="Legal">
          <Row
            label="Cookie policy"
            value="View"
            onPress={() => openLegal("Cookie policy")}
          />
          <Row
            label="Personal data protection policy"
            value="View"
            onPress={() => openLegal("Personal data protection policy")}
          />
          <Row
            label="Terms and conditions of use"
            value="View"
            onPress={() => openLegal("Terms and conditions of use")}
          />
        </Section>

        <Section title="Account">
          <Row
            label={isDeleting ? "Deleting account..." : "Delete my account"}
            danger
            onPress={isDeleting ? undefined : confirmDeleteAccount}
          />
        </Section>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  content: { padding: 16, paddingBottom: 30 },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 12,
  },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  row: {
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F3F7",
  },
  rowLabel: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  rowLabelDanger: { color: "#C62828" },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowValue: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  rowArrow: { fontSize: 18, color: "#B0B7C3" },
  themeSwitchRow: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
  },
  themeChip: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D6DCE5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  themeChipActive: {
    borderColor: "#4CAF50",
    backgroundColor: "#E8F5E9",
  },
  themeChipText: { color: "#475467", fontWeight: "700", fontSize: 13 },
  themeChipTextActive: { color: "#2E7D32" },
});
