import { useEffect, useState } from "react";

import deck from "../../assets/decks/en-a1a2.json";
import { db, runMigrations } from "../db/client";
import { prepareDatabase } from "../db/setup";

export type DatabaseStatus = { state: "loading" } | { state: "ready" } | { state: "error"; error: unknown };

/** Migrates the database, imports the bundled deck when it changed, and creates the profile on first launch. */
export function useDatabaseReady(): DatabaseStatus {
  const [status, setStatus] = useState<DatabaseStatus>({ state: "loading" });

  useEffect(() => {
    let active = true;
    runMigrations()
      .then(() => prepareDatabase(db, deck, new Date()))
      .then(
        () => {
          if (active) setStatus({ state: "ready" });
        },
        (error: unknown) => {
          console.error("Database setup failed", error);
          if (active) setStatus({ state: "error", error });
        },
      );
    return () => {
      active = false;
    };
  }, []);

  return status;
}
