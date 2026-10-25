import { createEmptyCard, fsrs, Rating, type Card, type Grade, type ReviewLog } from "ts-fsrs";

import { ENABLE_FUZZ, REQUEST_RETENTION } from "./config";

/**
 * The only place that talks to ts-fsrs directly.
 * The rest of the app works with these functions, so the scheduler can be tuned or swapped in one spot.
 */

export { Rating, State } from "ts-fsrs";
export type { Card as CardState, Grade, ReviewLog } from "ts-fsrs";

/** The four rating buttons, left to right, as in Anki. */
export const GRADES = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as const satisfies readonly Grade[];

const scheduler = fsrs({
  request_retention: REQUEST_RETENTION,
  enable_fuzz: ENABLE_FUZZ,
});

/** Scheduling state for a word the user is seeing for the first time. */
export function newCardState(now: Date): Card {
  return createEmptyCard(now);
}

/** Applies a rating and returns the card's next state plus the log entry to store. */
export function grade(card: Card, rating: Grade, now: Date): { card: Card; log: ReviewLog } {
  return scheduler.next(card, now, rating);
}

/** Next due date for every button, e.g. to show "10m / 1d / 3d" above them. */
export function previewDue(card: Card, now: Date): Record<Grade, Date> {
  const preview = scheduler.repeat(card, now);
  return {
    [Rating.Again]: preview[Rating.Again].card.due,
    [Rating.Hard]: preview[Rating.Hard].card.due,
    [Rating.Good]: preview[Rating.Good].card.due,
    [Rating.Easy]: preview[Rating.Easy].card.due,
  };
}
