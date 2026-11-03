import type { DeckCard, DeckFile } from "../deck";

/** A valid A1 card numbered `n`, for tests. */
export function testCard(n: number, word = `word${n}`): DeckCard {
  return {
    id: `en-a1-${String(n).padStart(4, "0")}`,
    word,
    pos: "noun",
    level: "A1",
    unit: 1,
    position: n,
    translation: { ru: `ru${n}`, "uz-Latn": `uz${n}` },
    example: { en: `en${n}`, ru: `ru ex${n}`, "uz-Latn": `uz ex${n}` },
  };
}

/** A deck of the given cards, or of cards 1..n. */
export function testDeck(version: number, cards: DeckCard[] | number): DeckFile {
  const list = typeof cards === "number" ? Array.from({ length: cards }, (_, i) => testCard(i + 1)) : cards;
  return { id: "test", version, cards: list };
}
