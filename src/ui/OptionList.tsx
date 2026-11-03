import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "./theme";

export interface Option<K> {
  key: K;
  label: string;
  detail?: string;
}

interface Props<K> {
  options: readonly Option<K>[];
  selected: K;
  onSelect: (key: K) => void;
}

/** A grouped list where exactly one row is chosen, like a settings radio group. */
export function OptionList<K extends string | number>({ options, selected, onSelect }: Props<K>) {
  const c = useColors();
  return (
    <View accessibilityRole="radiogroup" style={[styles.list, { backgroundColor: c.surface, borderColor: c.border }]}>
      {options.map((o, i) => {
        const active = o.key === selected;
        return (
          <Pressable
            key={String(o.key)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            onPress={() => onSelect(o.key)}
            style={({ pressed }) => [
              styles.row,
              i > 0 && { borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.text}>
              <Text style={[styles.label, { color: c.text }]}>{o.label}</Text>
              {o.detail && <Text style={[styles.detail, { color: c.muted }]}>{o.detail}</Text>}
            </View>
            <View style={[styles.radio, { borderColor: active ? c.accent : c.border }]}>
              {active && <View style={[styles.dot, { backgroundColor: c.accent }]} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, minHeight: 56 },
  pressed: { opacity: 0.7 },
  text: { flex: 1, gap: 2 },
  label: { fontSize: 17 },
  detail: { fontSize: 14 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
