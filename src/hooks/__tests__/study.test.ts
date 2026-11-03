import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { fromCardState, getCardState } from "../../db/cards";
import { importDeck } from "../../db/deck";
import { getDay } from "../../db/days";
import * as ids from "../../db/ids";
import { getProfile } from "../../db/profile";
import { reviewsOfCard } from "../../db/reviews";
import { cardState, reviewLog } from "../../db/schema";
import { prepareDatabase } from "../../db/setup";
import { testDeck } from "../../db/testing/fixtures";
import { createTestDb } from "../../db/testing/testDb";
import type { Db } from "../../db/types";
import { FREE_NEW_PER_DAY, XP_PER_NORM } from "../../domain/config";
import { newCardState, Rating, State, type Grade } from "../../domain/fsrs";
import { studyDay } from "../../domain/studyDay";
import { answerCard, buildSession, cardView, ensureDayPlan, todaySummary, type SessionItem } from "../study";

// Day 1 is Tuesday 2026-11-10, local time.
const at = (day: number, hour = 9, minute = 0) => new Date(2026, 10, 9 + day, hour, minute);
const later = (d: Date, seconds: number) => new Date(d.getTime() + seconds * 1000);

/** Answers everything a session offers with one rating, re-queuing learning repeats like the screen does. */
function runSession(db: Db, start: Date, rating: Grade, max = Infinity): Date {
  let now = start;
  const queue: SessionItem[] = buildSession(db, now);
  for (let answered = 0; queue.length > 0 && answered < max; answered++) {
    const item = queue.shift()!;
    now = later(now, 10);
    if (answerCard(db, item, rating, now).repeat) queue.push({ cardId: item.cardId, kind: "repeat" });
  }
  return now;
}

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
  prepareDatabase(db, testDeck(1, 15), at(1));
});

describe("ensureDayPlan", () => {
  it("plans a first day with new words only", () => {
    const day = ensureDayPlan(db, at(1));
    expect(day).toMatchObject({ day: "2026-11-10", mode: "normal", newTarget: FREE_NEW_PER_DAY, reviewTarget: 0 });
  });

  it("keeps the plan fixed for the rest of the day", () => {
    ensureDayPlan(db, at(1));
    importDeck(db, testDeck(2, 3));
    expect(ensureDayPlan(db, at(1, 23)).newTarget).toBe(FREE_NEW_PER_DAY);
  });

  it("belongs to the previous day before 04:00", () => {
    expect(ensureDayPlan(db, at(2, 3, 30)).day).toBe("2026-11-10");
  });
});

describe("a study day", () => {
  it("introduces new words, brings learning cards back in the session, and counts each word once", () => {
    const session = buildSession(db, at(1));
    expect(session.map((i) => i.kind)).toEqual(Array(FREE_NEW_PER_DAY).fill("new"));

    runSession(db, at(1), Rating.Good);

    const day = getDay(db, "2026-11-10")!;
    expect(day.newDone).toBe(FREE_NEW_PER_DAY);
    // Good on a new card is a 10-minute learning step, so each word was answered twice.
    expect(db.select().from(reviewLog).all()).toHaveLength(FREE_NEW_PER_DAY * 2);
    expect(db.select().from(cardState).all().every((c) => c.state === State.Review)).toBe(true);
    expect(todaySummary(db, at(1, 10))).toMatchObject({ normComplete: true, available: 0, totalXp: XP_PER_NORM });
  });

  it("offers learning cards left from an earlier session as repeats that don't count", () => {
    const first = buildSession(db, at(1))[0];
    answerCard(db, first, Rating.Again, at(1)); // back in about a minute

    const next = buildSession(db, at(1, 9, 30));
    expect(next[0]).toEqual({ cardId: first.cardId, kind: "repeat" });
    answerCard(db, next[0], Rating.Good, at(1, 9, 30));
    expect(getDay(db, "2026-11-10")!.newDone).toBe(1);
  });

  it("turns yesterday's cards into today's reviews and continues the streak", () => {
    runSession(db, at(1), Rating.Good);
    // Every card graduated with a short interval; three days later they are all due.
    const day4 = ensureDayPlan(db, at(4));
    expect(day4).toMatchObject({ mode: "normal", reviewTarget: FREE_NEW_PER_DAY, newTarget: 5 });

    const kinds = buildSession(db, at(4)).map((i) => i.kind);
    expect(kinds.filter((k) => k === "review")).toHaveLength(10);
    expect(kinds.filter((k) => k === "new")).toHaveLength(5);

    runSession(db, at(4), Rating.Good);
    const summary = todaySummary(db, at(4, 12));
    expect(summary.normComplete).toBe(true);
    expect(summary.totalXp).toBe(2 * XP_PER_NORM);
    // Days 2 and 3 were missed; one freeze covers a day, so the streak restarts on day 4.
    expect(summary.streak.current).toBe(1);
  });

  it("counts two consecutive completed days as a streak of 2", () => {
    runSession(db, at(1), Rating.Good);
    runSession(db, at(2), Rating.Good);
    const summary = todaySummary(db, at(2, 12));
    expect(summary.normComplete).toBe(true);
    expect(summary.streak.current).toBe(2);
  });
});

