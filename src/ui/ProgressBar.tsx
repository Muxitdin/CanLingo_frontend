import { StyleSheet, View } from "react-native";

import { useColors } from "./theme";

/** A thin bar; `value` is 0..1. */
export function ProgressBar({ value }: { value: number }) {
  const c = useColors();
  const width = `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` as const;
  return (
    <View style={[styles.track, { backgroundColor: c.track }]}>
      <View style={[styles.fill, { width, backgroundColor: c.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3 },
});
