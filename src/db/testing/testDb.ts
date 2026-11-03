import { drizzle } from "drizzle-orm/sql-js";
import { migrate } from "drizzle-orm/sql-js/migrator";
import initSqlJs from "sql.js";

import * as schema from "../schema";
import type { Db } from "../types";

/** A fresh in-memory SQLite (sql.js) with the app's real migrations applied. For Jest only. */
export async function createTestDb(): Promise<Db> {
  const SQL = await initSqlJs();
  const client = new SQL.Database();
  client.run("PRAGMA foreign_keys = ON;");
  const db = drizzle(client, { schema });
  // Jest runs from the project root.
  migrate(db, { migrationsFolder: "./drizzle" });
  return db;
}
