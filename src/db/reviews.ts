import { asc, eq } from "drizzle-orm";

import type { CardState, ReviewLog } from "../domain/fsrs";
import type { StudyDay } from "../domain/studyDay";
import { fromCardState, getCardState } from "./cards";
import { countAnswer } from "./days";
import { newId } from "./ids";
import { cardState, reviewLog } from "./schema";
import type { Db } from "./types";

export type ReviewLogRow = typeof reviewLog.$inferSelect;

export interface SaveRatingInput {
  cardId: string;
  /** The card after the rating, from `grade`. */
  next: CardState;
  log: ReviewLog;
  /** Which daily counter this answer moves; null for a same-day repeat. */
  countAs: "new" | "review" | null;
  day: StudyDay;
  now: Date;
}

/** Writes one rating: card_state, review_log and the day's counter, all or nothing. */
export function saveRating(db: Db, input: SaveRatingInput): void {
  const { cardId, next, log, countAs, day, now } = input;
  db.transaction((tx) => {
    const introducedAt = getCardState(tx, cardId)?.introducedAt ?? now.getTime();
    const row = fromCardState(cardId, next, introducedAt, now);
    tx.insert(cardState).values(row).onConflictDoUpdate({ target: cardState.cardId, set: row }).run();

    tx.insert(reviewLog)
      .values({
        id: newId(),
        cardId,
        rating: log.rating,
        state: log.state,
        due: log.due.getTime(),
        stability: log.stability,
        difficulty: log.difficulty,
        elapsedDays: log.elapsed_days,
        lastElapsedDays: log.last_elapsed_days,
        scheduledDays: log.scheduled_days,
        learningSteps: log.learning_steps,
        reviewedAt: log.review.getTime(),
        studyDay: day,
      })
      .run();

    if (countAs) countAnswer(tx, day, countAs, now);
  });
}

export function reviewsOfCard(db: Db, cardId: string): ReviewLogRow[] {
  return db.select().from(reviewLog).where(eq(reviewLog.cardId, cardId)).orderBy(asc(reviewLog.reviewedAt)).all();
}
