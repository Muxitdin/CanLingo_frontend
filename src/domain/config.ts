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
