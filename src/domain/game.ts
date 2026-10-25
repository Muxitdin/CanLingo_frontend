import { LEVEL_STEP_AFTER_TABLE, LEVEL_THRESHOLDS, STREAK_FREEZES_PER_WEEK, XP_PER_NORM } from "./config";
import { isNormComplete, type DayProgress } from "./dailyPlan";
import { addDays, daysBetween, weekStart, type StudyDay } from "./studyDay";

/** XP earned on a study day: a flat amount for finishing the norm, nothing per card. */
export function xpForDay(p: DayProgress): number {
  return isNormComplete(p) ? XP_PER_NORM : 0;
}

export interface LevelInfo {
  level: number;
  /** XP gained inside the current level. */
  xpIntoLevel: number;
  /** XP the current level spans; xpIntoLevel / xpForLevel is the progress bar. */
  xpForLevel: number;
}

/** Total XP needed to reach `level` (1-based). */
function threshold(level: number): number {
  if (level <= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS.at(level - 1) ?? 0;
  const last = LEVEL_THRESHOLDS.at(-1) ?? 0;
  return last + (level - LEVEL_THRESHOLDS.length) * LEVEL_STEP_AFTER_TABLE;
}

export function levelForXp(xp: number): LevelInfo {
  let level = 1;
  while (threshold(level + 1) <= xp) level++;
  const start = threshold(level);
  return { level, xpIntoLevel: xp - start, xpForLevel: threshold(level + 1) - start };
}

export interface StreakInfo {
  current: number;
  best: number;
  /** Missed days covered by a freeze, oldest first. */
  frozenDays: StudyDay[];
}

/**
 * Streak from daily history: consecutive days with a completed norm.
 * A missed day is covered by a freeze if the week (Monday to Sunday) still has one left;
 * a frozen day keeps the streak alive but doesn't add to it.
 * Today only counts once its norm is done, and an unfinished today never breaks the streak.
 * Computed, never stored, so a timezone change or a reinstall can't corrupt it.
 */
export function computeStreak(history: readonly DayProgress[], today: StudyDay): StreakInfo {
  const done = new Set(history.filter(isNormComplete).map((p) => p.day));
  const first = [...done].sort()[0];
  const result: StreakInfo = { current: 0, best: 0, frozenDays: [] };
  if (!first) return result;

  const freezesUsed = new Map<StudyDay, number>();
  for (let day = first; daysBetween(day, today) >= 0; day = addDays(day, 1)) {
    if (done.has(day)) {
      result.current++;
      result.best = Math.max(result.best, result.current);
      continue;
    }
    if (day === today) break;
    const week = weekStart(day);
    const used = freezesUsed.get(week) ?? 0;
    if (result.current > 0 && used < STREAK_FREEZES_PER_WEEK) {
      freezesUsed.set(week, used + 1);
      result.frozenDays.push(day);
    } else {
      result.current = 0;
    }
  }
  return result;
}

/** The day the user finishes the remaining words at `newPerDay` per day; null without a pace. */
export function forecastGoalDate(today: StudyDay, wordsRemaining: number, newPerDay: number): StudyDay | null {
  if (wordsRemaining <= 0) return today;
  if (newPerDay <= 0) return null;
  return addDays(today, Math.ceil(wordsRemaining / newPerDay));
}
