import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Device database. Times are UTC milliseconds; study days are local YYYY-MM-DD strings.
 * Card content and user progress live in separate tables joined by the stable card id,
 * so a deck update never touches progress.
 */

/** Deck content, written only by the deck import. */
export const cards = sqliteTable(
  "cards",
  {
    id: text("id").primaryKey(), // stable, e.g. en-a1-0001; never renumbered
    word: text("word").notNull(),
    pos: text("pos").notNull(),
    ipa: text("ipa"),
    translationRu: text("translation_ru").notNull(),
    translationUzLatn: text("translation_uz_latn").notNull(),
    exampleEn: text("example_en").notNull(),
    exampleRu: text("example_ru").notNull(),
    exampleUzLatn: text("example_uz_latn").notNull(),
    level: text("level", { enum: ["A1", "A2"] }).notNull(),
    unit: integer("unit").notNull(),
    position: integer("position").notNull(),
    retired: integer("retired", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [index("cards_path_idx").on(t.level, t.position)],
);

/** FSRS state of each introduced card; mirrors ts-fsrs `Card`. A row appears when a word is first shown. */
export const cardState = sqliteTable(
  "card_state",
  {
    cardId: text("card_id")
      .primaryKey()
      .references(() => cards.id),
    due: integer("due").notNull(),
    stability: real("stability").notNull(),
    difficulty: real("difficulty").notNull(),
    elapsedDays: integer("elapsed_days").notNull(),
    scheduledDays: integer("scheduled_days").notNull(),
    learningSteps: integer("learning_steps").notNull(),
    reps: integer("reps").notNull(),
    lapses: integer("lapses").notNull(),
    state: integer("state").notNull(),
    lastReview: integer("last_review"),
    introducedAt: integer("introduced_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [index("card_state_due_idx").on(t.due)],
);

/** Every rating, append-only; mirrors ts-fsrs `ReviewLog`. Enables undo, stats and later sync. */
export const reviewLog = sqliteTable(
  "review_log",
  {
    id: text("id").primaryKey(), // UUID
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id),
    rating: integer("rating").notNull(),
    state: integer("state").notNull(), // state before the rating
    due: integer("due").notNull(),
    stability: real("stability").notNull(),
    difficulty: real("difficulty").notNull(),
    elapsedDays: integer("elapsed_days").notNull(),
    lastElapsedDays: integer("last_elapsed_days").notNull(),
    scheduledDays: integer("scheduled_days").notNull(),
    learningSteps: integer("learning_steps").notNull(),
    reviewedAt: integer("reviewed_at").notNull(),
    studyDay: text("study_day").notNull(),
  },
  (t) => [index("review_log_day_idx").on(t.studyDay), index("review_log_card_idx").on(t.cardId)],
);

/** One row per study day: the plan fixed on the day's first open, plus what was done. */
export const dailyProgress = sqliteTable("daily_progress", {
  day: text("day").primaryKey(),
  mode: text("mode", { enum: ["normal", "recovery"] }).notNull(),
  newTarget: integer("new_target").notNull(),
  newDone: integer("new_done").notNull().default(0),
  reviewTarget: integer("review_target").notNull(),
  reviewCap: integer("review_cap").notNull(),
  reviewDone: integer("review_done").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});

/** Single row (id = 1) of user settings and carried state. XP and streak are computed, never stored. */
export const profile = sqliteTable("profile", {
  id: integer("id").primaryKey(),
  installId: text("install_id").notNull(),
  uiLang: text("ui_lang", { enum: ["ru", "uz-Latn"] }).notNull(),
  newPerDay: integer("new_per_day").notNull(),
  gameEnabled: integer("game_enabled", { mode: "boolean" }).notNull().default(true),
  recoveryStartedOn: text("recovery_started_on"),
  recoveryQuota: integer("recovery_quota"),
  /** Set when onboarding finishes; null shows onboarding on the next launch. */
  onboardedAt: integer("onboarded_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/** Small key/value store for app bookkeeping, e.g. the imported deck version. */
export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
