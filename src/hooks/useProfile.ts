import { db } from "../db/client";
import { updateProfile, type ProfileRow, type ProfileSettings } from "../db/profile";
import { useAppDispatch, useAppSelector } from "../store";
import { profileLoaded } from "../store/profileSlice";

/** The profile and a way to change it: saves to SQLite, then updates the store so every screen follows. */
export function useProfile(): { profile: ProfileRow; update: (settings: ProfileSettings) => void } {
  const profile = useAppSelector((s) => s.profile);
  const dispatch = useAppDispatch();
  if (!profile) throw new Error("useProfile before the database is ready");

  function update(settings: ProfileSettings) {
    dispatch(profileLoaded(updateProfile(db, settings, new Date())));
  }

  return { profile, update };
}
