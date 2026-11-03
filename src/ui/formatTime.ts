const pad = (n: number) => String(n).padStart(2, "0");

/** Minutes after midnight as a 24-hour clock time, "20:00". Both interface languages write time this way. */
export function clockTime(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}
