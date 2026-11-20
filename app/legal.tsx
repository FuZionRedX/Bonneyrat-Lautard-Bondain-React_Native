import { Colors } from "@/constants/theme";
import { useLanguage } from "@/contexts/language-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

import { BackHeader, Card, heading } from "@/components/ui/kit";

const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non purus id velit finibus lacinia. Curabitur id mattis augue. Nulla facilisi. Integer pulvinar varius justo, sed cursus erat egestas non. Cras volutpat, felis id iaculis tempor, sem eros congue augue, sed iaculis justo lacus vitae nibh. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum congue dignissim risus, non tristique odio posuere et. Aenean id urna et magna dapibus bibendum. Duis vulputate, dui in facilisis ornare, neque neque interdum mi, et congue mauris sapien in nibh. Curabitur pulvinar orci sit amet turpis blandit, vitae posuere nibh viverra. Suspendisse potenti. Aliquam erat volutpat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla eget sem id urna hendrerit tristique. Vestibulum ut quam sapien. Nam ac pulvinar elit. Sed non orci feugiat, ultrices libero id, tincidunt justo. Maecenas luctus auctor urna, vitae viverra est dictum quis. Mauris tristique nulla et est vulputate, sed viverra est volutpat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi dictum lobortis velit, vitae scelerisque sem tincidunt non. Donec in ullamcorper urna. Integer in diam eget neque fermentum scelerisque. Pellentesque sagittis, ex ac ullamcorper tristique, est nisl tincidunt nisl, in ultricies lacus mauris vel sem. Vivamus in feugiat nisi. Etiam suscipit augue vel lectus pretium, et convallis orci consequat.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque ornare, arcu eu malesuada feugiat, augue nibh convallis orci, at efficitur turpis mauris et odio. Fusce placerat eros sed commodo posuere. Praesent bibendum, justo et congue suscipit, dui turpis eleifend sem, et pulvinar arcu justo et leo. Integer blandit massa in ligula pretium, ut dignissim dui malesuada.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed convallis laoreet sem, in euismod justo posuere non. Integer in consequat ipsum. Donec sed massa ut metus convallis ultrices. Nam volutpat porttitor nibh, in pellentesque lorem pellentesque nec. Ut in aliquam mi. In suscipit purus et hendrerit luctus. Nulla pellentesque ipsum ac lorem tristique, ac suscipit ipsum iaculis.`;

export default function LegalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ title?: string }>();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { t } = useLanguage();
  // Settings passes the English title; it is translated here.
  const title = t(params.title ?? "Legal");

  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: String(title) }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.screenBackground }]}
        contentContainerStyle={styles.content}
      >
        <BackHeader title={t("Legal")} onBack={() => router.back()} backLabel={t("Go back")} />
        <Card style={styles.card}>
          <Text style={[heading(24), { color: colors.text, marginBottom: 12 }]} accessibilityRole="header">
            {String(title)}
          </Text>
          <Text style={[styles.body, { color: colors.tertiaryText }]}>{LOREM}</Text>
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  card: { marginHorizontal: 20, marginTop: 4, padding: 20 },
  body: { fontSize: 14, lineHeight: 22 },
});
