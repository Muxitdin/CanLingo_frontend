import { useState } from "react";

import { db } from "../db/client";
import { resetProgress, saveClockOffset } from "../db/devTools";
import { getProfile } from "../db/profile";
import { studyDay } from "../domain/studyDay";
import { clockOffsetDays, now, setClockOffsetDays } from "../services/clock";
import { useAppDispatch } from "../store";
import { profileLoaded } from "../store/profileSlice";

/** Development-only controls in Settings: run the clock a day ahead, or start over as on first launch. */
export function useDevTools() {
  const dispatch = useAppDispatch();
  const [offset, setOffset] = useState(clockOffsetDays);

  function nextDay() {
    const days = clockOffsetDays() + 1;
    saveClockOffset(db, days);
    setClockOffsetDays(days);
    setOffset(days);
  }

  function reset() {
    setClockOffsetDays(0);
    setOffset(0);
    resetProgress(db, now());
    // The profile has no onboarding date any more, so the router moves to onboarding.
    dispatch(profileLoaded(getProfile(db)));
  }

  return { today: studyDay(now()), offsetDays: offset, nextDay, reset };
}
