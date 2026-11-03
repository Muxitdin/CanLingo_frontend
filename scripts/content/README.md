# Deck content

`words.csv` is the master table of the bundled deck. The app never reads it: `npm run deck` checks it and writes `assets/decks/en-a1a2.json`, which is what ships.

## Editing

1. Open `words.csv` in Google Sheets (File → Import) or Excel, edit, and export back as CSV (UTF-8).
2. Run `npm run deck`. It fails on errors and prints warnings worth a look.
3. Commit both `words.csv` and `assets/decks/en-a1a2.json`. `npm test` fails if they disagree.

The deck version goes up by itself when the content changes, and the app re-imports the deck on the next launch. Progress is kept.

## Columns

| Column | Meaning |
| --- | --- |
| `id` | Stable card id, `en-a1-0001`. **Never reuse or renumber.** A new word gets the next free number; the build refuses a shipped id with a different word. |
| `level` | CEFR level from the source list (`A1`, `A2`). |
| `unit`, `topic`, `position` | Where the word sits on the path: lesson group of about 10 words, its topic, and the order across the whole deck. Positions run across levels, so a useful A2 word can come before a rare A1 one. Reordering is safe. |
| `word`, `pos`, `ipa` | English headword, part of speech, IPA in slashes, General American (it matches the en-US voice). |
| `ru`, `uz_latn` | Translations. Several meanings are separated by a comma, most common first. |
| `example_en`, `example_ru`, `example_uz_latn` | One short sentence that uses the word, with translations. |
| `ru_checked` | `yes` once the Russian has been checked by a human. |
| `note` | Free text for editors. Not shipped. |

Uzbek is in Latin script with the official letters `ʻ` (U+02BB) in oʻ/gʻ and `ʼ` (U+02BC) for the glottal stop. A test rejects look-alike apostrophes.

## Planned rows

The whole path is laid out ahead of the translations: every row already has its id, unit and position. A row whose five content columns (`ru`, `uz_latn` and the three examples) are all empty is **planned**: the build checks its id and position but doesn't ship it. Fill all five to ship the word; a half-filled row is an error.

Removing a row retires the card in the app (it stops appearing; its history stays).
