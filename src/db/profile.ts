import { eq } from "drizzle-orm";

import { FREE_NEW_PER_DAY } from "../domain/config";
import type { RecoveryState } from "../domain/dailyPlan";
import { newId } from "./ids";
import { profile } from "./schema";
import type { Db } from "./types";

export type ProfileRow = typeof profile.$inferSelect;

const PROFILE_ID = 1;

/** Creates the single profile row on first launch and returns it. */
export function ensureProfile(db: Db, now: Date): ProfileRow {
  const existing = db.select().from(profile).where(eq(profile.id, PROFILE_ID)).get();
  if (existing) return existing;
  const row: ProfileRow = {
    id: PROFILE_ID,
    installId: newId(),
    uiLang: "ru",
    newPerDay: FREE_NEW_PER_DAY,
    gameEnabled: true,
    recoveryStartedOn: null,
    recoveryQuota: null,
    onboardedAt: null,
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
  };
  db.insert(profile).values(row).run();
  return row;
}

export function getProfile(db: Db): ProfileRow {
  const row = db.select().from(profile).where(eq(profile.id, PROFILE_ID)).get();
  if (!row) throw new Error("Profile missing: call ensureProfile on startup");
  return row;
}

/** What the user can change in onboarding and settings. */
export type ProfileSettings = Partial<Pick<ProfileRow, "uiLang" | "newPerDay" | "gameEnabled" | "onboardedAt">>;

/** Saves settings and returns the updated profile. */
export function updateProfile(db: Db, settings: ProfileSettings, now: Date): ProfileRow {
  db.update(profile)
    .set({ ...settings, updatedAt: now.getTime() })
    .where(eq(profile.id, PROFILE_ID))
    .run();
  return getProfile(db);
}

export function recoveryOf(p: ProfileRow): RecoveryState | null {
  return p.recoveryStartedOn !== null && p.recoveryQuota !== null
    ? { startedOn: p.recoveryStartedOn, dailyReviewQuota: p.recoveryQuota }
    : null;
}

export function saveRecovery(db: Db, recovery: RecoveryState | null, now: Date): void {
  db.update(profile)
    .set({
      recoveryStartedOn: recovery?.startedOn ?? null,
      recoveryQuota: recovery?.dailyReviewQuota ?? null,
      updatedAt: now.getTime(),
    })
    .where(eq(profile.id, PROFILE_ID))
    .run();
}
