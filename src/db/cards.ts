import { and, asc, count, eq, gte, inArray, isNull, lt, lte, or } from "drizzle-orm";

import { LEARN_AHEAD_MINUTES } from "../domain/config";
import { State, type CardState } from "../domain/fsrs";
import { addDays, dayEnd, type StudyDay } from "../domain/studyDay";
import { cards, cardState } from "./schema";
import type { Db } from "./types";

export type CardRow = typeof cards.$inferSelect;
export type CardStateRow = typeof cardState.$inferSelect;

/** Database row to the scheduler's card. */
export function toCardState(row: CardStateRow): CardState {
  return {
    due: new Date(row.due),
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsedDays,
    scheduled_days: row.scheduledDays,
    learning_steps: row.learningSteps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state,
    last_review: row.lastReview === null ? undefined : new Date(row.lastReview),
  };
}

/** The scheduler's card to a database row. */
export function fromCardState(cardId: string, card: CardState, introducedAt: number, now: Date): CardStateRow {
  return {
    cardId,
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReview: card.last_review ? card.last_review.getTime() : null,
    introducedAt,
    updatedAt: now.getTime(),
  };
}

/** When the study day began: the previous day's end. */
const dayStart = (day: StudyDay) => dayEnd(addDays(day, -1)).getTime();

/**
 * Reviews that belong to `day`: due before the day ends and not yet answered today.
 * Cards answered earlier today are same-day repeats (see `sessionRepeatIds`), not reviews.
 */
function dueReviewFilter(day: StudyDay) {
  return and(
    eq(cards.retired, false),
    lt(cardState.due, dayEnd(day).getTime()),
    or(isNull(cardState.lastReview), lt(cardState.lastReview, dayStart(day))),
  );
}

export function countDueReviews(db: Db, day: StudyDay): number {
  const row = db
    .select({ n: count() })
    .from(cardState)
    .innerJoin(cards, eq(cards.id, cardState.cardId))
    .where(dueReviewFilter(day))
    .get();
  return row?.n ?? 0;
}

/** Due review ids for `day`, most overdue first. */
export function dueReviewIds(db: Db, day: StudyDay, limit: number): string[] {
  if (limit <= 0) return [];
  return db
    .select({ id: cardState.cardId })
    .from(cardState)
    .innerJoin(cards, eq(cards.id, cardState.cardId))
    .where(dueReviewFilter(day))
    .orderBy(asc(cardState.due))
    .limit(limit)
    .all()
    .map((r) => r.id);
}

/**
 * Cards answered today that are still in (re)learning and due within the learn-ahead window.
 * They come back in the session but never count towards the norm.
 */
export function sessionRepeatIds(db: Db, day: StudyDay, now: Date): string[] {
  return db
    .select({ id: cardState.cardId })
    .from(cardState)
    .innerJoin(cards, eq(cards.id, cardState.cardId))
    .where(
      and(
        eq(cards.retired, false),
        gte(cardState.lastReview, dayStart(day)),
        inArray(cardState.state, [State.Learning, State.Relearning]),
        lte(cardState.due, now.getTime() + LEARN_AHEAD_MINUTES * 60_000),
      ),
    )
    .orderBy(asc(cardState.due))
    .all()
    .map((r) => r.id);
}

/** Words the user has not seen yet: no card_state row. */
function newFilter() {
  return and(eq(cards.retired, false), isNull(cardState.cardId));
}

export function countNewAvailable(db: Db): number {
  const row = db
    .select({ n: count() })
    .from(cards)
    .leftJoin(cardState, eq(cardState.cardId, cards.id))
    .where(newFilter())
    .get();
  return row?.n ?? 0;
}

/** The next unseen words along the path. Positions run across levels, so a useful A2 word can come early. */
export function newCardIds(db: Db, limit: number): string[] {
  if (limit <= 0) return [];
  return db
    .select({ id: cards.id })
    .from(cards)
    .leftJoin(cardState, eq(cardState.cardId, cards.id))
    .where(newFilter())
    .orderBy(asc(cards.position))
    .limit(limit)
    .all()
    .map((r) => r.id);
}

export function getCard(db: Db, cardId: string): CardRow | undefined {
  return db.select().from(cards).where(eq(cards.id, cardId)).get();
}

export function getCardState(db: Db, cardId: string): CardStateRow | undefined {
  return db.select().from(cardState).where(eq(cardState.cardId, cardId)).get();
}
