import { asc, eq, sql } from "drizzle-orm";

import type { DayPlan, DayProgress } from "../domain/dailyPlan";
import type { StudyDay } from "../domain/studyDay";
import { dailyProgress } from "./schema";
import type { Db } from "./types";

export type DayRow = typeof dailyProgress.$inferSelect;

export function getDay(db: Db, day: StudyDay): DayRow | undefined {
  return db.select().from(dailyProgress).where(eq(dailyProgress.day, day)).get();
}

/** Stores the day's plan. The targets never change afterwards, only the done counters. */
export function insertDay(db: Db, day: StudyDay, plan: DayPlan, now: Date): DayRow {
  const row: DayRow = {
    day,
    mode: plan.mode,
    newTarget: plan.newTarget,
    newDone: 0,
    reviewTarget: plan.reviewTarget,
    reviewCap: plan.reviewCap,
    reviewDone: 0,
    updatedAt: now.getTime(),
  };
  db.insert(dailyProgress).values(row).run();
  return row;
}

/** Every study day so far, oldest first. */
export function listDays(db: Db): DayProgress[] {
  return db
    .select({
      day: dailyProgress.day,
      mode: dailyProgress.mode,
      newTarget: dailyProgress.newTarget,
      newDone: dailyProgress.newDone,
      reviewTarget: dailyProgress.reviewTarget,
      reviewDone: dailyProgress.reviewDone,
    })
    .from(dailyProgress)
    .orderBy(asc(dailyProgress.day))
    .all();
}

/** Counts one answered card towards the day. Does nothing if the day has no plan yet. */
export function countAnswer(db: Db, day: StudyDay, kind: "new" | "review", now: Date): void {
  const set =
    kind === "new"
      ? { newDone: sql`${dailyProgress.newDone} + 1`, updatedAt: now.getTime() }
      : { reviewDone: sql`${dailyProgress.reviewDone} + 1`, updatedAt: now.getTime() };
  db.update(dailyProgress).set(set).where(eq(dailyProgress.day, day)).run();
}
