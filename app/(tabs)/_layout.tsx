import * as Haptics from "expo-haptics";
import { TopTabs } from "expo-router/js-top-tabs";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { Colors } from "@/constants/theme";
import { useLanguage } from "@/contexts/language-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Swipeable pager with a floating, rounded tab bar at the bottom: pages sit side
// by side and follow the finger when swiping. Screens are created up front
// (lazy: false), so switching never waits for a first render. The active tab
// sits on a soft green pill that slides along as you swipe.
export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  return (
    <TopTabs
      tabBarPosition="bottom"
      style={{ backgroundColor: colors.screenBackground }}
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
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarPressColor: "transparent",
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          marginHorizontal: 12,
          marginTop: 6,
          marginBottom: Math.max(insets.bottom, 12),
          borderRadius: 26,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
          elevation: 6,
          shadowColor: colors.shadow,
          shadowOpacity: 0.08,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
        },
        tabBarIndicatorStyle: {
          backgroundColor: colors.primaryLight,
          top: 6,
          height: 52,
          borderRadius: 18,
        },
        tabBarItemStyle: { height: 64, paddingVertical: 0 },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          textTransform: "none",
          margin: 0,
        },
      }}
    >
      <TopTabs.Screen
        name="index"
        options={{
          title: t("Home"),
          tabBarIcon: ({ color }) => (
            <Feather size={22} name="home" color={color as string} />
          ),
        }}
      />
      <TopTabs.Screen
        name="planner"
        options={{
          title: t("Planner"),
          tabBarIcon: ({ color }) => (
            <Feather size={22} name="calendar" color={color as string} />
          ),
        }}
      />
      <TopTabs.Screen
        name="recipes"
        options={{
          title: t("Recipes"),
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons size={23} name="silverware-fork-knife" color={color as string} />
          ),
        }}
      />
      <TopTabs.Screen
        name="groceries"
        options={{
          title: t("Groceries"),
          tabBarIcon: ({ color }) => (
            <Feather size={22} name="shopping-cart" color={color as string} />
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
            <Feather size={22} name="user" color={color as string} />
          ),
        }}
      />
    </TopTabs>
  );
}
