import Feather from "@expo/vector-icons/Feather";

import { BackHeader, Button, GroupCard, ListRow, softShadow } from "@/components/ui/kit";
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

  const choice = (selected: boolean) => [
    styles.choice,
    selected ? [{ backgroundColor: colors.cardBackground }, softShadow(colors)] : null,
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: t("Settings") }} />
      {/* Lifts the page above the keyboard so the change-password fields stay visible. */}
      <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView
        style={[styles.container, { backgroundColor: colors.screenBackground }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <BackHeader title={t("Settings")} onBack={() => router.back()} backLabel={t("Go back")} />

        <GroupCard title={t("Appearance")}>
          <View style={[styles.segment, { backgroundColor: colors.cardMuted }]} accessibilityRole="radiogroup">
            {(["light", "dark"] as const).map((mode) => {
              const selected = themePreference === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  style={choice(selected)}
                  onPress={() => applyThemePreference(mode)}
                >
                  <Feather name={mode === "light" ? "sun" : "moon"} size={17} color={selected ? colors.primaryText : colors.secondaryText} />
                  <Text style={[styles.choiceText, { color: selected ? colors.text : colors.secondaryText }]}>
                    {mode === "light" ? t("White mode") : t("Dark mode")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GroupCard>

        <GroupCard title={t("Language")}>
          <View style={[styles.segment, styles.wrap, { backgroundColor: colors.cardMuted }]} accessibilityRole="radiogroup">
            {LANGUAGES.map((option) => {
              const selected = language === option.code;
              return (
                <TouchableOpacity
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={option.code}
                  style={[choice(selected), styles.languageChoice]}
                  onPress={() => applyLanguage(option.code)}
                >
                  <Text style={[styles.choiceText, { color: selected ? colors.text : colors.secondaryText }]}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GroupCard>

        <GroupCard title={t("Personal Information")}>
          <ListRow
            icon="edit-3"
            label={t("Edit personal information")}
            onPress={() => router.push("/profile-setup")}
            last={!profile.email}
          />
          {profile.email ? (
            <ListRow
              icon="lock"
              label={t("Change password")}
              onPress={() => setShowPasswordForm((v) => !v)}
              right={<Feather name={showPasswordForm ? "chevron-up" : "chevron-down"} size={18} color={colors.secondaryText} />}
              last={!showPasswordForm}
            />
          ) : null}
          {showPasswordForm ? (
            <View style={styles.passwordForm}>
              <TextInput
                style={[styles.passwordInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBackground }]}
                placeholder={t("Current password")}
                placeholderTextColor={colors.placeholderText}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
                accessibilityLabel={t("Current password")}
              />
              <TextInput
                style={[styles.passwordInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.inputBackground }]}
                placeholder={t("New password")}
                placeholderTextColor={colors.placeholderText}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                accessibilityLabel={t("New password")}
              />
              <Button
                label={isSavingPassword ? t("Saving...") : t("Save new password")}
                onPress={submitPasswordChange}
                loading={isSavingPassword}
              />
            </View>
          ) : null}
        </GroupCard>

        <GroupCard title={t("Legal")}>
          {["Cookie policy", "Personal data protection policy", "Terms and conditions of use"].map((label, i, all) => (
            <ListRow
              key={label}
              icon={i === 1 ? "shield" : "file-text"}
              label={t(label)}
              onPress={() => openLegal(label)}
              last={i === all.length - 1}
            />
          ))}
        </GroupCard>

        <GroupCard title={t("Account")}>
          <ListRow
            icon="trash-2"
            label={isDeleting ? t("Deleting account...") : t("Delete my account")}
            onPress={isDeleting ? undefined : confirmDeleteAccount}
            danger
            last
          />
        </GroupCard>
      </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 120 }, // scroll room above the keyboard
  segment: { flexDirection: "row", gap: 4, padding: 4, borderRadius: 16, marginVertical: 8 },
  wrap: { flexWrap: "wrap" },
  choice: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  languageChoice: { flexBasis: "45%" }, // two per row
  choiceText: { fontSize: 14, fontWeight: "700" },
  passwordForm: { paddingVertical: 12, gap: 10 },
  passwordInput: { minHeight: 50, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, fontSize: 15 },
});
