import { Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useDatabaseReady } from "../hooks/useDatabaseReady";
import { t } from "../i18n";
import { useColors } from "../ui/theme";

export default function RootLayout() {
  const status = useDatabaseReady();
  const c = useColors();

  if (status.state !== "ready") {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        {status.state === "error" ? (
          <Text style={[styles.error, { color: c.text }]}>{t.dbError}</Text>
        ) : (
          <ActivityIndicator accessibilityLabel={t.loading} />
        )}
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: t.home.title }} />
      <Stack.Screen name="review" options={{ title: t.review.title }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { fontSize: 16, textAlign: "center" },
});
