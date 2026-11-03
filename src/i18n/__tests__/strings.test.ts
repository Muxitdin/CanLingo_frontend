import { describe, expect, it } from "@jest/globals";

import bundledDeck from "../../../assets/decks/en-a1a2.json";
import { ru } from "../ru";
import { uzLatn } from "../uz-Latn";

/** Every string leaf of a strings object, with functions called on sample arguments. */
function leaves(obj: unknown): string[] {
  if (typeof obj === "string") return [obj];
  if (typeof obj === "function") return [String(obj(3, 7))];
  if (obj && typeof obj === "object") {
    // `date` takes a day string, not numbers; it has its own test below.
    return Object.entries(obj).flatMap(([key, value]) => (key === "date" ? [] : leaves(value)));
  }
  return [];
}

// Uzbek Latin uses ʻ (U+02BB) in oʻ/gʻ and ʼ (U+02BC) for the glottal stop; look-alike quotes break search and TTS.
const LOOKALIKE = /['‘’`]/;

describe("uz-Latn text", () => {
  it("uses the official apostrophe letters in interface strings", () => {
    expect(leaves(uzLatn).filter((s) => LOOKALIKE.test(s))).toEqual([]);
  });

  it("uses them in the bundled deck too", () => {
    const uzTexts = bundledDeck.cards.flatMap((c) => [c.translation["uz-Latn"], c.example["uz-Latn"]]);
    expect(uzTexts.filter((s) => LOOKALIKE.test(s))).toEqual([]);
  });
});

describe("date", () => {
  it("formats a study day in each language, adding the year only when it differs", () => {
    expect(ru.date("2027-03-12", 2027)).toBe("12 марта");
    expect(ru.date("2027-03-12", 2026)).toBe("12 марта 2027");
    expect(uzLatn.date("2027-03-12", 2027)).toBe("12-mart");
    expect(uzLatn.date("2027-03-12", 2026)).toBe("2027-yil 12-mart");
  });
});
