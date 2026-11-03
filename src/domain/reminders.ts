import { DAY_ROLLOVER_HOUR } from "./config";
import type { StudyDay } from "./studyDay";

/** What is left of a study day's norm: the counts its reminder names. */
export interface DayWork {
  day: StudyDay;
  reviews: number;
  newWords: number;
}

export interface Reminder extends DayWork {
  at: Date;
}

/**
 * When the reminder for `day` fires: `minutes` after local midnight.
 * A time before the rollover hour still belongs to that study day, so it falls on the next calendar date.
 */
export function reminderAt(day: StudyDay, minutes: number, rolloverHour: number = DAY_ROLLOVER_HOUR): Date {
  const [y, m, d] = day.split("-").map(Number);
  const nextDate = minutes < rolloverHour * 60 ? 1 : 0;
  return new Date(y, m - 1, d + nextDate, Math.floor(minutes / 60), minutes % 60);
}

/**
 * At most one reminder per study day, at the chosen time. A day with nothing left to do gets none,
 * and neither does a time that has already passed.
 */
export function planReminders(days: readonly DayWork[], minutes: number, now: Date): Reminder[] {
  return days
    .filter((w) => w.reviews + w.newWords > 0)
    .map((w) => ({ ...w, at: reminderAt(w.day, minutes) }))
    .filter((r) => r.at.getTime() > now.getTime());
}
