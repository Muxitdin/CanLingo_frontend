import { describe, expect, it } from "@jest/globals";

import { XP_PER_NORM } from "../config";
import type { DayProgress } from "../dailyPlan";
import { computeStreak, forecastGoalDate, levelForXp, xpForDay } from "../game";

const done = (day: string): DayProgress => ({
  day,
  mode: "normal",
  newTarget: 10,
  newDone: 10,
  reviewTarget: 20,
  reviewDone: 20,
});
const partial = (day: string): DayProgress => ({ ...done(day), reviewDone: 5 });

describe("xpForDay", () => {
  it("gives a flat amount only for a completed norm", () => {
    expect(xpForDay(done("2026-11-10"))).toBe(XP_PER_NORM);
    expect(xpForDay(partial("2026-11-10"))).toBe(0);
    expect(xpForDay({ ...done("2026-11-10"), mode: "recovery", newTarget: 0, newDone: 0 })).toBe(XP_PER_NORM);
  });
});

describe("levelForXp", () => {
  it("starts at level 1", () => {
    expect(levelForXp(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForLevel: 300 });
  });
  it("moves up exactly at a threshold", () => {
    expect(levelForXp(299).level).toBe(1);
    expect(levelForXp(300)).toEqual({ level: 2, xpIntoLevel: 0, xpForLevel: 400 });
  });
  it("continues past the table with a fixed step", () => {
    expect(levelForXp(6300)).toEqual({ level: 10, xpIntoLevel: 0, xpForLevel: 1200 });
    expect(levelForXp(6300 + 1200 * 2 + 50)).toEqual({ level: 12, xpIntoLevel: 50, xpForLevel: 1200 });
  });
});

describe("computeStreak", () => {
  // 2026-11-09 is a Monday.
  it("counts consecutive completed days up to today", () => {
    const history = ["2026-11-09", "2026-11-10", "2026-11-11"].map(done);
    expect(computeStreak(history, "2026-11-11")).toEqual({ current: 3, best: 3, frozenDays: [] });
  });

  it("does not break while today is still unfinished", () => {
    const history = [done("2026-11-09"), done("2026-11-10"), partial("2026-11-11")];
    expect(computeStreak(history, "2026-11-11").current).toBe(2);
  });

  it("covers one missed day per week with a freeze", () => {
    const history = ["2026-11-09", "2026-11-11", "2026-11-12"].map(done);
    expect(computeStreak(history, "2026-11-12")).toEqual({ current: 3, best: 3, frozenDays: ["2026-11-10"] });
  });

  it("breaks on a second missed day in the same week", () => {
    const history = ["2026-11-09", "2026-11-11", "2026-11-13", "2026-11-14"].map(done);
    const streak = computeStreak(history, "2026-11-14");
    expect(streak.current).toBe(2);
    expect(streak.best).toBe(2);
    expect(streak.frozenDays).toEqual(["2026-11-10"]);
  });

  it("gives a fresh freeze in a new week", () => {
    // Missed Sat 14th (week of the 9th) and Tue 17th (week of the 16th).
    const history = ["2026-11-12", "2026-11-13", "2026-11-15", "2026-11-16", "2026-11-18"].map(done);
    expect(computeStreak(history, "2026-11-18")).toEqual({
      current: 5,
      best: 5,
      frozenDays: ["2026-11-14", "2026-11-17"],
    });
  });

  it("is zero with no completed days", () => {
    expect(computeStreak([partial("2026-11-10")], "2026-11-10")).toEqual({ current: 0, best: 0, frozenDays: [] });
  });
});

describe("forecastGoalDate", () => {
  it("divides the remaining words by the pace, rounding up", () => {
    expect(forecastGoalDate("2026-11-10", 95, 10)).toBe("2026-11-20");
    expect(forecastGoalDate("2026-11-10", 100, 30)).toBe("2026-11-14");
  });
  it("is today when nothing is left, and null without a pace", () => {
    expect(forecastGoalDate("2026-11-10", 0, 10)).toBe("2026-11-10");
    expect(forecastGoalDate("2026-11-10", 50, 0)).toBeNull();
  });
});
