import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { PACE_OPTIONS } from "../domain/config";
import { useDevTools } from "../hooks/useDevTools";
import { useProfile } from "../hooks/useProfile";
import { LANGUAGE_NAMES, useStrings, type UiLang } from "../i18n";
import { OptionList } from "../ui/OptionList";
import { useColors } from "../ui/theme";

const LANGS = Object.keys(LANGUAGE_NAMES) as UiLang[];

export default function Settings() {
  const { profile, update } = useProfile();
  const t = useStrings();
  const c = useColors();

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={[styles.heading, { color: c.muted }]}>{t.settings.language}</Text>
        <OptionList
          options={LANGS.map((l) => ({ key: l, label: LANGUAGE_NAMES[l] }))}
          selected={profile.uiLang}
          onSelect={(uiLang) => update({ uiLang })}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.heading, { color: c.muted }]}>{t.settings.pace}</Text>
        <OptionList
          options={PACE_OPTIONS.map((p) => ({ key: p, label: t.onboarding.paceOption(p), detail: t.onboarding.paceNames[p] }))}
          selected={profile.newPerDay}
          onSelect={(newPerDay) => update({ newPerDay })}
        />
        <Text style={[styles.note, { color: c.muted }]}>{t.settings.paceNote}</Text>
      </View>

      <View style={styles.section}>
        <View style={[styles.switchRow, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.label, { color: c.text }]}>{t.settings.game}</Text>
          <Switch
            accessibilityLabel={t.settings.game}
            value={profile.gameEnabled}
            onValueChange={(gameEnabled) => update({ gameEnabled })}
          />
        </View>
        <Text style={[styles.note, { color: c.muted }]}>{t.settings.gameNote}</Text>
      </View>

      {__DEV__ && <DevTools />}
    </ScrollView>
  );
}

/** Development only, never in a release build: test reviews on later days, or start over. */
function DevTools() {
  const { today, offsetDays, nextDay, reset } = useDevTools();
  const t = useStrings();
  const c = useColors();
  const dev = t.settings.dev;

  function confirmReset() {
    Alert.alert(dev.resetTitle, dev.resetText, [
      { text: dev.cancel, style: "cancel" },
      { text: dev.reset, style: "destructive", onPress: reset },
    ]);
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.heading, { color: c.muted }]}>{dev.title}</Text>
      <View style={[styles.group, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.row, styles.label, { color: c.muted }]}>
          {dev.clock(t.date(today, Number(today.slice(0, 4))), offsetDays)}
        </Text>
        <Pressable accessibilityRole="button" onPress={nextDay} style={[styles.row, styles.divider, { borderColor: c.border }]}>
          <Text style={[styles.label, { color: c.accent }]}>{dev.nextDay}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={confirmReset} style={[styles.row, styles.divider, { borderColor: c.border }]}>
          <Text style={[styles.label, { color: c.danger }]}>{dev.reset}</Text>
        </Pressable>
      </View>
      <Text style={[styles.note, { color: c.muted }]}>{dev.note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 28 },
  section: { gap: 8 },
  heading: { fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginLeft: 4 },
  note: { fontSize: 13, lineHeight: 18, marginLeft: 4 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  label: { fontSize: 17 },
  group: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  row: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 14, justifyContent: "center" },
  divider: { borderTopWidth: StyleSheet.hairlineWidth },
});
