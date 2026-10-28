import { describe, expect, it } from "@jest/globals";

import { FREE_NEW_PER_DAY, RECOVERY_SPREAD_DAYS, XP_PER_NORM } from "../config";
import { isNormComplete, planDay, typicalDailyReviews, type DayProgress, type RecoveryState } from "../dailyPlan";
import { grade, newCardState, Rating, State, type CardState } from "../fsrs";
import { computeStreak, levelForXp, xpForDay } from "../game";
import { buildQueue, repeatsInSession } from "../queue";
import { dayEnd, studyDay } from "../studyDay";

/**
 * Plays a user through the whole domain layer day by day, the way the app's hooks will:
 * plan the day, build the queue, answer every card, repeat learning cards in-session.
 */

/** Small seeded RNG (mulberry32) so every run answers the same way. */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface SimOptions {
  days: number;
  /** Day indexes (0 = first day) the user doesn't open the app. */
  skipped: ReadonlySet<number>;
  deckSize: number;
  /** Share of answers that are Good; the rest are Again. */
  recallRate: number;
  seed: number;
  /** On recovery days, stop once the norm is done instead of working through the whole quota. */
  minimalRecovery?: boolean;
}

function simulate({ days, skipped, deckSize, recallRate, seed, minimalRecovery = false }: SimOptions) {
  const deck = Array.from({ length: deckSize }, (_, i) => `en-a1-${String(i + 1).padStart(4, "0")}`);
  const states = new Map<string, CardState>();
  const history: DayProgress[] = [];
  const random = seededRandom(seed);
  let recovery: RecoveryState | null = null;

  for (let i = 0; i < days; i++) {
    if (skipped.has(i)) continue;
    // Every session starts at 20:00 local; day 0 is Monday 2 Nov 2026.
    let now = new Date(2026, 10, 2 + i, 20, 0);
    const today = studyDay(now);
    const cutoff = dayEnd(today);

    const dueIds = [...states]
      .filter(([, card]) => card.due < cutoff)
      .sort(([, a], [, b]) => a.due.getTime() - b.due.getTime())
      .map(([id]) => id);
    const newIds = deck.filter((id) => !states.has(id));

    const plan = planDay({
      today,
      dueCount: dueIds.length,
      newAvailable: newIds.length,
      newPerDay: FREE_NEW_PER_DAY,
      typicalDailyReviews: typicalDailyReviews(history, today),
      recovery,
    });
    recovery = plan.recovery;

    const progress: DayProgress = {
      day: today,
      mode: plan.mode,
      newTarget: plan.newTarget,
      newDone: 0,
      reviewTarget: plan.reviewTarget,
      reviewDone: 0,
    };
    const learning: string[] = [];
    const answer = (id: string) => {
      const card = states.get(id) ?? newCardState(now);
      const rating = random() < recallRate ? Rating.Good : Rating.Again;
      const next = grade(card, rating, now).card;
      states.set(id, next);
      now = new Date(now.getTime() + 10_000); // ~10 s per card
      if (next.state !== State.Review && repeatsInSession(next.due, now)) learning.push(id);
    };

    for (const item of buildQueue({ dueIds, newIds, reviewLimit: plan.reviewCap, newLimit: plan.newTarget })) {
      if (minimalRecovery && plan.mode === "recovery" && isNormComplete(progress)) break;
      answer(item.cardId);
      if (item.kind === "new") progress.newDone++;
      else progress.reviewDone++;
    }
    // Cards still in (re)learning come back later in the session; jump the clock to each one's due time.
    for (let guard = 0; learning.length > 0 && guard < 10_000; guard++) {
      const id = learning.shift()!;
      const due = states.get(id)!.due;
      if (due > now) now = due;
      answer(id);
    }
    history.push(progress);
  }
  return { history, states };
}

