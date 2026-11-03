/**
 * Builds assets/decks/en-a1a2.json from scripts/content/words.csv.
 *   npm run deck          build and write the JSON
 *   npm run deck -- --check   fail if the JSON is out of date (used by the test suite too)
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { parseCsv, parseCsvRecords } from "./lib/csv";
import { buildDeck, checkColumns, contentWarnings, isPlanned, type BuiltDeck, type WordRow } from "./lib/deckBuild";

const root = path.resolve(__dirname, "..");
const csvPath = path.join(root, "scripts/content/words.csv");
const jsonPath = path.join(root, "assets/decks/en-a1a2.json");

const csv = readFileSync(csvPath, "utf8");
checkColumns(parseCsv(csv)[0] ?? []);
const rows = parseCsvRecords(csv) as WordRow[];

let previous: BuiltDeck | null = null;
try {
  previous = JSON.parse(readFileSync(jsonPath, "utf8")) as BuiltDeck;
} catch {
  previous = null;
}

const deck = buildDeck(rows, previous);
const json = JSON.stringify(deck, null, 2) + "\n";

for (const w of contentWarnings(deck.cards)) console.warn(`warning: ${w}`);
const perLevel = deck.cards.reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.level]: (acc[c.level] ?? 0) + 1 }), {});
const checked = rows.filter((r) => r.ru_checked.trim().toLowerCase() === "yes").length;
const planned = rows.filter(isPlanned).length;
console.log(
  `${deck.cards.length} cards shipped (${Object.entries(perLevel).map(([l, n]) => `${l}: ${n}`).join(", ")}), ` +
    `${planned} planned, Russian checked: ${checked}`,
);

if (process.argv.includes("--check")) {
  const current = previous ? JSON.stringify(previous, null, 2) + "\n" : "";
  if (current !== json) {
    console.error("assets/decks/en-a1a2.json is out of date: run `npm run deck`");
    process.exit(1);
  }
  console.log("Deck JSON is up to date.");
} else {
  writeFileSync(jsonPath, json);
  console.log(`Wrote ${path.relative(root, jsonPath)} (version ${deck.version})`);
}
