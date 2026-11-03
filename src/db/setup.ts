import { importDeck, parseDeck } from "./deck";
import { ensureProfile } from "./profile";
import type { Db } from "./types";

/** Startup work after migrations: load the bundled deck if it changed, create the profile on first launch. */
export function prepareDatabase(db: Db, rawDeck: unknown, now: Date): void {
  importDeck(db, parseDeck(rawDeck));
  ensureProfile(db, now);
}
