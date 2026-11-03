import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { db } from "../db/client";
import { DEFAULT_REMINDER_MINUTES, PACE_OPTIONS, REMINDER_TIME_OPTIONS } from "../domain/config";
import { goalForecast } from "../hooks/study";
import { useProfile } from "../hooks/useProfile";
import { LANGUAGE_NAMES, useStrings, type UiLang } from "../i18n";
import { now } from "../services/clock";
import { askNotificationPermission } from "../services/notifications";
import { clockTime } from "../ui/formatTime";
import { OptionList } from "../ui/OptionList";
import { PrimaryButton } from "../ui/PrimaryButton";
import { useColors } from "../ui/theme";

const STEPS = ["language", "pace", "game", "reminder"] as const;
const LANGS = Object.keys(LANGUAGE_NAMES) as UiLang[];

/** First launch: interface language, pace with a finish-date forecast, the game layer and the daily reminder. */
export default function Onboarding() {
  const { profile, update } = useProfile();
  const t = useStrings();
  const c = useColors();
  const [step, setStep] = useState(0);
  const [pace, setPace] = useState(profile.newPerDay);
  const [game, setGame] = useState(profile.gameEnabled);
  const [reminder, setReminder] = useState<number | "off">(DEFAULT_REMINDER_MINUTES);
  const [forecasts] = useState(() => {
    const today = now();
    return new Map(PACE_OPTIONS.map((p) => [p, goalForecast(db, today, p)]));
  });
  const year = now().getFullYear();
  const current = STEPS[step];

  async function finish() {
    // The system prompt comes right after the user picked a time, so they know why it asks.
    const allowed = reminder !== "off" && (await askNotificationPermission());
    update({
      newPerDay: pace,
      gameEnabled: game,
      reminderMinutes: allowed ? reminder : null,
      onboardedAt: now().getTime(),
    });
  }

  return (
    <SafeAreaView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.brand, { color: c.accent }]}>CanLingo</Text>

        {current === "language" && (
          <View style={styles.step}>
            {/* Shown before a language is chosen, so the title is in both. */}
            <Text style={[styles.title, { color: c.text }]}>Tilni tanlang{"\n"}Выберите язык</Text>
            <OptionList
              options={LANGS.map((l) => ({ key: l, label: LANGUAGE_NAMES[l] }))}
              selected={profile.uiLang}
              onSelect={(uiLang) => update({ uiLang })}
            />
          </View>
        )}

        {current === "pace" && (
          <View style={styles.step}>
            <Text style={[styles.title, { color: c.text }]}>{t.onboarding.paceTitle}</Text>
            <OptionList
              options={PACE_OPTIONS.map((p) => {
                const finishOn = forecasts.get(p)?.finishOn;
                return {
                  key: p,
                  label: `${t.onboarding.paceNames[p] ?? ""} · ${t.onboarding.paceOption(p)}`,
                  detail: finishOn ? t.onboarding.forecast(t.date(finishOn, year)) : undefined,
                };
              })}
              selected={pace}
              onSelect={setPace}
            />
            <Text style={[styles.hint, { color: c.muted }]}>{t.onboarding.paceHint}</Text>
          </View>
        )}

        {current === "game" && (
          <View style={styles.step}>
            <Text style={[styles.title, { color: c.text }]}>{t.onboarding.gameTitle}</Text>
            <Text style={[styles.hint, { color: c.muted }]}>{t.onboarding.gameText}</Text>
            <OptionList
              options={[
                { key: "on", label: t.onboarding.gameOn },
                { key: "off", label: t.onboarding.gameOff },
              ]}
              selected={game ? "on" : "off"}
              onSelect={(k) => setGame(k === "on")}
            />
          </View>
        )}

        {current === "reminder" && (
          <View style={styles.step}>
            <Text style={[styles.title, { color: c.text }]}>{t.onboarding.reminderTitle}</Text>
            <Text style={[styles.hint, { color: c.muted }]}>{t.onboarding.reminderText}</Text>
            <OptionList<number | "off">
              options={[
                ...REMINDER_TIME_OPTIONS.map((m) => ({ key: m, label: clockTime(m) })),
                { key: "off", label: t.onboarding.reminderOff },
              ]}
              selected={reminder}
              onSelect={setReminder}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step < STEPS.length - 1 ? (
          <PrimaryButton label={t.onboarding.next} onPress={() => setStep(step + 1)} />
        ) : (
          <PrimaryButton label={t.onboarding.done} onPress={finish} />
        )}
        {step > 0 && <PrimaryButton label={t.onboarding.back} variant="plain" onPress={() => setStep(step - 1)} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 24, paddingTop: 32, gap: 24 },
  brand: { fontSize: 18, fontWeight: "700" },
  step: { gap: 16 },
  title: { fontSize: 28, fontWeight: "700", lineHeight: 34 },
  hint: { fontSize: 15, lineHeight: 21 },
  footer: { padding: 24, paddingTop: 8, gap: 10 },
});
