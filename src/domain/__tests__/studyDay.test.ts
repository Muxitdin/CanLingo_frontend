import { describe, expect, it } from "@jest/globals";

import { addDays, dayEnd, daysBetween, studyDay, weekStart } from "../studyDay";

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

describe("addDays", () => {
  it("moves across months and years", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("dayEnd", () => {
  it("is the next day's rollover, local time", () => {
    expect(dayEnd("2026-11-05").getTime()).toBe(new Date(2026, 10, 6, 4, 0).getTime());
    expect(studyDay(new Date(dayEnd("2026-11-05").getTime() - 1))).toBe("2026-11-05");
    expect(studyDay(dayEnd("2026-11-05"))).toBe("2026-11-06");
  });
});

describe("weekStart", () => {
  it("returns the Monday of the week", () => {
    expect(weekStart("2026-11-09")).toBe("2026-11-09"); // Monday
    expect(weekStart("2026-11-15")).toBe("2026-11-09"); // Sunday
    expect(weekStart("2026-11-16")).toBe("2026-11-16");
  });
});
