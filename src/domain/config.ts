/**
 * Tunable constants of the learning logic.
 * Values are starting points; adjust them from tester data, not by guessing.
 */

/** Local hour at which a new study day starts (like Anki), so a session at 00:30 still counts for "today". */
export const DAY_ROLLOVER_HOUR = 4;

/** Target probability of recalling a card when it comes due. */
export const REQUEST_RETENTION = 0.9;

/** Spread due dates slightly so cards learned together don't all come back on the same day. */
export const ENABLE_FUZZ = true;

/** A learning card due within this many minutes comes back in the same session (Anki's "learn ahead" limit). */
export const LEARN_AHEAD_MINUTES = 20;

/** New words per day on the free plan. */
export const FREE_NEW_PER_DAY = 10;

/**
 * Recovery mode starts when the reviews due today exceed this many times a normal day's reviews.
 * A normal day is the recent average, but never below RECOVERY_MIN_DAILY_REVIEWS.
 */
export const RECOVERY_BACKLOG_FACTOR = 3;

/** Floor for "a normal day's reviews", so a brand-new user doesn't drop into recovery after 10 cards. */
export const RECOVERY_MIN_DAILY_REVIEWS = 20;

/** Recovery spreads the backlog over roughly this many days. */
export const RECOVERY_SPREAD_DAYS = 3;

/** How many recent study days the "normal day" average looks at. */
export const TYPICAL_DAY_WINDOW = 7;

/** XP for a completed daily norm, in normal and in recovery mode alike. Ratings never change XP. */
export const XP_PER_NORM = 100;

/** Total XP needed to reach level 1, 2, 3, ... (index = level - 1). */
export const LEVEL_THRESHOLDS: readonly number[] = [0, 300, 700, 1200, 1800, 2500, 3300, 4200, 5200, 6300];

/** XP per level after the last threshold in the table. */
export const LEVEL_STEP_AFTER_TABLE = 1200;

/** Missed days a streak can survive per week (Monday to Sunday). */
export const STREAK_FREEZES_PER_WEEK = 1;
