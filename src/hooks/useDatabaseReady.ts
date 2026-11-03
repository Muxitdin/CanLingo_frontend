import { useEffect, useState } from "react";

import deck from "../../assets/decks/en-a1a2.json";
import { db, runMigrations } from "../db/client";
import { getClockOffset } from "../db/devTools";
import { getProfile } from "../db/profile";
import { prepareDatabase } from "../db/setup";
import { now, setClockOffsetDays } from "../services/clock";
import { useAppDispatch } from "../store";
import { profileLoaded } from "../store/profileSlice";

export type DatabaseStatus = { state: "loading" } | { state: "ready" } | { state: "error"; error: unknown };

/**
 * Migrates the database, imports the bundled deck when it changed, creates the profile on first launch,
 * and loads the profile into the store.
 */
export function useDatabaseReady(): DatabaseStatus {
  const [status, setStatus] = useState<DatabaseStatus>({ state: "loading" });
  const dispatch = useAppDispatch();

  useEffect(() => {
    let active = true;
    runMigrations()
      .then(() => {
        // A clock moved ahead in Settings → For development survives reloads; release builds ignore it.
        if (__DEV__) setClockOffsetDays(getClockOffset(db));
        prepareDatabase(db, deck, now());
      })
      .then(
        () => {
          if (!active) return;
          dispatch(profileLoaded(getProfile(db)));
          setStatus({ state: "ready" });
        },
        (error: unknown) => {
          console.error("Database setup failed", error);
          if (active) setStatus({ state: "error", error });
        },
      );
    return () => {
      active = false;
    };
  }, [dispatch]);

  return status;
}
