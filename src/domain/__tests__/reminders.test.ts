import { describe, expect, it } from "@jest/globals";

import { planReminders, reminderAt, type DayWork } from "../reminders";

const work = (day: string, reviews: number, newWords: number): DayWork => ({ day, reviews, newWords });

describe("reminderAt", () => {
  it("fires at the chosen local time of the study day", () => {
    expect(reminderAt("2026-11-10", 20 * 60 + 30)).toEqual(new Date(2026, 10, 10, 20, 30));
  });

  it("puts a time before the 04:00 rollover on the next calendar date", () => {
    expect(reminderAt("2026-11-10", 60)).toEqual(new Date(2026, 10, 11, 1, 0));
  });

  it("crosses month ends", () => {
    expect(reminderAt("2026-11-30", 8 * 60)).toEqual(new Date(2026, 10, 30, 8, 0));
    expect(reminderAt("2026-11-30", 2 * 60)).toEqual(new Date(2026, 11, 1, 2, 0));
  });
});

describe("planReminders", () => {
  const days = [work("2026-11-10", 3, 10), work("2026-11-11", 12, 10), work("2026-11-12", 0, 0), work("2026-11-13", 5, 0)];

  it("gives each day with work one reminder at the chosen time", () => {
    const plan = planReminders(days, 20 * 60, new Date(2026, 10, 10, 9, 0));
    expect(plan.map((r) => r.day)).toEqual(["2026-11-10", "2026-11-11", "2026-11-13"]);
    expect(plan[1]).toEqual({ day: "2026-11-11", reviews: 12, newWords: 10, at: new Date(2026, 10, 11, 20, 0) });
  });

  it("skips today once its time has passed", () => {
    const plan = planReminders(days, 20 * 60, new Date(2026, 10, 10, 20, 0));
    expect(plan[0].day).toBe("2026-11-11");
  });

  it("is empty when no day has work", () => {
    expect(planReminders([work("2026-11-10", 0, 0)], 20 * 60, new Date(2026, 10, 10, 9, 0))).toEqual([]);
  });
});