describe("recovery", () => {
  /** Puts `n` cards in review state, all overdue by a week on day 1. */
  function seedBacklog(n: number) {
    prepareDatabase(db, testDeck(2, 120), at(1));
    const weekAgo = at(-6);
    for (let i = 1; i <= n; i++) {
      const card = { ...newCardState(weekAgo), state: State.Review, stability: 3, difficulty: 5, reps: 3 };
      card.due = at(0);
      card.last_review = weekAgo;
      db.insert(cardState)
        .values(fromCardState(`en-a1-${String(i).padStart(4, "0")}`, card, weekAgo.getTime(), weekAgo))
        .run();
    }
  }

  it("spreads a backlog over days, pauses new words, and counts the day after a normal day's work", () => {
    seedBacklog(100);
    const plan = ensureDayPlan(db, at(1));
    // Normal day is the 20-card floor; quota is ceil(100 / 3) = 34.
    expect(plan).toMatchObject({ mode: "recovery", newTarget: 0, reviewTarget: 20, reviewCap: 34 });
    expect(getProfile(db)).toMatchObject({ recoveryStartedOn: "2026-11-10", recoveryQuota: 34 });

    const session = buildSession(db, at(1));
    expect(session).toHaveLength(34);
    expect(session.every((i) => i.kind === "review")).toBe(true);

    runSession(db, at(1), Rating.Good, 20);
    const summary = todaySummary(db, at(1, 10));
    expect(summary.normComplete).toBe(true);
    expect(summary.available).toBe(14);
  });
});

describe("answerCard", () => {
  it("writes card_state and review_log together, or neither", () => {
    const item = buildSession(db, at(1))[0];
    jest.spyOn(ids, "newId").mockImplementationOnce(() => {
      throw new Error("disk full");
    });
    expect(() => answerCard(db, item, Rating.Good, at(1))).toThrow("disk full");
    expect(getCardState(db, item.cardId)).toBeUndefined();
    expect(getDay(db, "2026-11-10")!.newDone).toBe(0);

    answerCard(db, item, Rating.Good, at(1));
    expect(getCardState(db, item.cardId)?.introducedAt).toBe(at(1).getTime());
    expect(reviewsOfCard(db, item.cardId)).toHaveLength(1);
    expect(reviewsOfCard(db, item.cardId)[0]).toMatchObject({ studyDay: studyDay(at(1)), state: State.New });
  });

  it("keeps the first introduction time on later answers", () => {
    const item = buildSession(db, at(1))[0];
    answerCard(db, item, Rating.Again, at(1));
    answerCard(db, { ...item, kind: "repeat" }, Rating.Good, at(1, 9, 5));
    expect(getCardState(db, item.cardId)?.introducedAt).toBe(at(1).getTime());
  });
});

describe("retired cards", () => {
  it("drop out of new words and reviews but keep their history", () => {
    const [first] = buildSession(db, at(1));
    answerCard(db, first, Rating.Easy, at(1));
    importDeck(db, testDeck(2, testDeck(1, 15).cards.filter((c) => c.id !== first.cardId)));

    const ids30 = buildSession(db, at(30)).map((i) => i.cardId);
    expect(ids30).not.toContain(first.cardId);
    expect(reviewsOfCard(db, first.cardId)).toHaveLength(1);
  });
});

describe("cardView", () => {
  it("shows the translation in the interface language and an interval for each button", () => {
    const [item] = buildSession(db, at(1));
    const ru = cardView(db, item.cardId, "ru", at(1));
    const uz = cardView(db, item.cardId, "uz-Latn", at(1));
    expect(ru.translation).toBe("ru1");
    expect(uz.translation).toBe("uz1");
    expect(uz.exampleTranslation).toBe("uz ex1");
    expect(ru.intervals[Rating.Again]).toBeLessThan(ru.intervals[Rating.Good]);
    expect(ru.intervals[Rating.Good]).toBeLessThan(ru.intervals[Rating.Easy]);
  });
});
