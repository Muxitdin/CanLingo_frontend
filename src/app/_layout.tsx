import { Link, Stack } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Provider } from "react-redux";

import { useDatabaseReady } from "../hooks/useDatabaseReady";
import { useStrings } from "../i18n";
import { store, useAppSelector } from "../store";
import { useColors } from "../ui/theme";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <RootStack />
    </Provider>
  );
}

function RootStack() {
  const status = useDatabaseReady();
  const onboarded = useAppSelector((s) => s.profile?.onboardedAt != null);
  const t = useStrings();
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
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: c.background },
      }}
    >
      {/* Onboarding comes first; once it's done the guards swap and the router moves to the home screen. */}
      <Stack.Protected guard={onboarded}>
        <Stack.Screen
          name="index"
          options={{
            title: t.home.title,
            headerRight: () => (
              <Link href="/settings" asChild>
                <Pressable accessibilityRole="button" hitSlop={12}>
                  <Text style={[styles.headerLink, { color: c.accent }]}>{t.home.settings}</Text>
                </Pressable>
              </Link>
            ),
          }}
        />
        <Stack.Screen name="review" options={{ title: t.review.title }} />
        <Stack.Screen name="settings" options={{ title: t.settings.title }} />
      </Stack.Protected>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { fontSize: 16, textAlign: "center" },
  headerLink: { fontSize: 17 },
});
