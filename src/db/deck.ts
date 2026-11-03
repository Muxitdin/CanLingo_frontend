import { eq, inArray } from "drizzle-orm";

import { cards, meta } from "./schema";
import type { Db } from "./types";

/** A deck file as bundled in assets/decks. Language keys are BCP 47 tags, so uz-Cyrl can be added later. */
export interface DeckFile {
  id: string;
  version: number;
  cards: DeckCard[];
}

export interface DeckCard {
  id: string;
  word: string;
  pos: string;
  ipa?: string;
  level: "A1" | "A2";
  unit: number;
  position: number;
  translation: { ru: string; "uz-Latn": string };
  example: { en: string; ru: string; "uz-Latn": string };
}

const LEVELS = new Set(["A1", "A2"]);
const CARD_ID = /^en-(a1|a2)-\d{4}$/;
const DECK_VERSION_KEY = "deck_version";

const filled = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

/**
 * Checks a deck before it touches the database and returns it typed.
 * Throws with every problem listed, so a broken content edit fails the test run instead of the app.
 */
export function parseDeck(raw: unknown): DeckFile {
  const deck = raw as DeckFile;
  const problems: string[] = [];
  if (!filled(deck?.id) || !Number.isInteger(deck?.version) || !Array.isArray(deck?.cards)) {
    throw new Error("Deck must have id, integer version and a cards array");
  }
  const ids = new Set<string>();
  const positions = new Set<string>();
  for (const c of deck.cards) {
    const id = String(c?.id ?? "");
    const where = `card ${id || "?"}`;
    if (!CARD_ID.test(id)) problems.push(`${where}: bad id`);
    if (ids.has(id)) problems.push(`${where}: duplicate id`);
    ids.add(id);
    if (!LEVELS.has(c.level)) problems.push(`${where}: bad level`);
    else if (!id.startsWith(`en-${c.level.toLowerCase()}-`)) problems.push(`${where}: id does not match level`);
    if (positions.has(String(c.position))) problems.push(`${where}: duplicate position`);
    positions.add(String(c.position));
    if (!Number.isInteger(c.unit) || !Number.isInteger(c.position)) problems.push(`${where}: unit and position must be integers`);
    for (const [field, value] of [
      ["word", c.word],
      ["pos", c.pos],
      ["translation.ru", c.translation?.ru],
      ["translation.uz-Latn", c.translation?.["uz-Latn"]],
      ["example.en", c.example?.en],
      ["example.ru", c.example?.ru],
      ["example.uz-Latn", c.example?.["uz-Latn"]],
    ] as const) {
      if (!filled(value)) problems.push(`${where}: empty ${field}`);
    }
  }
  if (problems.length > 0) throw new Error(`Invalid deck ${deck.id}:\n${problems.join("\n")}`);
  return deck;
}

/**
 * Loads a deck into `cards`. Runs once per deck version: cards are upserted by their stable id,
 * and cards that left the deck are marked retired, never deleted, so progress rows stay valid.
 * Returns false when this version is already imported.
 */
export function importDeck(db: Db, deck: DeckFile): boolean {
  const version = `${deck.id}@${deck.version}`;
  const current = db.select().from(meta).where(eq(meta.key, DECK_VERSION_KEY)).get();
  if (current?.value === version) return false;

  db.transaction((tx) => {
    for (const c of deck.cards) {
      const row = {
        word: c.word,
        pos: c.pos,
        ipa: c.ipa ?? null,
        translationRu: c.translation.ru,
        translationUzLatn: c.translation["uz-Latn"],
        exampleEn: c.example.en,
        exampleRu: c.example.ru,
        exampleUzLatn: c.example["uz-Latn"],
        level: c.level,
        unit: c.unit,
        position: c.position,
        retired: false,
      };
      tx.insert(cards)
        .values({ id: c.id, ...row })
        .onConflictDoUpdate({ target: cards.id, set: row })
        .run();
    }

    const inDeck = new Set(deck.cards.map((c) => c.id));
    const gone = tx
      .select({ id: cards.id })
      .from(cards)
      .all()
      .map((r) => r.id)
      .filter((id) => !inDeck.has(id));
    // Chunked to stay under SQLite's limit on bound parameters.
    for (let i = 0; i < gone.length; i += 500) {
      tx.update(cards)
        .set({ retired: true })
        .where(inArray(cards.id, gone.slice(i, i + 500)))
        .run();
    }

    tx.insert(meta)
      .values({ key: DECK_VERSION_KEY, value: version })
      .onConflictDoUpdate({ target: meta.key, set: { value: version } })
      .run();
  });
  return true;
}
