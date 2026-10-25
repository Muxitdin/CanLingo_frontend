import { describe, expect, it } from "@jest/globals";

import { buildQueue, repeatsInSession } from "../queue";

const ids = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`);

describe("buildQueue", () => {
  it("keeps reviews in due order and spreads new words between them", () => {
    const queue = buildQueue({ dueIds: ids("r", 6), newIds: ids("n", 2), reviewLimit: 6, newLimit: 2 });
    expect(queue.map((q) => q.cardId)).toEqual(["r0", "r1", "n0", "r2", "r3", "n1", "r4", "r5"]);
  });

  it("respects both limits", () => {
    const queue = buildQueue({ dueIds: ids("r", 10), newIds: ids("n", 10), reviewLimit: 3, newLimit: 1 });
    expect(queue.filter((q) => q.kind === "review")).toHaveLength(3);
    expect(queue.filter((q) => q.kind === "new")).toHaveLength(1);
  });

  it("handles days with only new words or only reviews", () => {
    expect(buildQueue({ dueIds: [], newIds: ids("n", 3), reviewLimit: 0, newLimit: 3 })).toHaveLength(3);
    expect(buildQueue({ dueIds: ids("r", 3), newIds: [], reviewLimit: 3, newLimit: 0 })).toHaveLength(3);
    expect(buildQueue({ dueIds: [], newIds: [], reviewLimit: 5, newLimit: 5 })).toEqual([]);
  });

  it("treats negative limits as zero", () => {
    expect(buildQueue({ dueIds: ids("r", 3), newIds: ids("n", 3), reviewLimit: -1, newLimit: -2 })).toEqual([]);
  });
});

describe("repeatsInSession", () => {
  const now = new Date("2026-11-10T15:00:00Z");
  it("brings back cards due within 20 minutes", () => {
    expect(repeatsInSession(new Date(now.getTime() + 10 * 60_000), now)).toBe(true);
    expect(repeatsInSession(new Date(now.getTime() + 20 * 60_000), now)).toBe(true);
  });
  it("leaves later cards for another day or session", () => {
    expect(repeatsInSession(new Date(now.getTime() + 21 * 60_000), now)).toBe(false);
  });
});
