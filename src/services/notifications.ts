/**
 * Local notifications for the daily reminder. No push server: every reminder is scheduled on the device.
 * Local notifications work in Expo Go too; only remote push is missing there.
 */
import {
  AndroidImportance,
  cancelAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
} from "expo-notifications";
import { Platform } from "react-native";

/** Android 8+ groups notifications by channel; users can mute this one in the app's notification settings. */
const CHANNEL_ID = "daily-reminder";

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
 * Replaces every scheduled reminder with `reminders`. Calls run one after another,
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
  await cancelAllScheduledNotificationsAsync();
  if (reminders.length === 0 || !(await notificationsAllowed())) return;
  if (Platform.OS === "android") {
    await setNotificationChannelAsync(CHANNEL_ID, {
      name: channelName,
      importance: AndroidImportance.DEFAULT,
    });
  }
  for (const r of reminders) {
    await scheduleNotificationAsync({
      content: { title: r.title, body: r.body },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: r.at, channelId: CHANNEL_ID },
    });
  }
}
