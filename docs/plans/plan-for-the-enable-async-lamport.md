# Plan: one-file Anki deck (.apkg) export — 2026-10-20

(Earlier plans in this file shipped: pronunciation button 41ee09e, Navbar 36c3095.)

## Context

Learner journey with Anki: choose words → get word info → **set up Anki (note type, 10 fields, card templates)** → **import (separator, field mapping)** → review → add more later. We fully automate the word info (`/tools/anki`), but steps 3–4 are still manual (TSV + the `/tools/anki/huong-dan` guide) and they are where beginners give up. Owner picked: export an `.apkg` file — deck + note type "Hán Ngữ Studio" + our card templates in one file; double-click (desktop) or open (AnkiDroid) to import. TSV stays.

Constraints: all in the browser (Hard Rules 1–2), static/lazy-loaded (Rule 5), user words never leave the device (Rule 4).

## Format (legacy `collection.anki2`, schema 11 — what genanki uses; imported by Anki 2.1+, 23.x/24.x/25.x and AnkiDroid)

`.apkg` = zip of `collection.anki2` (SQLite: `col`, `notes`, `cards`, `revlog`, `graves` + indexes) and `media` (`{}`).
- `col.models`: one note type, **fixed id** (constant) named `NOTE_TYPE_NAME`, fields `NOTE_TYPE_FIELDS`, templates from `cardTemplates(labels)` (chosen locale), `css` = `CARD_CSS` (`lib/anki/templates.ts`). `sortf` 0.
- `col.decks`: default deck (id 1) + the user's deck (id from a hash of its name, so re-exports land in the same deck).
- `notes`: `guid` **deterministic from the word** (hash → base91) so re-importing an updated deck updates notes instead of duplicating (helps "add more later"); `flds` = 10 field values joined by `\x1f`, HTML as in `toTsv(…, html=true)` (escape, keep `<br>` between examples); `sfld` = word; `csum` = first 8 hex digits of SHA-1 of the word as int (`crypto.subtle`); tag `HanNguStudio` (+ `HSK1`…).
- `cards`: one per chosen template per note (`ord` = template index), new (`type`=0, `queue`=0), `due` = note position (learn in the list's order).

## Changes

1. **Dependencies** (pinned, MIT): `sql.js` (SQLite in wasm) and `fflate` (zip). `scripts/build-data.mjs` copies `node_modules/sql.js/dist/sql-wasm.wasm` → `public/data/vendor/sql-wasm.wasm` (≈ 0.6 MB, ≈ 0.3 MB gzip) so it is self-hosted and lands in `sizes.json` automatically; never a CDN. Credit both in `THIRD-PARTY-NOTICES.md` and `lib/legal/sources.ts`.
2. **`lib/anki/apkg.ts`** (pure, no UI): `buildApkg(rows, { deckName, templates, columns, locale, SQL }) → Promise<Uint8Array>`; creates the schema-11 tables, inserts col/notes/cards, exports the DB, zips with `media`. Unchecked columns → empty field (note type always has all 10 fields so templates keep working). Helpers `noteGuid`, `fieldChecksum`, `deckId` exported for tests. `APKG_FILES = ["/data/vendor/sql-wasm.wasm"]`; wasm loaded through `memo`/`markLoaded` like other loaders.
3. **`app/tools/anki/page.tsx`**: next to **Tải .tsv**, a primary button **Tải bộ thẻ Anki (.apkg)**, plus:
   - **Tên bộ thẻ** text input (default "Tiếng Trung"; `::` allowed for sub-decks).
   - **Loại thẻ** checkboxes: Nhận diện, Nhớ chữ, Câu ví dụ, Gõ chữ (default first two), labels reused from the guide's dictionary.
   - Click: `confirmDownload(APKG_FILES)` → dynamic `import("@/lib/anki/apkg")` (not in the first bundle) → `downloadBytes(…, "<deck>.apkg")`. Edited table cells are used (same `rows` as TSV). Phồn thể mode: use the shown (converted) rows, as the TSV does.
   - `lib/download.ts`: add `downloadBytes(bytes, filename, mime)`.
4. **i18n** (`vi.ts` + `en.ts`, `anki` block): `apkg`, `apkgHint` ("Mở file này bằng Anki: bộ thẻ, loại ghi chú và mẫu thẻ đã có sẵn"), `deckName`, `cardTypes`, `building`.
5. **Guide**: `/tools/anki/huong-dan` (`components/anki-guide/AnkiGuide.tsx`) gets a short "Cách nhanh nhất: file .apkg" section at the top; TSV + manual note type stays below as the advanced route. `userguide/anki.md`: new step "Tải file .apkg" and "Import file .apkg" (desktop: double-click or File → Import; AnkiDroid: open the file / Import), plus Lỗi thường gặp (re-import updates cards; renamed note type → Anki asks to map).
6. **Tests** `lib/anki/apkg.test.ts` (Vitest; sql.js runs in Node): build from `SAMPLE_ROW` + one multi-example row, unzip with fflate, open with sql.js and assert: tables exist, 1 model with 10 fields and the chosen templates, `notes.flds` split by `\x1f` equals the row, `csum` for 学习 equals a precomputed value, cards count = notes × chosen templates, `guid` stable across two builds, deck name present.

## Verification

- `pnpm test`, `pnpm run lint`, `pnpm run build`, `pnpm build:data` (wasm copied, `sizes.json` updated).
- Manual (owner, needs real apps): import the file into **Anki desktop** (current version) and **AnkiDroid**: deck appears with the right name, note type "Hán Ngữ Studio" with 4 templates, cards look like the guide's previews (light + night mode), 2–3 examples show on separate lines, Phồn thể export shows Traditional. Re-import an edited deck → notes updated, not duplicated.
- Network tab: only `/data/vendor/sql-wasm.wasm` loads on first export; nothing sent anywhere.
