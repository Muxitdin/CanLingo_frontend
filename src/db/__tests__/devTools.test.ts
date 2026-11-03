import { beforeEach, describe, expect, it } from "@jest/globals";

import { answerCard, buildSession } from "../../hooks/study";
import { Rating } from "../../domain/fsrs";
import { cards, cardState, dailyProgress, reviewLog } from "../schema";
import { getClockOffset, resetProgress, saveClockOffset } from "../devTools";
import { getProfile, updateProfile } from "../profile";
import { prepareDatabase } from "../setup";
import { testDeck } from "../testing/fixtures";
import { createTestDb } from "../testing/testDb";
import type { Db } from "../types";

const at = new Date(2026, 10, 10, 9);
let db: Db;

beforeEach(async () => {
  db = await createTestDb();
  prepareDatabase(db, testDeck(1, 15), at);
});

describe("clock offset", () => {
  it("is 0 until saved, then keeps the saved number of days", () => {
    expect(getClockOffset(db)).toBe(0);
    saveClockOffset(db, 1);
    saveClockOffset(db, 3);
    expect(getClockOffset(db)).toBe(3);
  });
});

describe("resetProgress", () => {
  it("wipes progress, settings and the clock offset but keeps the deck and the install id", () => {
    const installId = getProfile(db).installId;
    updateProfile(db, { uiLang: "uz-Latn", newPerDay: 5, gameEnabled: false, onboardedAt: at.getTime() }, at);
    for (const item of buildSession(db, at)) answerCard(db, item, Rating.Easy, at);
    saveClockOffset(db, 2);

    resetProgress(db, at);

    expect(db.select().from(reviewLog).all()).toEqual([]);
    expect(db.select().from(cardState).all()).toEqual([]);
    expect(db.select().from(dailyProgress).all()).toEqual([]);
    expect(getClockOffset(db)).toBe(0);
    expect(db.select().from(cards).all()).toHaveLength(15);
    expect(getProfile(db)).toMatchObject({ installId, uiLang: "ru", newPerDay: 10, gameEnabled: true, onboardedAt: null });
  });
});
