import { useColorScheme } from "react-native";

const light = {
  background: "#F6F6F3",
  surface: "#FFFFFF",
  text: "#1B1B1A",
  muted: "#6A6A66",
  border: "#E3E3DE",
  accent: "#1F6FD1",
  onAccent: "#FFFFFF",
  track: "#E8E8E3",
  noticeBg: "#FFF3DC",
  noticeText: "#7A4A00",
};

const dark: typeof light = {
  background: "#121212",
  surface: "#1D1D1C",
  text: "#F1F1EE",
  muted: "#A3A39E",
  border: "#2F2F2D",
  accent: "#4C95EA",
  onAccent: "#0B1626",
  track: "#2F2F2D",
  noticeBg: "#3A2A0E",
  noticeText: "#FFD99A",
};

export type Colors = typeof light;

/** Screen colours for the system theme (app.json sets userInterfaceStyle to automatic). */
export function useColors(): Colors {
  return useColorScheme() === "dark" ? dark : light;
}

/**
 * Rating buttons: same size and layout, only the colour differs (Again, Hard, Good, Easy).
 * Dark enough for white text in both themes.
 */
export const gradeColors = {
  again: "#C8323A",
  hard: "#B45F00",
  good: "#1E7F47",
  easy: "#1F64C4",
} as const;
