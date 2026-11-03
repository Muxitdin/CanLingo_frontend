import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useReviewSession } from "../hooks/useReviewSession";
import { useStrings } from "../i18n";
import { speakEnglish } from "../services/tts";
import { GradeButtons } from "../ui/GradeButtons";
import { PrimaryButton } from "../ui/PrimaryButton";
import { useColors } from "../ui/theme";

export default function Review() {
  const router = useRouter();
  const c = useColors();
  const t = useStrings();
  const { card, revealed, left, normComplete, reveal, answer } = useReviewSession();

  if (!card) {
    return (
      <SafeAreaView edges={["bottom"]} style={[styles.flex, styles.finished]}>
        <Text style={[styles.word, { color: c.text }]}>{t.review.finished}</Text>
        <Text style={[styles.body, { color: c.muted }]}>{t.review.finishedText}</Text>
        <PrimaryButton label={t.review.back} onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={[styles.flex, styles.screen]}>
      <View style={styles.topRow}>
        <Text style={[styles.small, { color: c.muted }]}>{t.review.left(left)}</Text>
        {normComplete && (
          <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12}>
            <Text style={[styles.small, { color: c.accent }]}>{t.review.finish}</Text>
          </Pressable>
        )}
      </View>
      {normComplete && (
        <Text style={[styles.notice, { backgroundColor: c.noticeBg, color: c.noticeText }]}>{t.review.normDone}</Text>
      )}

      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.word, { color: c.text }]} selectable>
          {card.word}
        </Text>
        {card.ipa && <Text style={[styles.body, { color: c.muted }]}>{card.ipa}</Text>}
        <Pressable accessibilityRole="button" onPress={() => speakEnglish(card.word)} hitSlop={12}>
          <Text style={[styles.body, { color: c.accent }]}>🔊 {t.review.listen}</Text>
        </Pressable>

        {revealed && (
          <View style={[styles.answer, { borderTopColor: c.border }]}>
            <Text style={[styles.translation, { color: c.text }]}>{card.translation}</Text>
            <Pressable onPress={() => speakEnglish(card.exampleEn)}>
              <Text style={[styles.example, { color: c.text }]}>{card.exampleEn}</Text>
            </Pressable>
            <Text style={[styles.body, styles.centerText, { color: c.muted }]}>{card.exampleTranslation}</Text>
          </View>
        )}
      </View>

      {revealed ? (
        <GradeButtons intervals={card.intervals} onGrade={answer} />
      ) : (
        <PrimaryButton label={t.review.show} onPress={reveal} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { padding: 16, gap: 12 },
  finished: { alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  topRow: { flexDirection: "row", justifyContent: "space-between" },
  small: { fontSize: 14 },
  notice: { borderRadius: 10, padding: 10, fontSize: 14, overflow: "hidden" },
  card: {
    flex: 1,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  word: { fontSize: 36, fontWeight: "700", textAlign: "center" },
  body: { fontSize: 16, lineHeight: 22 },
  answer: { alignSelf: "stretch", alignItems: "center", gap: 10, marginTop: 12, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
  translation: { fontSize: 24, fontWeight: "600", textAlign: "center" },
  example: { fontSize: 17, lineHeight: 24, textAlign: "center" },
  centerText: { textAlign: "center" },
});
