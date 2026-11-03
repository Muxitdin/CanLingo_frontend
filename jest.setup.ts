import { jest } from "@jest/globals";

// expo-crypto calls a native module that Jest doesn't have; Node's Web Crypto gives the same UUID v4.
jest.mock("expo-crypto", () => ({
  randomUUID: () => globalThis.crypto.randomUUID(),
}));
