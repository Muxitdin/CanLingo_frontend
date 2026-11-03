import { useEffect } from "react";
import { AppState } from "react-native";

import { db } from "../db/client";
import { getProfile } from "../db/profile";
import { strings } from "../i18n";
import { now } from "../services/clock";
import { replaceReminders } from "../services/notifications";
import { useAppSelector } from "../store";
import { reminderSchedule } from "./reminders";

/** Reschedules the reminders from the current progress, in the interface language. */
export function syncReminders(): Promise<void> {
  const t = strings[getProfile(db).uiLang].reminder;
  const reminders = reminderSchedule(db, now()).map((r) => ({
    at: r.at,
    title: t.title,
    body: t.body(r.reviews, r.newWords),
  }));
  return replaceReminders(reminders, t.channel);
}

/**
 * Keeps the reminders in step with progress: on start, when the reminder time, pace or language changes,
 * and whenever the app goes to or comes back from the background. Turning reminders off, or a reset that
 * sends the user back to onboarding, cancels the ones already scheduled.
 */
export function useReminderSync(databaseReady: boolean): void {
  const profile = useAppSelector((s) => s.profile);
  const settings = profile && `${profile.reminderMinutes}|${profile.newPerDay}|${profile.uiLang}`;

  useEffect(() => {
    if (!databaseReady || settings === null) return;
    void syncReminders();
    const subscription = AppState.addEventListener("change", () => void syncReminders());
    return () => subscription.remove();
  }, [databaseReady, settings]);
}
