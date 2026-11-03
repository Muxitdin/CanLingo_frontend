import * as Speech from "expo-speech";

/** Reads an English word aloud with the device voice. expo-speech ships in Expo Go, so no fallback is needed. */
export function speakEnglish(text: string): void {
  void Speech.stop();
  Speech.speak(text, { language: "en-US", rate: 0.9 });
}
