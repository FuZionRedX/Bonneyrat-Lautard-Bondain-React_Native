import { Nunito_800ExtraBold, Nunito_900Black, useFonts } from "@expo-google-fonts/nunito";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Appearance } from "react-native";

import { Colors, THEME_PREF_KEY } from "@/constants/theme";
import { LanguageProvider, useLanguage } from "@/contexts/language-context";
import { MealPlanProvider } from "@/contexts/meal-plan-context";
import { ProfileProvider, useProfile } from "@/contexts/profile-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Keep the splash screen up until the heading font is ready.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op */
});

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

// Applies the account's saved language on login (null = never chosen: keep the current one).
function LanguageSync() {
  const { profile } = useProfile();
  const { setLanguage } = useLanguage();

  useEffect(() => {
    if (profile.email && profile.language) {
      setLanguage(profile.language);
    }
  }, [profile.email, profile.language, setLanguage]);

  return null;
}

// Navigation themes using the app palette, so headers and screen backgrounds match.
const navThemes = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: Colors.light.primary,
      background: Colors.light.screenBackground,
      card: Colors.light.screenBackground,
      text: Colors.light.text,
      border: Colors.light.border,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: Colors.dark.primary,
      background: Colors.dark.screenBackground,
      card: Colors.dark.screenBackground,
      text: Colors.dark.text,
      border: Colors.dark.border,
    },
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({ Nunito_800ExtraBold, Nunito_900Black });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  // On a font error the app still starts, with the system font.
  if (!fontsLoaded && !fontError) return null;

  return (
    <LanguageProvider>
    <ProfileProvider>
      <ThemeSync />
      <LanguageSync />
      <MealPlanProvider>
        <ThemeProvider value={colorScheme === "dark" ? navThemes.dark : navThemes.light}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </MealPlanProvider>
    </ProfileProvider>
    </LanguageProvider>
  );
}
