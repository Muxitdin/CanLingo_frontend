import { jest } from "@jest/globals";

// expo-crypto calls a native module that Jest doesn't have; Node's Web Crypto gives the same UUID v4.
jest.mock("expo-crypto", () => ({
  randomUUID: () => globalThis.crypto.randomUUID(),
}));

// Notifications need the native module; tests check what the app asks to schedule, not the OS side.
jest.mock("./src/services/notifications", () => ({
  notificationsAllowed: jest.fn(() => Promise.resolve(true)),
  askNotificationPermission: jest.fn(() => Promise.resolve(true)),
  replaceReminders: jest.fn(() => Promise.resolve()),
  scheduleTestReminder: jest.fn(() => Promise.resolve(true)),
}));