// 60 days: one missed Wednesday (day 9 = 11 Nov) and a 10-day break (days 21-30 = 23 Nov to 2 Dec).
const options: SimOptions = {
  days: 60,
  skipped: new Set([9, ...Array.from({ length: 10 }, (_, k) => 21 + k)]),
  deckSize: 600,
  recallRate: 0.85,
  seed: 42,
};
const { history, states } = simulate(options);
const studyDays = 60 - options.skipped.size;
const afterBreak = history.findIndex((p) => p.day === "2026-12-03");

describe("60-day simulation", () => {
  it("is deterministic", () => {
    expect(simulate(options).history).toEqual(history);
  });

  it("completes the norm on every day the user studies", () => {
    expect(history).toHaveLength(studyDays);
    expect(history.every(isNormComplete)).toBe(true);
  });

  it("never introduces more than the daily new-word limit, and loses no card", () => {
    expect(Math.max(...history.map((p) => p.newDone))).toBeLessThanOrEqual(FREE_NEW_PER_DAY);
    expect(states.size).toBe(history.reduce((sum, p) => sum + p.newDone, 0));
    expect([...states.values()].every((card) => card.reps > 0)).toBe(true);
  });

  it("stays in normal mode before the break, missed Wednesday included", () => {
    expect(history.slice(0, afterBreak).every((p) => p.mode === "normal")).toBe(true);
  });

  it("enters recovery after the break, pauses new words, and returns to normal within a few days", () => {
    const recoveryDays = history.filter((p) => p.mode === "recovery");
    expect(history[afterBreak].mode).toBe("recovery");
    expect(recoveryDays.length).toBeGreaterThan(0);
    expect(recoveryDays.length).toBeLessThanOrEqual(RECOVERY_SPREAD_DAYS + 1);
    expect(recoveryDays.every((p) => p.newTarget === 0 && p.newDone === 0)).toBe(true);
    // The norm is a normal day's reviews; this user also works through the optional rest of the quota.
    expect(recoveryDays.every((p) => p.reviewDone > p.reviewTarget)).toBe(true);

    const back = history[afterBreak + recoveryDays.length];
    expect(back.mode).toBe("normal");
    expect(back.newTarget).toBe(FREE_NEW_PER_DAY);
    expect(history.slice(afterBreak + recoveryDays.length).every((p) => p.mode === "normal")).toBe(true);
  });

  it("freezes the missed Wednesday, breaks the streak on the long break, and rebuilds it", () => {
    const streak = computeStreak(history, history[history.length - 1].day);
    // Days 31-59 after the break; the first 21 days held 20 completed days plus one frozen.
    expect(streak.current).toBe(29);
    expect(streak.best).toBe(29);
    expect(streak.frozenDays).toEqual(["2026-11-11", "2026-11-23"]);
  });

  it("awards XP per completed day only", () => {
    const xp = history.reduce((sum, p) => sum + xpForDay(p), 0);
    expect(xp).toBe(studyDays * XP_PER_NORM);
    expect(levelForXp(xp).level).toBe(8);
  });
});

describe("60-day simulation, user doing only the norm in recovery", () => {
  const minimal = simulate({ ...options, minimalRecovery: true });
  const recoveryDays = minimal.history.filter((p) => p.mode === "recovery");
  const fullRecoveryDays = history.filter((p) => p.mode === "recovery");

  it("takes longer to clear the backlog, but still returns to normal", () => {
    expect(recoveryDays.length).toBeGreaterThan(fullRecoveryDays.length);
    expect(minimal.history[minimal.history.length - 1].mode).toBe("normal");
  });

  it("still counts every recovery day as done, so XP and the streak are the same as for the full effort", () => {
    expect(recoveryDays.every((p) => isNormComplete(p) && p.reviewDone === p.reviewTarget)).toBe(true);
    expect(minimal.history.every(isNormComplete)).toBe(true);
    expect(computeStreak(minimal.history, minimal.history[minimal.history.length - 1].day).current).toBe(29);
  });
});
