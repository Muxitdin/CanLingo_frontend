import { Pressable, StyleSheet, Text, View } from "react-native";

import { Rating, type Grade } from "../domain/fsrs";
import { useStrings } from "../i18n";
import { formatInterval } from "./formatInterval";
import { gradeColors } from "./theme";

const BUTTONS = [
  { grade: Rating.Again, key: "again", color: gradeColors.again },
  { grade: Rating.Hard, key: "hard", color: gradeColors.hard },
  { grade: Rating.Good, key: "good", color: gradeColors.good },
  { grade: Rating.Easy, key: "easy", color: gradeColors.easy },
] as const satisfies readonly { grade: Grade; key: string; color: string }[];

interface Props {
  /** Time until the card comes back for each button, in ms. */
  intervals: Record<Grade, number>;
  onGrade: (grade: Grade) => void;
}

/** Four equal buttons like Anki; only the colour tells them apart. */
export function GradeButtons({ intervals, onGrade }: Props) {
  const t = useStrings();
  return (
    <View style={styles.row}>
      {BUTTONS.map(({ grade, key, color }) => {
        const label = t.grades[key];
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
