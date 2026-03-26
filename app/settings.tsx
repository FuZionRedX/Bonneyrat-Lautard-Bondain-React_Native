import { deleteAccount, saveProfile } from "@/constants/api";
import { Colors } from "@/constants/theme";
import { useProfile } from "@/contexts/profile-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
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

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, profile, updateProfile } = useProfile();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [themePreference, setThemePreference] =
    useState<ThemePreference>("light");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (profile.email) {
      const connectedPreference: ThemePreference = profile.darkMode
        ? "dark"
        : "light";

      setThemePreference(connectedPreference);
      Appearance.setColorScheme(connectedPreference);
      AsyncStorage.setItem(THEME_PREF_KEY, connectedPreference).catch(() => {
        /* no-op */
      });
      return;
    }

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
  }, [profile.darkMode, profile.email]);

  const applyThemePreference = async (nextPreference: ThemePreference) => {
    setThemePreference(nextPreference);
    Appearance.setColorScheme(nextPreference);
    await AsyncStorage.setItem(THEME_PREF_KEY, nextPreference);

    if (!profile.email) {
      return;
    }

    const nextProfile = {
      ...profile,
      darkMode: nextPreference === "dark",
    };

    updateProfile(nextProfile);

    try {
      await saveProfile(nextProfile);
    } catch {
      Alert.alert(
        "Sync failed",
        "Theme changed locally, but we could not save dark mode to the server.",
      );
    }
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
        style={[styles.container, { backgroundColor: colors.screenBackground }]}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>Settings</Text>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subtitleText }]}>
            Appearance
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBackground,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <View style={styles.themeSwitchRow}>
              <TouchableOpacity
                style={[
                  styles.themeChip,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.inputBackground,
                  },
                  themePreference === "light" && {
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryLight,
                  },
                ]}
                onPress={() => applyThemePreference("light")}
              >
                <Text
                  style={[
                    styles.themeChipText,
                    { color: colors.labelText },
                    themePreference === "light" && {
                      color: colors.primaryText,
                    },
                  ]}
                >
                  White mode
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeChip,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.inputBackground,
                  },
                  themePreference === "dark" && {
                    borderColor: colors.primary,
                    backgroundColor: colors.primaryLight,
                  },
                ]}
                onPress={() => applyThemePreference("dark")}
              >
                <Text
                  style={[
                    styles.themeChipText,
                    { color: colors.labelText },
                    themePreference === "dark" && { color: colors.primaryText },
                  ]}
                >
                  Dark mode
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subtitleText }]}>
            Personal Information
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBackground,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.borderLight }]}
              onPress={() => router.push("/profile-setup" as any)}
              activeOpacity={0.75}
            >
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                Edit personal information
              </Text>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValue, { color: colors.subtitleText }]}>
                  Open
                </Text>
                <Text
                  style={[styles.rowArrow, { color: colors.secondaryText }]}
                >
                  &rsaquo;
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subtitleText }]}>
            Legal
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBackground,
                shadowColor: colors.shadow,
              },
            ]}
          >
            {[
              "Cookie policy",
              "Personal data protection policy",
              "Terms and conditions of use",
            ].map((label) => (
              <TouchableOpacity
                key={label}
                style={[styles.row, { borderBottomColor: colors.borderLight }]}
                onPress={() => openLegal(label)}
                activeOpacity={0.75}
              >
                <Text style={[styles.rowLabel, { color: colors.text }]}>
                  {label}
                </Text>
                <View style={styles.rowRight}>
                  <Text
                    style={[styles.rowValue, { color: colors.subtitleText }]}
                  >
                    View
                  </Text>
                  <Text
                    style={[styles.rowArrow, { color: colors.secondaryText }]}
                  >
                    &rsaquo;
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subtitleText }]}>
            Account
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBackground,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.borderLight }]}
              onPress={isDeleting ? undefined : confirmDeleteAccount}
              disabled={isDeleting}
              activeOpacity={0.75}
            >
              <Text style={[styles.rowLabel, { color: colors.dangerText }]}>
                {isDeleting ? "Deleting account..." : "Delete my account"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 30 },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
  },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
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
  },
  rowLabel: { fontSize: 14, fontWeight: "600" },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowValue: { fontSize: 13, fontWeight: "600" },
  rowArrow: { fontSize: 18 },
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
    alignItems: "center",
    justifyContent: "center",
  },
  themeChipText: { fontWeight: "700", fontSize: 13 },
});
