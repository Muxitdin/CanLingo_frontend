const DAY_MS = 24 * 60 * 60 * 1000;

let offsetDays = 0;

/**
 * The app's current time. Screens and hooks read it instead of `new Date()`, so in development
 * the clock can run whole days ahead to test reviews without waiting (Settings → For development).
 */
export function now(): Date {
  return new Date(Date.now() + offsetDays * DAY_MS);
}

export function clockOffsetDays(): number {
  return offsetDays;
}

export function setClockOffsetDays(days: number): void {
  offsetDays = days;
}
