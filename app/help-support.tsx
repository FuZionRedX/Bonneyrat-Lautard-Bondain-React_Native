import { Stack, useRouter } from "expo-router";
import React from "react";
import { Image, Linking, ScrollView, StyleSheet, Text, View } from "react-native";

import { BackHeader, Button, GroupCard, heading, ListRow } from "@/components/ui/kit";
import { Colors } from "@/constants/theme";
import { useLanguage } from "@/contexts/language-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

const SUPPORT_EMAIL = "support@vitalsync.app";
const SUPPORT_PHONE = "+44 7398116388";

export default function HelpSupportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { t } = useLanguage();

  const open = (url: string) => {
    Linking.openURL(url).catch(() => {
      /* no mail or phone app: the details stay visible on screen */
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false, title: t("Help & Support") }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.screenBackground }]}
        contentContainerStyle={styles.content}
      >
        <BackHeader title={t("Help & Support")} onBack={() => router.back()} backLabel={t("Go back")} />

        <View style={[styles.hero, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
          <Image source={require("@/assets/images/logo-cropped.png")} style={styles.heroLogo} resizeMode="contain" accessible={false} />
          <View style={styles.flex}>
            <Text style={[heading(20), { color: colors.text }]} accessibilityRole="header">
              {t("Need Help?")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.tertiaryText }]}>
              {t("Contact our support team and we will get back to you during our opening hours.")}
            </Text>
          </View>
        </View>

        <GroupCard title={t("Contact Information")}>
          <ListRow icon="mail" label={t("Email")} value={SUPPORT_EMAIL} onPress={() => open(`mailto:${SUPPORT_EMAIL}`)} />
          <ListRow icon="phone" label={t("Phone")} value={SUPPORT_PHONE} onPress={() => open(`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`)} />
          <ListRow icon="clock" label={t("Hours")} value={t("Thur, 2:00AM-2:01AM")} last />
        </GroupCard>

        <Button label={t("Email")} icon="mail" onPress={() => open(`mailto:${SUPPORT_EMAIL}`)} style={styles.button} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  flex: { flex: 1 },
  hero: {
    marginHorizontal: 20,
    marginTop: 4,
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroLogo: { width: 72, height: 62 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  button: { marginHorizontal: 20, marginTop: 18 },
});
