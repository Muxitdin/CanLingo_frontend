import { describe, expect, it } from "@jest/globals";

import { RECOVERY_MIN_DAILY_REVIEWS, RECOVERY_SPREAD_DAYS } from "../config";
import { isNormComplete, planDay, typicalDailyReviews, type DayPlanInput, type DayProgress } from "../dailyPlan";

const base: DayPlanInput = {
  today: "2026-11-10",
  dueCount: 30,
  newAvailable: 500,
  newPerDay: 10,
  typicalDailyReviews: 30,
  recovery: null,
};

const day = (d: string, over: Partial<DayProgress> = {}): DayProgress => ({
  day: d,
  mode: "normal",
  newTarget: 10,
  newDone: 10,
  reviewTarget: 30,
  reviewDone: 30,
  ...over,
});

describe("planDay", () => {
  it("plans all due reviews plus the daily new words on a normal day", () => {
    expect(planDay(base)).toEqual({ mode: "normal", newTarget: 10, reviewTarget: 30, reviewCap: 30, recovery: null });
  });

  it("never plans more new words than are left", () => {
    expect(planDay({ ...base, newAvailable: 4 }).newTarget).toBe(4);
  });

  it("enters recovery when the backlog is far above a normal day", () => {
    const plan = planDay({ ...base, dueCount: 300 });
    expect(plan.mode).toBe("recovery");
    expect(plan.newTarget).toBe(0);
    expect(plan.reviewCap).toBe(Math.ceil(300 / RECOVERY_SPREAD_DAYS));
    expect(plan.recovery).toEqual({ startedOn: "2026-11-10", dailyReviewQuota: 100 });
  });

  it("completes a recovery day after a normal day's reviews, offering the rest as optional", () => {
    const plan = planDay({ ...base, dueCount: 300 });
    expect(plan.reviewTarget).toBe(30);
    expect(plan.reviewCap).toBe(100);
  });

  it("keeps a moderate backlog in normal mode", () => {
    expect(planDay({ ...base, dueCount: 80 }).mode).toBe("normal");
  });

  it("uses a floor for new users with no history", () => {
    // 50 due is a lot for a user with 0 typical reviews, but below 3x the floor.
    expect(planDay({ ...base, typicalDailyReviews: 0, dueCount: 50 }).mode).toBe("normal");
    expect(planDay({ ...base, typicalDailyReviews: 0, dueCount: 3 * RECOVERY_MIN_DAILY_REVIEWS + 1 }).mode).toBe(
      "recovery",
    );
  });

  it("keeps the quota fixed while recovery lasts", () => {
    const recovery = { startedOn: "2026-11-10", dailyReviewQuota: 100 };
    const plan = planDay({ ...base, today: "2026-11-11", dueCount: 210, recovery });
    expect(plan).toEqual({ mode: "recovery", newTarget: 0, reviewTarget: 30, reviewCap: 100, recovery });
  });

  it("ends recovery once the backlog fits in one day's quota", () => {
    const recovery = { startedOn: "2026-11-10", dailyReviewQuota: 100 };
    const plan = planDay({ ...base, today: "2026-11-12", dueCount: 95, recovery });
    expect(plan).toEqual({ mode: "normal", newTarget: 10, reviewTarget: 95, reviewCap: 95, recovery: null });
  });
});

describe("isNormComplete", () => {
  it("needs both targets", () => {
    expect(isNormComplete(day("2026-11-10"))).toBe(true);
    expect(isNormComplete(day("2026-11-10", { newDone: 9 }))).toBe(false);
    expect(isNormComplete(day("2026-11-10", { reviewDone: 29 }))).toBe(false);
    expect(isNormComplete(day("2026-11-10", { reviewDone: 50, newDone: 12 }))).toBe(true);
  });
});

describe("typicalDailyReviews", () => {
  it("averages the last 7 completed normal days before today", () => {
    const history = [
      day("2026-10-20", { reviewTarget: 999, reviewDone: 999 }), // 8th most recent: outside the window
      ...[21, 22, 23, 24, 25, 26].map((d) => day(`2026-10-${d}`, { reviewTarget: 20, reviewDone: 20 })),
      day("2026-11-07", { reviewTarget: 80, reviewDone: 80 }),
      day("2026-11-08", { mode: "recovery", reviewTarget: 100, reviewDone: 100 }), // recovery: ignored
      day("2026-11-09", { reviewDone: 5 }), // not completed: ignored
      day("2026-11-10", { reviewTarget: 999, reviewDone: 999 }), // today: ignored
    ];
    // (6 x 20 + 80) / 7, rounded; the 12-day gap before 7 Nov doesn't matter.
    expect(typicalDailyReviews(history, "2026-11-10")).toBe(29);
  });

  it("is 0 without history", () => {
    expect(typicalDailyReviews([], "2026-11-10")).toBe(0);
  });
});
