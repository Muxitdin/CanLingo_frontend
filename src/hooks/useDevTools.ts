import { useState } from "react";

import { db } from "../db/client";
import { resetProgress, saveClockOffset } from "../db/devTools";
import { getProfile } from "../db/profile";
import { studyDay } from "../domain/studyDay";
import { strings } from "../i18n";
import { clockOffsetDays, now, setClockOffsetDays } from "../services/clock";
import { scheduleTestReminder } from "../services/notifications";
import { useAppDispatch } from "../store";
import { profileLoaded } from "../store/profileSlice";
import { upcomingWork } from "./reminders";

const TEST_REMINDER_SECONDS = 60;

/** Development-only controls in Settings: run the clock a day ahead, see a reminder now, or start over as on first launch. */
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

  /** A reminder with the real text in a minute; false when notifications aren't allowed. */
  function testReminder(): Promise<boolean> {
    const t = strings[getProfile(db).uiLang].reminder;
    const upcoming = upcomingWork(db, now());
    const work = upcoming.find((w) => w.reviews + w.newWords > 0) ?? upcoming[0];
    return scheduleTestReminder({ title: t.title, body: t.body(work.reviews, work.newWords) }, t.channel, TEST_REMINDER_SECONDS);
  }

  return { today: studyDay(now()), offsetDays: offset, nextDay, testReminder, reset };
}
