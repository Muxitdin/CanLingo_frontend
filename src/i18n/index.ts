import type { ProfileRow } from "../db/profile";
import { useAppSelector } from "../store";
import { ru, type Strings } from "./ru";
import { uzLatn } from "./uz-Latn";

export type UiLang = ProfileRow["uiLang"];
export type { Strings };

/** Interface strings per BCP 47 tag. uz-Cyrl joins here later. */
export const strings: Record<UiLang, Strings> = { ru, "uz-Latn": uzLatn };

/** Each language's name in itself, for the language picker. */
export const LANGUAGE_NAMES: Record<UiLang, string> = { ru: "Русский", "uz-Latn": "Oʻzbekcha" };

/** Strings in the user's interface language; re-renders when it changes in settings. */
export function useStrings(): Strings {
  const lang = useAppSelector((s) => s.profile?.uiLang ?? "ru");
  return strings[lang];
}
