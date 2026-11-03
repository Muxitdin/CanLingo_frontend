import { describe, expect, it } from "@jest/globals";

import { buildDeck, checkIdsStable, checkPlan, contentWarnings, isPlanned, rowToCard, type WordRow } from "../lib/deckBuild";

const row = (n: number, over: Partial<WordRow> = {}): WordRow => ({
  id: `en-a1-${String(n).padStart(4, "0")}`,
  level: "A1",
  unit: "1",
  topic: "test",
  position: String(n),
  word: `word${n}`,
  pos: "noun",
  ipa: "",
  ru: `ru${n}`,
  uz_latn: `uz${n}`,
  example_en: `I see word${n}.`,
  example_ru: `Я вижу ru${n}.`,
  example_uz_latn: `Men uz${n} koʻraman.`,
  ru_checked: "",
  note: "",
  ...over,
});

describe("rowToCard", () => {
  it("trims fields, parses numbers, and leaves editor columns out", () => {
    const card = rowToCard(row(1, { word: " apple ", ipa: " /ˈæpl/ ", ru_checked: "yes", note: "check" }));
    expect(card).toEqual({
      id: "en-a1-0001",
      word: "apple",
      pos: "noun",
      ipa: "/ˈæpl/",
      level: "A1",
      unit: 1,
      position: 1,
      translation: { ru: "ru1", "uz-Latn": "uz1" },
      example: { en: "I see word1.", ru: "Я вижу ru1.", "uz-Latn": "Men uz1 koʻraman." },
    });
    expect(rowToCard(row(2)).ipa).toBeUndefined();
  });

  it("rejects a non-integer position", () => {
    expect(() => rowToCard(row(1, { position: "1.5" }))).toThrow(/position/);
  });
});

describe("buildDeck", () => {
  it("sorts by level and position and starts at version 1", () => {
    const deck = buildDeck([row(2, { position: "2" }), row(1, { position: "1" })], null);
    expect(deck.version).toBe(1);
    expect(deck.cards.map((c) => c.id)).toEqual(["en-a1-0001", "en-a1-0002"]);
  });

  it("bumps the version only when content changes", () => {
    const v1 = buildDeck([row(1)], null);
    expect(buildDeck([row(1)], v1).version).toBe(1);
    expect(buildDeck([row(1, { ru: "яблоко" })], v1).version).toBe(2);
  });

  it("runs the app's deck validation", () => {
    expect(() => buildDeck([row(1, { uz_latn: "" })], null)).toThrow(/empty translation.uz-Latn/);
  });

  it("refuses to give a shipped id a different word", () => {
    const v1 = buildDeck([row(1, { word: "apple" })], null);
    expect(() => buildDeck([row(1, { word: "orange" })], v1)).toThrow(/en-a1-0001: word changed/);
    // Removing a card is allowed: the app retires it.
    expect(buildDeck([row(2)], v1).cards).toHaveLength(1);
  });
});

const planned = (n: number, over: Partial<WordRow> = {}): WordRow =>
  row(n, { ru: "", uz_latn: "", example_en: "", example_ru: "", example_uz_latn: "", ...over });

describe("planned rows", () => {
  it("stay in the table but are not shipped", () => {
    expect(isPlanned(planned(2))).toBe(true);
    expect(isPlanned(row(1))).toBe(false);
    expect(buildDeck([row(1), planned(2)], null).cards.map((c) => c.id)).toEqual(["en-a1-0001"]);
  });

  it("are validated once partly filled", () => {
    expect(() => buildDeck([planned(1, { ru: "яблоко" })], null)).toThrow(/empty translation.uz-Latn/);
  });

  it("share one id and position space with shipped rows", () => {
    expect(checkPlan([row(1), planned(1)])).toEqual(["en-a1-0001: duplicate id", "en-a1-0001: duplicate position 1"]);
    expect(checkPlan([row(1, { level: "A2" })])).toEqual(["en-a1-0001: id does not match level A2"]);
    expect(() => buildDeck([row(1), planned(1)], null)).toThrow(/duplicate id/);
  });
});

describe("path order", () => {
  it("runs across levels by position", () => {
    const a2 = row(1, { id: "en-a2-0001", level: "A2", position: "1" });
    const a1 = row(2, { position: "2" });
    expect(buildDeck([a1, a2], null).cards.map((c) => c.id)).toEqual(["en-a2-0001", "en-a1-0002"]);
  });
});

describe("checkIdsStable", () => {
  it("ignores case changes", () => {
    const v1 = buildDeck([row(1, { word: "april" })], null);
    expect(checkIdsStable(v1, [rowToCard(row(1, { word: "April" }))])).toEqual([]);
  });
});

describe("contentWarnings", () => {
  it("flags duplicates and examples that miss the word", () => {
    const cards = [row(1, { word: "run" }), row(2, { word: "run", example_en: "She runs." }), row(3, { word: "tree", example_en: "I like it." })].map(rowToCard);
    expect(contentWarnings(cards)).toEqual([
      "en-a1-0001: example doesn't seem to use \"run\"",
      "en-a1-0002: same word and part of speech as en-a1-0001",
      "en-a1-0003: example doesn't seem to use \"tree\"",
    ]);
  });
});
