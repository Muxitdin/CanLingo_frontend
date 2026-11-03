import { randomUUID } from "expo-crypto";

/** A new random id for user rows (review_log, install id), unique across devices for later sync. */
export function newId(): string {
  return randomUUID();
}
