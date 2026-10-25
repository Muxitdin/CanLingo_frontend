@AGENTS.md

# CanLingo

Android app (iOS later) for learning English vocabulary with spaced repetition (FSRS), for Russian and Uzbek speakers in Uzbekistan. Optional RPG layer (XP, levels, streak) that the user can switch off. Offline-first MVP, solo developer.

## Architecture rules

- **No backend in the MVP.** All data lives in SQLite on the device (expo-sqlite + Drizzle). A NestJS + Postgres server comes later for sync and billing.
- **`src/domain` is pure TypeScript.** No React, React Native, Expo or SQLite imports. Functions take data and `now`, return results. Every rule there gets a Jest test.
- **Only `src/domain/fsrs.ts` imports `ts-fsrs`.** Everything else uses its wrapper.
- **Study day rolls over at 04:00 local time.** Always use `studyDay(now)`, never raw calendar dates, for norms, streaks and stats.
- Screens call hooks in `src/hooks`; a hook reads from `src/db`, computes with `src/domain`, writes back to `src/db`. A rating writes `review_log` and `card_state` in one transaction.
- Tunable numbers live in `src/domain/config.ts`. Don't invent thresholds inside functions.
- UI state: Redux Toolkit. Persistent data is in SQLite, not in the store.

## Layout

```
src/app/        routes (Expo Router)
src/domain/     pure learning logic + tests
src/db/         SQLite schema, migrations, repositories, deck import
src/hooks/      glue between screens, db and domain
src/services/   analytics (Firebase), notifications, TTS, isPremium()
src/i18n/       ru, uz-Latn (uz-Cyrl later)
src/ui/         shared components
```

## Data rules

- Card content (`cards`) and user progress (`card_state`, `review_log`) are separate tables joined by a stable `card_id` like `en-a1-0001`. Never renumber ids; mark removed cards `retired`.
- User rows get a UUID and `updated_at`; `review_log` is append-only. Times are stored as UTC ms.
- Languages are BCP 47 tags with script: `ru`, `uz-Latn`, later `uz-Cyrl`. Translation columns carry the script suffix (`translation_uz_latn`).

## Product rules

- Four rating buttons like Anki (Again / Hard / Good / Easy), same size, differ only by colour.
- XP is awarded once per completed daily norm, never per card; the rating never affects XP.
- The game toggle only hides UI; XP keeps being computed.
- Never show the paywall mid-session or in recovery mode.

## Commands

```bash
npm test            # Jest
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
```

Run all three before calling a change done.
