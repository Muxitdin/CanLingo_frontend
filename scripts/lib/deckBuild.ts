import { parseDeck, type DeckCard, type DeckFile } from "../../src/db/deck";

/** The bundled deck's id and credit line. Licences and attribution are in scripts/content/SOURCES.md. */
export const DECK_META = { id: "en-a1a2", source: "Sources and licences: scripts/content/SOURCES.md" } as const;

/** Columns of scripts/content/words.csv, in order. */
export const COLUMNS = [
  "id",
  "level",
  "unit",
  "position",
  "word",
  "pos",
  "ipa",
  "ru",
  "uz_latn",
  "example_en",
  "example_ru",
  "example_uz_latn",
  "ru_checked",
  "note",
] as const;

export type WordRow = Record<(typeof COLUMNS)[number], string>;

function int(value: string, field: string, id: string): number {
  const n = Number(value);
  if (!Number.isInteger(n)) throw new Error(`${id}: ${field} must be an integer, got "${value}"`);
  return n;
}

/** One master-table row as a deck card. `ru_checked` and `note` are for editors and stay out of the app. */
export function rowToCard(r: WordRow): DeckCard {
  const ipa = r.ipa.trim();
  return {
    id: r.id.trim(),
    word: r.word.trim(),
    pos: r.pos.trim(),
    ...(ipa ? { ipa } : {}),
    level: r.level.trim() as DeckCard["level"],
    unit: int(r.unit, "unit", r.id),
    position: int(r.position, "position", r.id),
    translation: { ru: r.ru.trim(), "uz-Latn": r.uz_latn.trim() },
    example: { en: r.example_en.trim(), ru: r.example_ru.trim(), "uz-Latn": r.example_uz_latn.trim() },
  };
}

export function checkColumns(header: readonly string[]): void {
  const missing = COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) throw new Error(`words.csv is missing columns: ${missing.join(", ")}`);
}

/**
 * Ids are forever: a card id already shipped must keep its word, or users' progress would attach
 * to a different word. Removing a card is fine (the app retires it).
 */
export function checkIdsStable(previous: DeckFile | null, next: readonly DeckCard[]): string[] {
  if (!previous) return [];
  const before = new Map(previous.cards.map((c) => [c.id, c.word]));
  return next
    .filter((c) => before.has(c.id) && before.get(c.id)!.toLowerCase() !== c.word.toLowerCase())
    .map((c) => `${c.id}: word changed from "${before.get(c.id)}" to "${c.word}"; give the new word a new id`);
}

/** Soft content checks worth a look but not worth failing the build. */
export function contentWarnings(cards: readonly DeckCard[]): string[] {
  const warnings: string[] = [];
  const seen = new Map<string, string>();
  for (const c of cards) {
    const key = `${c.word.toLowerCase()}|${c.pos}`;
    const other = seen.get(key);
    if (other) warnings.push(`${c.id}: same word and part of speech as ${other}`);
    seen.set(key, c.id);
    const stem = c.word.toLowerCase().slice(0, Math.max(3, c.word.length - 2));
    if (!c.example.en.toLowerCase().includes(stem)) warnings.push(`${c.id}: example doesn't seem to use "${c.word}"`);
  }
  return warnings;
}

/** FNV-1a over the cards, to notice content changes without node:crypto. */
export function contentHash(cards: readonly DeckCard[]): string {
  const text = JSON.stringify(cards);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export interface BuiltDeck extends DeckFile {
  contentHash: string;
  source: string;
}

/**
 * Builds the bundled deck from master-table rows. The version goes up by one whenever the content
 * changes, which is what makes the app re-import it.
 */
export function buildDeck(
  rows: readonly WordRow[],
  previous: BuiltDeck | null,
  meta: { id: string; source: string } = DECK_META,
): BuiltDeck {
  const cards = rows.map(rowToCard).sort((a, b) => (a.level === b.level ? a.position - b.position : a.level < b.level ? -1 : 1));
  const unstable = checkIdsStable(previous, cards);
  if (unstable.length > 0) throw new Error(`Card ids changed meaning:\n${unstable.join("\n")}`);
  const hash = contentHash(cards);
  const version = !previous ? 1 : previous.contentHash === hash ? previous.version : previous.version + 1;
  const deck: BuiltDeck = { id: meta.id, version, contentHash: hash, source: meta.source, cards };
  parseDeck(deck);
  return deck;
}
