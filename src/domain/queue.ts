import { LEARN_AHEAD_MINUTES } from "./config";

export type QueueItem = { cardId: string; kind: "review" | "new" };

export interface QueueInput {
  /** Due review card ids, most overdue first. */
  dueIds: readonly string[];
  /** Not-yet-introduced card ids in path order (level, position). */
  newIds: readonly string[];
  /** How many reviews are left in today's norm. */
  reviewLimit: number;
  /** How many new words are left in today's norm. */
  newLimit: number;
}

/**
 * Orders a session: reviews in due order, with new words spread evenly between them
 * so a session never ends with a block of unfamiliar words.
 */
export function buildQueue(input: QueueInput): QueueItem[] {
  const reviews = input.dueIds.slice(0, Math.max(0, input.reviewLimit));
  const news = input.newIds.slice(0, Math.max(0, input.newLimit));
  const queue: QueueItem[] = [];

  // Slot new word i after `gap * (i + 1)` reviews.
  const gap = reviews.length / (news.length + 1);
  let n = 0;
  reviews.forEach((cardId, r) => {
    while (n < news.length && r >= gap * (n + 1)) {
      queue.push({ cardId: news[n++], kind: "new" });
    }
    queue.push({ cardId, kind: "review" });
  });
  while (n < news.length) {
    queue.push({ cardId: news[n++], kind: "new" });
  }
  return queue;
}

/** A card still in (re)learning comes back in this session if it is due within the learn-ahead window. */
export function repeatsInSession(due: Date, now: Date): boolean {
  return due.getTime() - now.getTime() <= LEARN_AHEAD_MINUTES * 60_000;
}
