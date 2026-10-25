import { describe, expect, it } from "@jest/globals";

import { daysBetween, studyDay } from "../studyDay";

// Dates are built with the local-time constructor, so the tests pass in any timezone.
describe("studyDay", () => {
  it("returns the calendar date after the rollover hour", () => {
    expect(studyDay(new Date(2026, 10, 5, 9, 0))).toBe("2026-11-05");
    expect(studyDay(new Date(2026, 10, 5, 4, 0))).toBe("2026-11-05");
  });

  it("counts time before the rollover hour as the previous day", () => {
    expect(studyDay(new Date(2026, 10, 5, 0, 30))).toBe("2026-11-04");
    expect(studyDay(new Date(2026, 10, 5, 3, 59))).toBe("2026-11-04");
  });

  it("rolls back across month and year boundaries", () => {
    expect(studyDay(new Date(2026, 11, 1, 1, 0))).toBe("2026-11-30");
    expect(studyDay(new Date(2027, 0, 1, 2, 0))).toBe("2026-12-31");
  });

  it("accepts a custom rollover hour", () => {
    expect(studyDay(new Date(2026, 10, 5, 0, 30), 0)).toBe("2026-11-05");
  });
});

describe("daysBetween", () => {
  it("counts whole days, signed", () => {
    expect(daysBetween("2026-11-04", "2026-11-04")).toBe(0);
    expect(daysBetween("2026-11-04", "2026-11-07")).toBe(3);
    expect(daysBetween("2026-11-07", "2026-11-04")).toBe(-3);
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
  });
});
