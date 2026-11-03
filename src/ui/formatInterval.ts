import type { Strings } from "../i18n/ru";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** A short interval label for a rating button, like Anki: "<1 мин", "10 мин", "3 д", "2 мес", "1.5 г". */
export function formatInterval(ms: number, units: Strings["interval"]): string {
  if (ms < MINUTE) return units.lessThanMinute;
  if (ms < HOUR) return `${Math.round(ms / MINUTE)} ${units.minute}`;
  if (ms < DAY) return `${Math.round(ms / HOUR)} ${units.hour}`;
  const days = ms / DAY;
  if (days < 30) return `${Math.round(days)} ${units.day}`;
  if (days < 365) return `${Math.round(days / 30)} ${units.month}`;
  const years = Math.round((days / 365) * 10) / 10;
  return `${years} ${units.year}`;
}
