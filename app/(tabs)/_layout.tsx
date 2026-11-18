import { Tabs, usePathname, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Tab order left to right, used for swiping between tabs.
const TAB_PATHS = ["/", "/recipes", "/groceries", "/profile"] as const;
const SWIPE_DISTANCE = 60;

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const router = useRouter();
  const pathname = usePathname();

  // Horizontal swipe = previous/next tab. Starts only after 30 px sideways and
  // gives up after 20 px vertical, so normal scrolling keeps working.
  const swipe = usePanGesture({
    activeOffsetX: [-30, 30],
    failOffsetY: [-20, 20],
    runOnJS: true,
    onDeactivate: (e) => {
      const step =
        e.translationX <= -SWIPE_DISTANCE ? 1 : e.translationX >= SWIPE_DISTANCE ? -1 : 0;
      const index = TAB_PATHS.indexOf(pathname as (typeof TAB_PATHS)[number]);
      const next = TAB_PATHS[index + step];
      if (step !== 0 && index !== -1 && next) router.navigate(next);
    },
  });

  return (
    <GestureDetector gesture={swipe}>
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        headerShown: false,
        // Small left/right slide between tabs (Profile opts out below).
        animation: "shift",
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Planner",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="calendar" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: "Recipes",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="fork.knife" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="groceries"
        options={{
          title: "Groceries",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="cart.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          animation: "none",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
    </View>
    </GestureDetector>
  );
}
