import { countDueReviews, countNewAvailable } from "../db/cards";
import { listDays } from "../db/days";
import { getProfile, recoveryOf } from "../db/profile";
import type { Db } from "../db/types";
import { REMINDER_DAYS } from "../domain/config";
import { planDay, typicalDailyReviews } from "../domain/dailyPlan";
import { planReminders, type DayWork, type Reminder } from "../domain/reminders";
import { addDays } from "../domain/studyDay";
import { ensureDayPlan } from "./study";

/**
 * What today and the following study days ask for, assuming the app isn't opened before then.
 * Today counts what is left of its stored plan. A later day is planned the way its first open would plan it,
 * so after a break the reminder names a recovery day's reviews, not the whole backlog.
 */
export function upcomingWork(db: Db, now: Date): DayWork[] {
  const today = ensureDayPlan(db, now);
  const profile = getProfile(db);
  const history = listDays(db);
  const newAvailable = countNewAvailable(db);

  const work: DayWork[] = [
    {
      day: today.day,
      reviews: Math.max(0, today.reviewTarget - today.reviewDone),
      newWords: Math.max(0, today.newTarget - today.newDone),
    },
  ];
  for (let i = 1; i < REMINDER_DAYS; i++) {
    const day = addDays(today.day, i);
    const plan = planDay({
      today: day,
      dueCount: countDueReviews(db, day),
      newAvailable,
      newPerDay: profile.newPerDay,
      typicalDailyReviews: typicalDailyReviews(history, day),
      recovery: recoveryOf(profile),
    });
    work.push({ day, reviews: plan.reviewTarget, newWords: plan.newTarget });
  }
  return work;
}

/**
 * The reminders to schedule now; none when the user turned them off. Off is checked first, so during
 * onboarding this never fixes today's plan before the user has picked a pace.
 */
export function reminderSchedule(db: Db, now: Date): Reminder[] {
  const minutes = getProfile(db).reminderMinutes;
  return minutes === null ? [] : planReminders(upcomingWork(db, now), minutes, now);
}
