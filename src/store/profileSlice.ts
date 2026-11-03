import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { ProfileRow } from "../db/profile";

/**
 * A read-only mirror of the profile row, so every screen re-renders when a setting changes.
 * SQLite stays the source of truth: write through `useProfile().update`, which saves first and then dispatches.
 */
export const profileSlice = createSlice({
  name: "profile",
  initialState: null as ProfileRow | null,
  reducers: {
    profileLoaded: (_state, action: PayloadAction<ProfileRow>) => action.payload,
  },
});

export const { profileLoaded } = profileSlice.actions;
