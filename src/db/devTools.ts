import { eq } from "drizzle-orm";

import { defaultSettings } from "./profile";
import { cardState, dailyProgress, meta, profile, reviewLog } from "./schema";
import type { Db } from "./types";

const CLOCK_OFFSET_KEY = "dev_clock_offset_days";

/** Development only: how many days the app clock runs ahead, kept across reloads. */
export function getClockOffset(db: Db): number {
  const row = db.select().from(meta).where(eq(meta.key, CLOCK_OFFSET_KEY)).get();
  return row ? Number(row.value) : 0;
}

export function saveClockOffset(db: Db, days: number): void {
  db.insert(meta)
    .values({ key: CLOCK_OFFSET_KEY, value: String(days) })
    .onConflictDoUpdate({ target: meta.key, set: { value: String(days) } })
    .run();
}

/**
 * Development only: back to a first launch. Answers, card progress, study days, settings and the clock offset
 * are wiped; the deck and the install id stay. The append-only rule for review_log doesn't apply here.
 */
export function resetProgress(db: Db, now: Date): void {
  db.transaction((tx) => {
    tx.delete(reviewLog).run();
    tx.delete(cardState).run();
    tx.delete(dailyProgress).run();
    tx.delete(meta).where(eq(meta.key, CLOCK_OFFSET_KEY)).run();
    tx.update(profile)
      .set({ ...defaultSettings(), recoveryStartedOn: null, recoveryQuota: null, onboardedAt: null, updatedAt: now.getTime() })
      .run();
  });
}
