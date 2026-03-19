import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function HelpSupportScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <>
      <Stack.Screen options={{ title: "Help & Support" }} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.screenBackground }]}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.title, { color: colors.text }]}>Need Help?</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
          Contact our support team and we will get back to you between our openning hours
        </Text>

        <View style={[styles.card, { backgroundColor: colors.cardBackground, shadowColor: colors.shadow }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Contact Information</Text>

          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Email</Text>
            <Text style={[styles.value, { color: colors.text }]}>support@vitalsync.app</Text>
          </View>

          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Phone</Text>
            <Text style={[styles.value, { color: colors.text }]}>+44 7398116388</Text>
          </View>

          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.label, { color: colors.secondaryText }]}>Hours</Text>
            <Text style={[styles.value, { color: colors.text }]}>Thur, 2:00AM-2:01AM</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: "600",
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
  },
});
