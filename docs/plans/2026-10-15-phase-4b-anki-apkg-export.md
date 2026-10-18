# Phase 4b: `.apkg` export with media (~800 LOC)

> Status: done (2026-10-18). Images come only from the user (pick, paste or drop per card, resized to ≤ 1024 px JPEG when large); no image search. sql.js 1.14.2 with its wasm vendored in `public/vendor/`, fflate instead of jszip. One card type (Nhận diện), stable note-type id, deck id from the deck name and GUID from the word, so re-importing updates notes. Verified by importing with the official `anki` Python package (26.09.3): a second import of the same file adds nothing, and an edited export updates the existing notes.

**Depends on:** Phase 3 (deck data). Phase 4a is optional, as a source of images.

## Context

A TSV import cannot carry images or audio, and AnkiConnect only works with Anki desktop. An `.apkg` file is a zip of an SQLite collection, the media files and a `media` JSON map. It can be built entirely in the browser and imports in one tap on AnkiDroid and AnkiMobile. That makes it the best option for Vietnamese learners on phones.

## Scope

- **Dependencies**, pinned to exact versions and lazy-loaded only when the user exports:
  - `sql.js` (the wasm file goes in `public/` or comes from a pinned CDN)
  - `jszip`
- **`lib/anki/apkg.ts`**: builds a minimal collection.
  - One note type, with fields: Hanzi, Pinyin, Meaning, HanViet, Sentence, SentencePinyin, SentenceMeaning, Image, Audio.
  - Front and back templates, plus CSS that uses a Kai-style font.
  - A stable deck ID and note GUIDs, so re-importing updates cards instead of duplicating them.
- **Media sources**:
  - images picked in Phase 4a, fetched as blobs (Openverse and Wikimedia send CORS headers)
  - images the user uploads or pastes
  - audio blobs, later, from Phase 5b
- **UI on `/tools/anki`**: a "Tải bộ thẻ .apkg" button (download the .apkg deck) with progress, plus a size warning above about 50 MB.

## Tests

Generate an `.apkg` in Vitest, unzip it, open it with `sql.js`, and assert:
- the notes and their fields
- the model and deck rows
- the media map and file count

## Verification

- `npm test` and `npm run build` pass.
- Import the file into Anki desktop **and** AnkiDroid: the cards render and images show.
- Re-importing does not create duplicates.
