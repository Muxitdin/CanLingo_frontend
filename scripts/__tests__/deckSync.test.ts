import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import path from "node:path";

import { parseCsvRecords } from "../lib/csv";
import { buildDeck, type BuiltDeck, type WordRow } from "../lib/deckBuild";

const root = path.resolve(__dirname, "../..");
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

describe("bundled deck", () => {
  it("matches scripts/content/words.csv (run `npm run deck` after editing the CSV)", () => {
    const rows = parseCsvRecords(read("scripts/content/words.csv")) as WordRow[];
    const bundled = JSON.parse(read("assets/decks/en-a1a2.json")) as BuiltDeck;
    expect(buildDeck(rows, bundled)).toEqual(bundled);
  });
});
