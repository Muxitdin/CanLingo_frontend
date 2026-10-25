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
