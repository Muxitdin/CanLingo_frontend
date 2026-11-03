import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, renderRouter, screen, testRouter } from "expo-router/testing-library";

import { ensureProfile, getProfile, updateProfile } from "../db/profile";
import { reviewLog } from "../db/schema";
import { createTestDb } from "../db/testing/testDb";
import type { Db } from "../db/types";

// The app's expo-sqlite connection is swapped for sql.js with the same migrations, so screens run on real SQLite.
const mockDb: { current: Db | null } = { current: null };
jest.mock("../db/client", () => ({
  get db() {
    return mockDb.current;
  },
  runMigrations: () => Promise.resolve(),
}));
jest.mock("expo-speech", () => ({ speak: jest.fn(), stop: jest.fn(() => Promise.resolve()) }));

beforeEach(async () => {
  mockDb.current = await createTestDb();
});

describe("app flow", () => {
  it("goes from onboarding in Uzbek to the first rated card", async () => {
    await renderRouter("src/app", { initialUrl: "/" });

    // Onboarding: the language step is bilingual, the rest follows the choice.
    await fireEvent.press(await screen.findByText("Oʻzbekcha"));
    await fireEvent.press(screen.getByText("Keyingi"));
    expect(screen.getByText("Kuniga nechta yangi soʻz?")).toBeTruthy();
    await fireEvent.press(screen.getByText(/Bemalol/));
    await fireEvent.press(screen.getByText("Keyingi"));
    await fireEvent.press(screen.getByText("Oʻrganishni boshlash"));

    // Home: today's plan at the chosen pace.
    expect(await screen.findByText("Bugun")).toBeTruthy();
    expect(screen.getByText("0 / 5")).toBeTruthy();
    await fireEvent.press(screen.getByText("Boshlash"));

    // Review: first word of the deck, answer in Uzbek, rate it.
    expect(await screen.findByText("hello")).toBeTruthy();
    await fireEvent.press(screen.getByText("Javobni koʻrsatish"));
    expect(screen.getByText("salom")).toBeTruthy();
    await fireEvent.press(screen.getByText("Yaxshi"));

    expect(mockDb.current!.select().from(reviewLog).all()).toHaveLength(1);
    expect(await screen.findByText("name")).toBeTruthy();
  });

  it("hides the game layer from settings without losing progress", async () => {
    const db = mockDb.current!;
    ensureProfile(db, new Date());
    updateProfile(db, { onboardedAt: Date.now() }, new Date());
    await renderRouter("src/app", { initialUrl: "/" });

    expect(await screen.findByText("Уровень 1")).toBeTruthy();
    await testRouter.push("/settings");
    await fireEvent(screen.getByLabelText("Игровой режим"), "valueChange", false);
    await testRouter.back("/");

    expect(screen.queryByText("Уровень 1")).toBeNull();
    expect(screen.getByText("Сегодня")).toBeTruthy();
    expect(getProfile(db).gameEnabled).toBe(false);
  });
});
