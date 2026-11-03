/**
 * Study flow without React: reads from src/db, decides with src/domain, writes back.
 * The hooks in this folder are thin wrappers, so this logic runs in Jest on real SQLite.
 */
import {
  countDueReviews,
  countNewAvailable,
  dueReviewIds,
  getCard,
  getCardState,
  newCardIds,
  sessionRepeatIds,
  toCardState,
} from "../db/cards";
import { getDay, insertDay, listDays, type DayRow } from "../db/days";
import { getProfile, recoveryOf, saveRecovery, type ProfileRow } from "../db/profile";
import { saveRating } from "../db/reviews";
import type { Db } from "../db/types";
import { isNormComplete, planDay, typicalDailyReviews } from "../domain/dailyPlan";
import { grade, newCardState, previewDue, State, type Grade } from "../domain/fsrs";
import { computeStreak, forecastGoalDate, levelForXp, xpForDay, type LevelInfo, type StreakInfo } from "../domain/game";
import { buildQueue, repeatsInSession, type QueueItem } from "../domain/queue";
import { studyDay, type StudyDay } from "../domain/studyDay";

/**
 * Returns today's plan, building and storing it on the day's first open.
 * The plan is fixed from then on, so the norm doesn't move while the user studies.
 */
export function ensureDayPlan(db: Db, now: Date): DayRow {
  const day = studyDay(now);
  const existing = getDay(db, day);
  if (existing) return existing;

  return db.transaction((tx) => {
    const profile = getProfile(tx);
    const plan = planDay({
      today: day,
      dueCount: countDueReviews(tx, day),
      newAvailable: countNewAvailable(tx),
      newPerDay: profile.newPerDay,
      typicalDailyReviews: typicalDailyReviews(listDays(tx), day),
      recovery: recoveryOf(profile),
    });
    saveRecovery(tx, plan.recovery, now);
    return insertDay(tx, day, plan, now);
  });
}

/** A queue item plus same-day repeats: cards still in learning that come back and never count. */
export type SessionItem = { cardId: string; kind: QueueItem["kind"] | "repeat" };

/** What a session offers right now: learning repeats that are due first, then reviews with new words spread in. */
export function buildSession(db: Db, now: Date): SessionItem[] {
  const progress = ensureDayPlan(db, now);
  const reviewLimit = progress.reviewCap - progress.reviewDone;
  const newLimit = progress.newTarget - progress.newDone;
  const repeats = sessionRepeatIds(db, progress.day, now).map((cardId): SessionItem => ({ cardId, kind: "repeat" }));
  const queue = buildQueue({
    dueIds: dueReviewIds(db, progress.day, reviewLimit),
    newIds: newCardIds(db, newLimit),
    reviewLimit,
    newLimit,
  });
  return [...repeats, ...queue];
}

/**
 * Applies a rating: schedules the card, then stores card_state, review_log and the day's counter in one transaction.
 * `repeat` is true when the card is still in learning and comes back within this session.
 */
export function answerCard(db: Db, item: SessionItem, rating: Grade, now: Date): { repeat: boolean } {
  const row = getCardState(db, item.cardId);
  const { card, log } = grade(row ? toCardState(row) : newCardState(now), rating, now);
  saveRating(db, {
    cardId: item.cardId,
    next: card,
    log,
    countAs: item.kind === "repeat" ? null : item.kind,
    day: studyDay(now),
    now,
  });
  const learning = card.state === State.Learning || card.state === State.Relearning;
  return { repeat: learning && repeatsInSession(card.due, now) };
}

export interface CardView {
  id: string;
  word: string;
  pos: string;
  ipa: string | null;
  translation: string;
  exampleEn: string;
  exampleTranslation: string;
  /** Time until the card is due again for each button, in ms. */
  intervals: Record<Grade, number>;
}

/** A card ready for the review screen, in the user's interface language. */
export function cardView(db: Db, cardId: string, lang: ProfileRow["uiLang"], now: Date): CardView {
  const card = getCard(db, cardId);
  if (!card) throw new Error(`Unknown card ${cardId}`);
  const row = getCardState(db, cardId);
  const due = previewDue(row ? toCardState(row) : newCardState(now), now);
  const intervals = Object.fromEntries(
    Object.entries(due).map(([g, d]) => [g, d.getTime() - now.getTime()]),
  ) as Record<Grade, number>;
  const uz = lang === "uz-Latn";
  return {
    id: card.id,
    word: card.word,
    pos: card.pos,
    ipa: card.ipa,
    translation: uz ? card.translationUzLatn : card.translationRu,
    exampleEn: card.exampleEn,
    exampleTranslation: uz ? card.exampleUzLatn : card.exampleRu,
    intervals,
  };
}

export interface GoalForecast {
  /** Words not introduced yet. */
  remaining: number;
  /** The study day the last word is introduced at `pace`; null once every word is in. */
  finishOn: StudyDay | null;
}

/**
 * When the user finishes the deck at `pace` new words a day. Today counts with whatever it still has to
 * introduce: its stored plan if there is one, otherwise a full day at `pace` (the first day after onboarding).
 */
export function goalForecast(db: Db, now: Date, pace: number): GoalForecast {
  const today = studyDay(now);
  const remaining = countNewAvailable(db);
  if (remaining === 0) return { remaining, finishOn: null };
  const plan = getDay(db, today);
  const leftToday = plan ? Math.max(0, plan.newTarget - plan.newDone) : Math.min(pace, remaining);
  return { remaining, finishOn: forecastGoalDate(today, Math.max(0, remaining - leftToday), pace) };
}

export interface TodaySummary {
  progress: DayRow;
  normComplete: boolean;
  /** Cards a session would offer now, including optional recovery extras and learning repeats. */
  available: number;
  goal: GoalForecast;
  streak: StreakInfo;
  totalXp: number;
  level: LevelInfo;
}

/** Everything the home screen shows. XP and streak are computed from history even when the game UI is off. */
export function todaySummary(db: Db, now: Date): TodaySummary {
  const progress = ensureDayPlan(db, now);
  const history = listDays(db);
  const totalXp = history.reduce((sum, p) => sum + xpForDay(p), 0);
  return {
    progress,
    normComplete: isNormComplete(progress),
    available: buildSession(db, now).length,
    goal: goalForecast(db, now, getProfile(db).newPerDay),
    streak: computeStreak(history, progress.day),
    totalXp,
    level: levelForXp(totalXp),
  };
}
