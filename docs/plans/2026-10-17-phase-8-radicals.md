# Phase 8: radical reference (`/tools/radicals`)

Idea taken from https://hoctiengtrung-123.pages.dev/ (ideas only, no code or content). Overview: [https-hoctiengtrung-123-pages-dev-learn-golden-volcano](https-hoctiengtrung-123-pages-dev-learn-golden-volcano.md).

## Phase 8: `/tools/radicals`, the 214 Kangxi radicals

**Data**:
- `assets/dictionary/radicals.tsv` (new, our own content). Columns: `no, radical, variants, strokes,
  hanviet_name, meaning_vi, pinyin`.
  - `radical`: the unified ideograph = NFKC of U+2F00–U+2FD5.
  - `strokes`: comes from the Kangxi numbering.
  - `hanviet_name`: look up `hanviet.json`. 23 radicals are traditional forms not in it (門, 馬,
    魚, 龍…), so look them up via `trad_char` → `simp_char` in `char_hanviet.csv`.
  - `pinyin`: from pinyin-pro.
  - `meaning_vi`: written by hand. **The owner must review it** (correctness rule).
  - A generator script fills every column it can and leaves `meaning_vi` for hand editing.
- Characters per radical: extract `kRSUnicode` from Unicode **Unihan** (Unicode License v3,
  permissive). Keep only characters in `char_hanviet.csv`, and commit the slim extract as
  `assets/dictionary/unihan_radicals.tsv` with `LICENSE-unicode.txt`.
- `scripts/build-data.mjs` writes `public/data/radicals.json`:
  `[{no, radical, variants, strokes, hv, vi, py, chars: [top 12 by frequency]}]`, ~60 KB.

**UI** in `app/tools/radicals/page.tsx`:
- A grid grouped by stroke count (1–17). Search by character, Hán Việt name (accent-insensitive)
  or meaning.
- Click a radical for details: variants (氵 for 水, 扌 for 手…), name, meaning, Pinyin, and example
  characters with their Hán Việt reading.
- Each character links to `/tools/stroke-order#c=<char>` (hash, never the query string, per
  CLAUDE.md).
- "Tạo vở luyện viết" sends the selected radicals to the practice sheet via the existing
  `#chars=…` hash.

**Tests**:
- `lib/radicals/radicals.test.ts`: 214 entries, numbers 1–214 in order, strokes never decrease, every
  `hv` non-empty, every `radical` equals the NFKC of its code point.
- Search normalises Vietnamese diacritics.

Docs: `userguide/radicals.md` and the README index. Credit Unihan and Make Me a Hanzi (stroke order)
on the page.

## Verification (every phase)

- `pnpm test`, `pnpm run lint`, `pnpm run build`, all passing.
- Manual check with `pnpm run dev`:
  - Quiz: paste ~10 HSK1 words, run all question types, get some wrong and use "Làm lại câu sai".
    Check the print preview and open the TSV.
  - Radicals: search "thủy" and find 水 with variant 氵; the stroke-order link opens with the right
    character.
- DevTools Network: only `/data/*.json` requests, nothing external.
- Check light and dark mode and a second accent (ThemePicker), at mobile width.
- Update the landing page: Roadmap → Features once shipped.
