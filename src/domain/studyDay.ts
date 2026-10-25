import { DAY_ROLLOVER_HOUR } from "./config";

/** A study day in local time, formatted as YYYY-MM-DD. */
export type StudyDay = string;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Returns the study day that `now` belongs to.
 * The day starts at `rolloverHour` local time, so 01:30 on the 5th is still the 4th.
 */
export function studyDay(now: Date, rolloverHour: number = DAY_ROLLOVER_HOUR): StudyDay {
  const d = new Date(now.getTime());
  if (d.getHours() < rolloverHour) {
    d.setDate(d.getDate() - 1);
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: StudyDay, to: StudyDay): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

const parse = (day: StudyDay) => {
  const [y, m, d] = day.split("-").map(Number);
  return { y, m, d };
};

/** The study day `n` days after `day` (or before, if `n` is negative). */
export function addDays(day: StudyDay, n: number): StudyDay {
  const t = new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000);
  return t.toISOString().slice(0, 10);
}

/**
 * The moment the study day ends: the next day's rollover, local time.
 * A card is due today if its due date is before this moment.
 */
export function dayEnd(day: StudyDay, rolloverHour: number = DAY_ROLLOVER_HOUR): Date {
  const { y, m, d } = parse(day);
  return new Date(y, m - 1, d + 1, rolloverHour);
}

/** Monday of the week that `day` falls in. */
export function weekStart(day: StudyDay): StudyDay {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(day, -((weekday + 6) % 7));
}
