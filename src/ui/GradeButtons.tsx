import { Pressable, StyleSheet, Text, View } from "react-native";

import { Rating, type Grade } from "../domain/fsrs";
import { t } from "../i18n";
import { formatInterval } from "./formatInterval";
import { gradeColors } from "./theme";

const BUTTONS: readonly { grade: Grade; label: string; color: string }[] = [
  { grade: Rating.Again, label: t.grades.again, color: gradeColors.again },
  { grade: Rating.Hard, label: t.grades.hard, color: gradeColors.hard },
  { grade: Rating.Good, label: t.grades.good, color: gradeColors.good },
  { grade: Rating.Easy, label: t.grades.easy, color: gradeColors.easy },
];

interface Props {
  /** Time until the card comes back for each button, in ms. */
  intervals: Record<Grade, number>;
  onGrade: (grade: Grade) => void;
}

/** Four equal buttons like Anki; only the colour tells them apart. */
export function GradeButtons({ intervals, onGrade }: Props) {
  return (
    <View style={styles.row}>
      {BUTTONS.map(({ grade, label, color }) => {
        const interval = formatInterval(intervals[grade], t.interval);
        return (
          <Pressable
            key={grade}
            accessibilityRole="button"
            accessibilityLabel={`${label}, ${interval}`}
            onPress={() => onGrade(grade)}
            style={({ pressed }) => [styles.button, { backgroundColor: color }, pressed && styles.pressed]}
          >
            <Text style={styles.interval}>{interval}</Text>
            <Text style={styles.label}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  button: { flex: 1, minHeight: 64, borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 2 },
  pressed: { opacity: 0.8 },
  interval: { color: "#FFFFFF", fontSize: 13, opacity: 0.9 },
  label: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
});
