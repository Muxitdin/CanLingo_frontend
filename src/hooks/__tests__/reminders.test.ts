import { beforeEach, describe, expect, it } from "@jest/globals";

import { countDueReviews } from "../../db/cards";
import { updateProfile } from "../../db/profile";
import { prepareDatabase } from "../../db/setup";
import { testDeck } from "../../db/testing/fixtures";
import { createTestDb } from "../../db/testing/testDb";
import type { Db } from "../../db/types";
import { FREE_NEW_PER_DAY, REMINDER_DAYS } from "../../domain/config";
import { Rating } from "../../domain/fsrs";
import { reminderSchedule } from "../reminders";
import { answerCard, buildSession, ensureDayPlan, type SessionItem } from "../study";

// Day 1 is Tuesday 2026-11-10, local time.
const at = (day: number, hour = 9, minute = 0) => new Date(2026, 10, 9 + day, hour, minute);

/** Answers everything a session offers with Good, re-queuing learning repeats like the screen does. */
function study(db: Db, start: Date): void {
  let now = start;
  const queue: SessionItem[] = buildSession(db, now);
  while (queue.length > 0) {
    const item = queue.shift()!;
    now = new Date(now.getTime() + 10_000);
    if (answerCard(db, item, Rating.Good, now).repeat) queue.push({ cardId: item.cardId, kind: "repeat" });
  }
}

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
  prepareDatabase(db, testDeck(1, 200), at(1));
});

describe("reminderSchedule", () => {
  it("schedules nothing while reminders are off", () => {
    expect(reminderSchedule(db, at(1))).toEqual([]);
  });

  it("reminds once a day at the chosen time, starting today", () => {
    updateProfile(db, { reminderMinutes: 20 * 60 }, at(1));
    const reminders = reminderSchedule(db, at(1));

    expect(reminders).toHaveLength(REMINDER_DAYS);
    expect(reminders[0]).toEqual({ day: "2026-11-10", reviews: 0, newWords: FREE_NEW_PER_DAY, at: at(1, 20) });
    expect(reminders.map((r) => r.at)).toEqual(Array.from({ length: REMINDER_DAYS }, (_, i) => at(1 + i, 20)));
  });

  it("drops today once the norm is done and counts the reviews each day brings", () => {
    updateProfile(db, { reminderMinutes: 20 * 60 }, at(1));
    study(db, at(1));
    const reminders = reminderSchedule(db, at(1, 10));

    expect(reminders[0]).toEqual({
      day: "2026-11-11",
      reviews: countDueReviews(db, "2026-11-11"),
      newWords: FREE_NEW_PER_DAY,
      at: at(2, 20),
    });
    // Today's words come back as reviews later in the week, and the reminder counts them.
    const withReviews = reminders.find((r) => r.reviews > 0)!;
    expect(withReviews.reviews).toBe(countDueReviews(db, withReviews.day));
  });

  it("starts with tomorrow once today's time has passed", () => {
    updateProfile(db, { reminderMinutes: 8 * 60 }, at(1));
    expect(reminderSchedule(db, at(1, 9))[0].day).toBe("2026-11-11");
  });

  it("names a recovery day's reviews after a break, not the whole backlog", () => {
    for (let day = 1; day <= 12; day++) study(db, at(day));
    updateProfile(db, { reminderMinutes: 20 * 60 }, at(40));
    const today = ensureDayPlan(db, at(40));
    const [first] = reminderSchedule(db, at(40));

    expect(today.mode).toBe("recovery");
    expect(first).toMatchObject({ day: today.day, reviews: today.reviewTarget, newWords: 0 });
    expect(first.reviews).toBeLessThan(countDueReviews(db, today.day));
  });
});
