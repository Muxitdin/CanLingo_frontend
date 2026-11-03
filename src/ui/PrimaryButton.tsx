import { Pressable, StyleSheet, Text } from "react-native";

import { useColors } from "./theme";

interface Props {
  label: string;
  onPress: () => void;
  variant?: "filled" | "plain";
}

export function PrimaryButton({ label, onPress, variant = "filled" }: Props) {
  const c = useColors();
  const filled = variant === "filled";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        filled ? { backgroundColor: c.accent } : { borderColor: c.border, borderWidth: StyleSheet.hairlineWidth },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, { color: filled ? c.onAccent : c.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  pressed: { opacity: 0.8 },
  label: { fontSize: 17, fontWeight: "600" },
});
