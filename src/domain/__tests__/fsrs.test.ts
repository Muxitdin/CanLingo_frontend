import { describe, expect, it } from "@jest/globals";

import { grade, GRADES, newCardState, previewDue, Rating, State } from "../fsrs";

const now = new Date("2026-11-05T09:00:00Z");

describe("fsrs wrapper", () => {
  it("creates a new card that is due immediately", () => {
    const card = newCardState(now);
    expect(card.state).toBe(State.New);
    expect(card.reps).toBe(0);
    expect(card.due.getTime()).toBe(now.getTime());
  });

  it("exposes the four Anki-style buttons in order", () => {
    expect(GRADES).toEqual([Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]);
  });

  it("moves a new card out of New and records the review", () => {
    const { card, log } = grade(newCardState(now), Rating.Good, now);
    expect(card.state).not.toBe(State.New);
    expect(card.reps).toBe(1);
    expect(card.due.getTime()).toBeGreaterThan(now.getTime());
    expect(log.rating).toBe(Rating.Good);
    expect(log.state).toBe(State.New);
  });

  it("schedules harder ratings sooner", () => {
    const due = previewDue(newCardState(now), now);
    expect(due[Rating.Again].getTime()).toBeLessThanOrEqual(due[Rating.Hard].getTime());
    expect(due[Rating.Hard].getTime()).toBeLessThanOrEqual(due[Rating.Good].getTime());
    expect(due[Rating.Good].getTime()).toBeLessThan(due[Rating.Easy].getTime());
  });

  it("counts a lapse when a review card is forgotten", () => {
    let card = newCardState(now);
    let t = now;
    // Graduate the card to Review with a few correct answers.
    while (card.state !== State.Review) {
      card = grade(card, Rating.Good, t).card;
      t = card.due;
    }
    const lapsed = grade(card, Rating.Again, t).card;
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.state).toBe(State.Relearning);
  });
});
