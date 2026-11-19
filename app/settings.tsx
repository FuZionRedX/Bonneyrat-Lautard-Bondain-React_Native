import { changePassword, deleteAccount, saveProfile } from "@/lib/api";
import { Language, LANGUAGES, translate } from "@/lib/translations";
import { Colors, LAST_PROFILE_EMAIL_KEY, THEME_PREF_KEY } from "@/constants/theme";
import { useMealPlan } from "@/contexts/meal-plan-context";
import { useProfile } from "@/contexts/profile-context";
import { useLanguage } from "@/contexts/language-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Appearance,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type ThemePreference = "light" | "dark";

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, profile, updateProfile } = useProfile();
  const { setSelectedByCategory } = useMealPlan();
  // The saved preference is applied app-wide by ThemeSync in app/_layout.tsx.
  const themePreference: ThemePreference = useColorScheme();
  const colors = Colors[themePreference];
  const { language, setLanguage, t } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const submitPasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert(t("Change password"), t("Fill in both fields."));
      return;
    }
    setIsSavingPassword(true);
    const ok = await changePassword(profile.email, currentPassword, newPassword);
    setIsSavingPassword(false);
    if (!ok) {
      Alert.alert(t("Change password"), t("Current password is wrong, or the server is unreachable."));
      return;
    }
    // Later requests authenticate with the new password.
    updateProfile({ ...profile, password: newPassword });
    setCurrentPassword("");
    setNewPassword("");
    setShowPasswordForm(false);
    Alert.alert(t("Change password"), t("Your password has been changed."));
  };

  const applyThemePreference = async (nextPreference: ThemePreference) => {
    Appearance.setColorScheme?.(nextPreference);
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
      if (!(await saveProfile(nextProfile)).success) throw new Error();
    } catch {
      Alert.alert(
        t("Sync failed"),
        t("Theme changed locally, but we could not save dark mode to the server."),
      );
    }
  };

  const applyLanguage = async (next: Language) => {
    setLanguage(next);

    if (!profile.email) {
      return;
    }

    const nextProfile = { ...profile, language: next };
    updateProfile(nextProfile);

    try {
      if (!(await saveProfile(nextProfile)).success) throw new Error();
    } catch {
      // translate() with the new language: t() still holds the previous one here.
      Alert.alert(
        translate(next, "Sync failed"),
        translate(next, "Language changed locally, but we could not save it to the server."),
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
        t("No account connected"),
        t("Connect an account before deleting it."),
      );
      return;
    }

    Alert.alert(
      t("Delete my account"),
      t("This will permanently remove your account and profile data."),
      [
        { text: t("Cancel"), style: "cancel" },
        {
          text: t("Continue"),
          style: "destructive",
          onPress: () => {
            Alert.alert(
              t("Final confirmation"),
              t("Are you absolutely sure? This action cannot be undone."),
              [
                { text: t("Cancel"), style: "cancel" },
                {
                  text: t("Delete account"),
                  style: "destructive",
                  onPress: async () => {
                    setIsDeleting(true);
                    const ok = await deleteAccount(
                      profile.email,
                      profile.password,
                    );
                    setIsDeleting(false);

                    if (!ok) {
                      Alert.alert(
                        t("Deletion failed"),
                        t("Could not delete the account. Check your API endpoint delete_account.php."),
                      );
                      return;
                    }

                    await AsyncStorage.removeItem(LAST_PROFILE_EMAIL_KEY);
                    setSelectedByCategory({});
                    logout();
                    Alert.alert(
                      t("Account deleted"),
                      t("Your account has been removed."),
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
      <Stack.Screen options={{ title: t("Settings") }} />
      {/* Lifts the page above the keyboard so the change-password fields stay visible. */}
      <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView
        style={[styles.container, { backgroundColor: colors.screenBackground }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t("Settings")}</Text>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subtitleText }]}>
            {t("Appearance")}
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
              <TouchableOpacity accessibilityRole="radio"
                accessibilityState={{ checked: themePreference === "light" }}
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
                  {t("White mode")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="radio"
                accessibilityState={{ checked: themePreference === "dark" }}
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
                  {t("Dark mode")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subtitleText }]}>
            {t("Language")}
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
            <View style={[styles.themeSwitchRow, styles.languageRow]}>
              {LANGUAGES.map((option) => {
                const selected = language === option.code;
                return (
                  <TouchableOpacity accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    key={option.code}
                    style={[
                      styles.themeChip,
                      styles.languageChip,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.inputBackground,
                      },
                      selected && {
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryLight,
                      },
                    ]}
                    onPress={() => applyLanguage(option.code)}
                  >
                    <Text
                      style={[
                        styles.themeChipText,
                        { color: colors.labelText },
                        selected && { color: colors.primaryText },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subtitleText }]}>
            {t("Personal Information")}
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
            <TouchableOpacity accessibilityRole="button"
              style={[styles.row, { borderBottomColor: colors.borderLight }]}
              onPress={() => router.push("/profile-setup" as any)}
              activeOpacity={0.75}
            >
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                {t("Edit personal information")}
              </Text>
              <View style={styles.rowRight}>
                <Text style={[styles.rowValue, { color: colors.subtitleText }]}>
                  {t("Open")}
                </Text>
                <Text
                  style={[styles.rowArrow, { color: colors.secondaryText }]}
                >
                  &rsaquo;
                </Text>
              </View>
            </TouchableOpacity>
            {profile.email ? (
              <TouchableOpacity accessibilityRole="button"
                style={[styles.row, { borderBottomColor: colors.borderLight }]}
                onPress={() => setShowPasswordForm((v) => !v)}
                activeOpacity={0.75}
                accessibilityState={{ expanded: showPasswordForm }}
              >
                <Text style={[styles.rowLabel, { color: colors.text }]}>
                  {t("Change password")}
                </Text>
                <Text style={[styles.rowArrow, { color: colors.secondaryText }]}>
                  {showPasswordForm ? "⌄" : "›"}
                </Text>
              </TouchableOpacity>
            ) : null}
            {showPasswordForm ? (
              <View style={styles.passwordForm}>
                <TextInput
                  style={[styles.passwordInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBackground }]}
                  placeholder={t("Current password")}
                  placeholderTextColor={colors.secondaryText}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  accessibilityLabel={t("Current password")}
                />
                <TextInput
                  style={[styles.passwordInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBackground }]}
                  placeholder={t("New password")}
                  placeholderTextColor={colors.secondaryText}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  accessibilityLabel={t("New password")}
                />
                <TouchableOpacity accessibilityRole="button"
                  style={[styles.passwordSave, { backgroundColor: colors.primary }]}
                  onPress={isSavingPassword ? undefined : submitPasswordChange}
                  disabled={isSavingPassword}
                >
                  <Text style={styles.passwordSaveText}>
                    {isSavingPassword ? t("Saving...") : t("Save new password")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.subtitleText }]}>
            {t("Legal")}
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
              <TouchableOpacity accessibilityRole="button"
                key={label}
                style={[styles.row, { borderBottomColor: colors.borderLight }]}
                onPress={() => openLegal(label)}
                activeOpacity={0.75}
              >
                <Text style={[styles.rowLabel, { color: colors.text }]}>
                  {t(label)}
                </Text>
                <View style={styles.rowRight}>
                  <Text
                    style={[styles.rowValue, { color: colors.subtitleText }]}
                  >
                    {t("View")}
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
            {t("Account")}
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
            <TouchableOpacity accessibilityRole="button"
              style={[styles.row, { borderBottomColor: colors.borderLight }]}
              onPress={isDeleting ? undefined : confirmDeleteAccount}
              disabled={isDeleting}
              activeOpacity={0.75}
            >
              <Text style={[styles.rowLabel, { color: colors.dangerText }]}>
                {isDeleting ? t("Deleting account...") : t("Delete my account")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 }, // scroll room above the keyboard
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
  passwordForm: { paddingVertical: 12, gap: 10 },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  passwordSave: { borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  passwordSaveText: { color: "#fff", fontWeight: "700", fontSize: 14 },
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
  languageRow: { flexWrap: "wrap" },
  languageChip: { flexBasis: "40%" }, // two per row
});
