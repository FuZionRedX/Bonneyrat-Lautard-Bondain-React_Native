import { Stack } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function HelpSupportScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Help & Support" }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Need Help?</Text>
        <Text style={styles.subtitle}>
          Contact our support team and we will get back to you between our openning hours
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>support@vitalsync.app</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>+44 7398116388</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Hours</Text>
            <Text style={styles.value}>Thur, 2:00AM-2:01AM</Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A2E",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: "#54627A",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 12,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F5",
  },
  label: {
    fontSize: 12,
    color: "#8A94A6",
    marginBottom: 4,
    fontWeight: "600",
  },
  value: {
    fontSize: 15,
    color: "#1A1A2E",
    fontWeight: "600",
  },
});
