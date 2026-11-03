/**
 * Local notifications for the daily reminder. No push server: every reminder is scheduled on the device.
 * Local notifications work in Expo Go too; only remote push is missing there.
 */
import {
  AndroidImportance,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
} from "expo-notifications";
import { Platform } from "react-native";

/** Android 8+ groups notifications by channel; users can mute this one in the app's notification settings. */
const CHANNEL_ID = "daily-reminder";

/** Daily reminders carry ids with this prefix, so replacing them leaves other notifications alone. */
const REMINDER_ID = "daily-reminder-";

export interface ScheduledReminder {
  at: Date;
  title: string;
  body: string;
}

const supported = Platform.OS === "ios" || Platform.OS === "android";

/** Whether the app may show notifications. Never prompts. */
export async function notificationsAllowed(): Promise<boolean> {
  if (!supported) return false;
  return (await getPermissionsAsync()).granted;
}

/** Shows the system prompt if it can still be shown; resolves to whether notifications are allowed. */
export async function askNotificationPermission(): Promise<boolean> {
  if (!supported) return false;
  const current = await getPermissionsAsync();
  if (current.granted || !current.canAskAgain) return current.granted;
  return (await requestPermissionsAsync()).granted;
}

let pending: Promise<void> = Promise.resolve();

/**
 * Replaces every scheduled daily reminder with `reminders`. Calls run one after another,
 * so two syncs in quick succession can't leave a day with two reminders.
 */
export function replaceReminders(reminders: readonly ScheduledReminder[], channelName: string): Promise<void> {
  pending = pending
    .then(() => replace(reminders, channelName))
    .catch((error: unknown) => console.warn("Reminders were not scheduled", error));
  return pending;
}

async function replace(reminders: readonly ScheduledReminder[], channelName: string): Promise<void> {
  if (!supported) return;
  const scheduled = await getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.identifier.startsWith(REMINDER_ID)) await cancelScheduledNotificationAsync(n.identifier);
  }
  if (reminders.length === 0 || !(await notificationsAllowed())) return;
  await ensureChannel(channelName);
  for (const r of reminders) {
    await scheduleNotificationAsync({
      identifier: `${REMINDER_ID}${r.at.getTime()}`,
      content: { title: r.title, body: r.body },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: r.at, channelId: CHANNEL_ID },
    });
  }
}

/**
 * Development only: one reminder `seconds` from now, outside the daily schedule, so it can be seen
 * without waiting for the chosen time. iOS shows it only once the app is in the background.
 */
export async function scheduleTestReminder(
  reminder: Omit<ScheduledReminder, "at">,
  channelName: string,
  seconds: number,
): Promise<boolean> {
  if (!(await askNotificationPermission())) return false;
  await ensureChannel(channelName);
  await scheduleNotificationAsync({
    identifier: "test-reminder",
    content: { title: reminder.title, body: reminder.body },
    trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds, channelId: CHANNEL_ID },
  });
  return true;
}

async function ensureChannel(name: string): Promise<void> {
  if (Platform.OS !== "android") return;
  await setNotificationChannelAsync(CHANNEL_ID, { name, importance: AndroidImportance.DEFAULT });
}
