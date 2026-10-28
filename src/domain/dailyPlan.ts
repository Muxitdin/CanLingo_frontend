import {
  RECOVERY_BACKLOG_FACTOR,
  RECOVERY_MIN_DAILY_REVIEWS,
  RECOVERY_SPREAD_DAYS,
  TYPICAL_DAY_WINDOW,
} from "./config";
import { daysBetween, type StudyDay } from "./studyDay";

export type DayMode = "normal" | "recovery";

/** Carried from day to day while the user works off a backlog. */
export interface RecoveryState {
  startedOn: StudyDay;
  /** Reviews per day until the backlog is cleared. Fixed when recovery starts. */
  dailyReviewQuota: number;
}

export interface DayPlanInput {
  today: StudyDay;
  /** Review cards due before today ends (see `dayEnd`). */
  dueCount: number;
  /** Words not introduced yet. */
  newAvailable: number;
  /** The user's pace (free plan: FREE_NEW_PER_DAY). */
  newPerDay: number;
  /** A normal day's reviews for this user (see `typicalDailyReviews`). */
  typicalDailyReviews: number;
  /** Recovery state from the previous study day, or null. */
  recovery: RecoveryState | null;
}

export interface DayPlan {
  mode: DayMode;
  newTarget: number;
  /** Reviews that complete the day's norm. */
  reviewTarget: number;
  /** Reviews the session offers. Equal to the target on a normal day; above it in recovery. */
  reviewCap: number;
  /** Store this and pass it back tomorrow. Null when not in recovery. */
  recovery: RecoveryState | null;
}

/** What the user actually did on a study day; one row of `daily_progress`. */
export interface DayProgress {
  day: StudyDay;
  mode: DayMode;
  newTarget: number;
  newDone: number;
  reviewTarget: number;
  reviewDone: number;
}

/**
 * Builds the day's norm. Call it once, on the first open of the study day, and store the result:
 * the targets must not move while the user is studying.
 *
 * Normal day: every due review plus `newPerDay` new words.
 * Recovery: new words pause, and the backlog is spread over about RECOVERY_SPREAD_DAYS days,
 * so a week away never greets the user with hundreds of cards at once. The day counts as done
 * after a normal day's worth of reviews; doing the rest of the quota only ends recovery sooner.
 */
export function planDay(input: DayPlanInput): DayPlan {
  const normalDay = Math.max(input.typicalDailyReviews, RECOVERY_MIN_DAILY_REVIEWS);

  let recovery = input.recovery;
  if (!recovery && input.dueCount > RECOVERY_BACKLOG_FACTOR * normalDay) {
    recovery = {
      startedOn: input.today,
      dailyReviewQuota: Math.max(normalDay, Math.ceil(input.dueCount / RECOVERY_SPREAD_DAYS)),
    };
  }

  // Recovery ends on the first day whose whole backlog fits in the quota.
  if (recovery && input.dueCount <= recovery.dailyReviewQuota) {
    recovery = null;
  }

  if (recovery) {
    return {
      mode: "recovery",
      newTarget: 0,
      reviewTarget: Math.min(normalDay, recovery.dailyReviewQuota),
      reviewCap: recovery.dailyReviewQuota,
      recovery,
    };
  }
  return {
    mode: "normal",
    newTarget: Math.min(input.newPerDay, input.newAvailable),
    reviewTarget: input.dueCount,
    reviewCap: input.dueCount,
    recovery: null,
  };
}

/** The day's norm is done once both targets are reached. Studying beyond it is allowed. */
export function isNormComplete(p: Pick<DayProgress, "newDone" | "newTarget" | "reviewDone" | "reviewTarget">): boolean {
  return p.newDone >= p.newTarget && p.reviewDone >= p.reviewTarget;
}

/**
 * Average reviews over the last TYPICAL_DAY_WINDOW completed normal days before `today`.
 * Counted in days studied, not calendar days, so a long break doesn't erase what "normal" means.
 * Recovery days are left out so a backlog doesn't inflate it.
 */
export function typicalDailyReviews(history: readonly DayProgress[], today: StudyDay): number {
  const recent = history
    .filter((p) => daysBetween(p.day, today) >= 1 && p.mode === "normal" && isNormComplete(p))
    .sort((a, b) => (a.day < b.day ? 1 : -1))
    .slice(0, TYPICAL_DAY_WINDOW);
  if (recent.length === 0) return 0;
  return Math.round(recent.reduce((sum, p) => sum + p.reviewDone, 0) / recent.length);
}
