import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { openDatabaseSync } from "expo-sqlite";

import migrations from "../../drizzle/migrations";
import * as schema from "./schema";

/** The app's only database connection. Tests build their own on sql.js instead of importing this. */
const expoDb = openDatabaseSync("canlingo.db");
expoDb.execSync("PRAGMA foreign_keys = ON;");

export const db = drizzle(expoDb, { schema });

/** Brings the schema up to date. Safe to call on every launch. */
export function runMigrations(): Promise<void> {
  return migrate(db, migrations);
}
