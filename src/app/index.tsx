import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useToday } from "../hooks/useToday";
import { t } from "../i18n";
import { PrimaryButton } from "../ui/PrimaryButton";
import { ProgressBar } from "../ui/ProgressBar";
import { useColors, type Colors } from "../ui/theme";

function Goal({ label, done, target, c }: { label: string; done: number; target: number; c: Colors }) {
  return (
    <View style={styles.goal}>
      <View style={styles.goalRow}>
        <Text style={[styles.goalLabel, { color: c.text }]}>{label}</Text>
        <Text style={[styles.goalCount, { color: c.muted }]}>
          {Math.min(done, target)} / {target}
        </Text>
      </View>
      <ProgressBar value={target === 0 ? 1 : done / target} />
    </View>
  );
}

export default function Home() {
  const router = useRouter();
  const c = useColors();
  const { progress: p, normComplete, available, gameEnabled, streak, level } = useToday();

  const started = p.newDone + p.reviewDone > 0;
  const action = available === 0 ? null : normComplete ? t.home.extra(available) : started ? t.home.continue : t.home.start;

  return (
    <SafeAreaView edges={["bottom"]} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        {gameEnabled && (
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.goalRow}>
              <Text style={[styles.title, { color: c.text }]}>{t.home.level(level.level)}</Text>
              <Text style={[styles.goalCount, { color: c.muted }]}>{t.home.streak(streak.current)}</Text>
            </View>
            <ProgressBar value={level.xpIntoLevel / level.xpForLevel} />
            <Text style={[styles.small, { color: c.muted }]}>{t.home.xp(level.xpIntoLevel, level.xpForLevel)}</Text>
          </View>
        )}

        {p.mode === "recovery" && (
          <View style={[styles.card, { backgroundColor: c.noticeBg, borderColor: c.noticeBg }]}>
            <Text style={[styles.noticeTitle, { color: c.noticeText }]}>{t.home.recoveryTitle}</Text>
            <Text style={[styles.body, { color: c.noticeText }]}>{t.home.recoveryText(p.reviewTarget, p.reviewCap)}</Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.title, { color: c.text }]}>{t.home.today}</Text>
          {p.newTarget > 0 && <Goal label={t.home.newWords} done={p.newDone} target={p.newTarget} c={c} />}
          <Goal label={t.home.reviews} done={p.reviewDone} target={p.reviewTarget} c={c} />
          {normComplete && <Text style={[styles.body, { color: c.text }]}>{t.home.normDone}</Text>}
        </View>

        {action ? (
          <PrimaryButton label={action} variant={normComplete ? "plain" : "filled"} onPress={() => router.push("/review")} />
        ) : (
          <Text style={[styles.body, styles.center, { color: c.muted }]}>{t.home.comeBack}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 16 },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: "700" },
  goal: { gap: 6 },
  goalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  goalLabel: { fontSize: 16 },
  goalCount: { fontSize: 15, fontVariant: ["tabular-nums"] },
  noticeTitle: { fontSize: 16, fontWeight: "700" },
  body: { fontSize: 15, lineHeight: 21 },
  small: { fontSize: 13 },
  center: { textAlign: "center" },
});
