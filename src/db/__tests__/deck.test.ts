import { describe, expect, it } from "@jest/globals";
import { eq } from "drizzle-orm";

import bundledDeck from "../../../assets/decks/en-a1a2.json";
import { importDeck, parseDeck } from "../deck";
import { cards } from "../schema";
import { testCard, testDeck } from "../testing/fixtures";
import { createTestDb } from "../testing/testDb";

const card = testCard;
const deck = testDeck;

describe("parseDeck", () => {
  it("accepts the bundled deck", () => {
    const parsed = parseDeck(bundledDeck);
    expect(parsed.cards.length).toBeGreaterThanOrEqual(50);
  });

  it("lists every problem at once", () => {
    const bad = deck(1, [card(1), { ...card(1), word: " " }, { ...card(3), id: "a1-3" }]);
    expect(() => parseDeck(bad)).toThrow(/duplicate id[\s\S]*empty word[\s\S]*bad id/);
  });

  it("rejects an id whose level differs from the card's level", () => {
    expect(() => parseDeck(deck(1, [{ ...card(1), level: "A2" }]))).toThrow(/id does not match level/);
  });
});

describe("importDeck", () => {
  it("imports once per version", async () => {
    const db = await createTestDb();
    expect(importDeck(db, deck(1, [card(1), card(2)]))).toBe(true);
    expect(importDeck(db, deck(1, [card(1), card(2)]))).toBe(false);
    expect(db.select().from(cards).all()).toHaveLength(2);
  });

  it("updates content by id and retires cards that left the deck", async () => {
    const db = await createTestDb();
    importDeck(db, deck(1, [card(1), card(2)]));
    importDeck(db, deck(2, [card(1, "fixed"), card(3)]));

    const rows = db.select().from(cards).all();
    expect(rows.map((r) => [r.id, r.word, r.retired])).toEqual([
      ["en-a1-0001", "fixed", false],
      ["en-a1-0002", "word2", true],
      ["en-a1-0003", "word3", false],
    ]);
  });

  it("brings a retired card back if it returns to the deck", async () => {
    const db = await createTestDb();
    importDeck(db, deck(1, [card(1), card(2)]));
    importDeck(db, deck(2, [card(1)]));
    importDeck(db, deck(3, [card(1), card(2)]));
    expect(db.select().from(cards).where(eq(cards.id, "en-a1-0002")).get()?.retired).toBe(false);
  });
});
