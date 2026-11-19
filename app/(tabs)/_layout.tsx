import * as Haptics from "expo-haptics";
import { TopTabs } from "expo-router/js-top-tabs";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useLanguage } from "@/contexts/language-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Swipeable pager with the tab bar at the bottom: pages sit side by side and
// follow the finger when swiping. Screens are created up front (lazy: false),
// so switching never waits for a first render.
export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <TopTabs
      tabBarPosition="bottom"
      screenListeners={{
        tabPress: () => {
          // Soft haptic feedback on iOS when pressing a tab.
          if (process.env.EXPO_OS === "ios") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        },
      }}
      screenOptions={{
        swipeEnabled: true,
        lazy: false,
        tabBarShowIcon: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarPressColor: "transparent",
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          paddingBottom: insets.bottom,
          elevation: 0,
          shadowOpacity: 0,
        },
        // Thin line above the active tab, sliding along as you swipe.
        tabBarIndicatorStyle: { backgroundColor: colors.primary, top: 0 },
        tabBarItemStyle: { paddingVertical: 4 },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          textTransform: "none",
          margin: 0,
        },
      }}
    >
      <TopTabs.Screen
        name="index"
        options={{
          title: t("Planner"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="calendar" color={color} />
          ),
        }}
      />
      <TopTabs.Screen
        name="recipes"
        options={{
          title: t("Recipes"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="fork.knife" color={color} />
          ),
        }}
      />
      <TopTabs.Screen
        name="groceries"
        options={{
          title: t("Groceries"),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="cart.fill" color={color} />
          ),
        }}
      />
      <TopTabs.Screen
        name="profile"
        options={{
          title: t("Profile"),
          // Tapping the Profile tab jumps straight to it (swiping still slides).
          animationEnabled: false,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="person.fill" color={color} />
          ),
        }}
      />
    </TopTabs>
  );
}
