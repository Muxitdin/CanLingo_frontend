import { describe, expect, it } from "@jest/globals";

import type { ProfileRow } from "../../db/profile";
import { profileLoaded, profileSlice } from "../profileSlice";

const row: ProfileRow = {
  id: 1,
  installId: "x",
  uiLang: "uz-Latn",
  newPerDay: 5,
  gameEnabled: false,
  recoveryStartedOn: null,
  recoveryQuota: null,
  onboardedAt: 1,
  createdAt: 1,
  updatedAt: 2,
};

describe("profileSlice", () => {
  it("starts empty and mirrors the loaded row", () => {
    const empty = profileSlice.reducer(undefined, { type: "init" });
    expect(empty).toBeNull();
    expect(profileSlice.reducer(empty, profileLoaded(row))).toEqual(row);
  });
});
