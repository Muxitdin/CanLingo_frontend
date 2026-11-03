CREATE TABLE `card_state` (
	`card_id` text PRIMARY KEY NOT NULL,
	`due` integer NOT NULL,
	`stability` real NOT NULL,
	`difficulty` real NOT NULL,
	`elapsed_days` integer NOT NULL,
	`scheduled_days` integer NOT NULL,
	`learning_steps` integer NOT NULL,
	`reps` integer NOT NULL,
	`lapses` integer NOT NULL,
	`state` integer NOT NULL,
	`last_review` integer,
	`introduced_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `card_state_due_idx` ON `card_state` (`due`);--> statement-breakpoint
CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`word` text NOT NULL,
	`pos` text NOT NULL,
	`ipa` text,
	`translation_ru` text NOT NULL,
	`translation_uz_latn` text NOT NULL,
	`example_en` text NOT NULL,
	`example_ru` text NOT NULL,
	`example_uz_latn` text NOT NULL,
	`level` text NOT NULL,
	`unit` integer NOT NULL,
	`position` integer NOT NULL,
	`retired` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cards_path_idx` ON `cards` (`level`,`position`);--> statement-breakpoint
CREATE TABLE `daily_progress` (
	`day` text PRIMARY KEY NOT NULL,
	`mode` text NOT NULL,
	`new_target` integer NOT NULL,
	`new_done` integer DEFAULT 0 NOT NULL,
	`review_target` integer NOT NULL,
	`review_cap` integer NOT NULL,
	`review_done` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` integer PRIMARY KEY NOT NULL,
	`install_id` text NOT NULL,
	`ui_lang` text NOT NULL,
	`new_per_day` integer NOT NULL,
	`game_enabled` integer DEFAULT true NOT NULL,
	`recovery_started_on` text,
	`recovery_quota` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `review_log` (
	`id` text PRIMARY KEY NOT NULL,
	`card_id` text NOT NULL,
	`rating` integer NOT NULL,
	`state` integer NOT NULL,
	`due` integer NOT NULL,
	`stability` real NOT NULL,
	`difficulty` real NOT NULL,
	`elapsed_days` integer NOT NULL,
	`last_elapsed_days` integer NOT NULL,
	`scheduled_days` integer NOT NULL,
	`learning_steps` integer NOT NULL,
	`reviewed_at` integer NOT NULL,
	`study_day` text NOT NULL,
	FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `review_log_day_idx` ON `review_log` (`study_day`);--> statement-breakpoint
CREATE INDEX `review_log_card_idx` ON `review_log` (`card_id`);