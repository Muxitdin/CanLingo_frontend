import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";

import type * as schema from "./schema";

/**
 * Any synchronous SQLite database with our schema.
 * The app passes expo-sqlite (src/db/client.ts); tests pass sql.js, so repositories run on real SQLite in Jest.
 */
export type Db = BaseSQLiteDatabase<"sync", unknown, typeof schema>;
