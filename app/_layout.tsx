import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Appearance } from "react-native";
import "react-native-reanimated";

import { THEME_PREF_KEY } from "@/constants/theme";
import { MealPlanProvider } from "@/contexts/meal-plan-context";
import { ProfileProvider, useProfile } from "@/contexts/profile-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

// Applies the saved theme at startup and the account's theme on login, on every screen.
function ThemeSync() {
  const { profile } = useProfile();

  useEffect(() => {
    if (profile.email) {
      const preference = profile.darkMode ? "dark" : "light";
      Appearance.setColorScheme?.(preference);
      AsyncStorage.setItem(THEME_PREF_KEY, preference).catch(() => {
        /* no-op */
      });
      return;
    }

    AsyncStorage.getItem(THEME_PREF_KEY)
      .then((saved) => {
        if (saved === "light" || saved === "dark") {
          Appearance.setColorScheme?.(saved);
        }
      })
      .catch(() => {
        /* no-op */
      });
  }, [profile.darkMode, profile.email]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ProfileProvider>
      <ThemeSync />
      <MealPlanProvider>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </MealPlanProvider>
    </ProfileProvider>
  );
}
