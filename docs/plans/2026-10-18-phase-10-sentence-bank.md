# Phase 10: Example-sentence bank (Tatoeba) for Anki, Quiz and N+1

## Context

The owner added `assets/dictionary/100000sentences.csv` (`level,word,sentence,source`). It has 61,536 rows, ≈31.5k unique sentences, every one from Tatoeba (`tatoeba:<id>`), and covers 8,961 HSK 3.0 words, up to 15 sentences each. Today `sentences.json` (from the 4.6k-row `sentences.tsv`) gives **one** sentence to only 3,793 words, so most Anki cards and quiz words get no example and no cloze/ordering questions.

The new file has **no translation and no Pinyin**. Owner's decisions:

1. Pinyin comes from our own converter at runtime (`convertLine`, as Anki already does for `sentence_pinyin`). It is not stored.
2. Vietnamese and English come from **Google Translate**, done **once, offline, at data-build time** by the owner, and committed as static data. Nothing is translated at runtime, so hard rules 2, 4 and 5 still hold. These translations are machine output, so they are labelled as such.
3. Old and new sentences are **ranked together**. Each word gets its easiest sentence, not the first one in file order.
4. Scope: Anki (more and easier examples), Quiz (more cloze/ordering questions, varied across runs), N+1 (built-in sentence bank by HSK level).
5. **Traditional Chinese** is not built now. It is only added to the landing-page Roadmap as "Dự kiến".

Data issues found in the file, all handled in the build:
- 1,436 sentences use ASCII `, . ? !` (`"王小明说英语,但英语书不多."`). Convert ASCII punctuation next to CJK to full width.
- Word keys such as `好玩{儿}` do not occur in their sentences. Strip `{…}` to get the key and look the word up in its sentence. Drop any row whose word is still not a substring (302 rows before the fix).
- ≈30k rows repeat a sentence under another word. Store each sentence once and index it from every word.
- Tatoeba is licensed CC BY 2.0 FR, so credit it on every page that shows its sentences.

## 10a: Translations and data build

**`scripts/translate-sentences.mjs`** (run by hand, not part of `build:data`)
- Reads the unique normalised sentences from the CSV and translates them to `vi` and `en` with Google Cloud Translation v2 REST (`GOOGLE_TRANSLATE_API_KEY` env var, `source=zh-CN`, 100 strings per request, `format=text`).
- **Resumable cache**: append to `assets/dictionary/sentences_tatoeba_mt.tsv` (`tatoeba_id\thanzi\tvi\ten`). Skip IDs that are already done, so a quota stop or crash loses nothing.
- Volume is 472k characters per language, 945k billed in total (measured). The Cloud free tier is 500k characters a month, so expect about $9, or two months of free tier with `--limit`. Print the character count and ask for confirmation before the first request.
- Commit the TSV. The script never runs in CI or on Vercel.

**`scripts/build-data.mjs`: new `buildExamples()`**
- Merges `sentences.tsv` rows (human `vi`/`en`, keys from `NewWord`, keeping the existing `HANVIET_NOT_TRANSLATION` guard) with the Tatoeba CSV joined to `sentences_tatoeba_mt.tsv`. Normalises punctuation, strips `{儿}`, drops rows where the word is missing, dedupes by sentence text, and keeps rows with no translation yet (vi/en empty) so the build still works before the script has run.
- Output `public/data/examples/`:
  - `<shard>.json`: `{ rows: [[hanzi, vi, en, flags]], index: { word: rowIds[] } }`. `flags` bit 1 means machine-translated. Shard by the word's lowest HSK level (`1`…`7-9`) taken from `vocab_hsk_vi.csv`, plus `other` for non-HSK words from the old TSV. Any shard over 1 MB is split into parts (`7-9.0`, `7-9.1`), the way `MAX_SHARD_BYTES` works for strokes.
  - `manifest.json`: `{ shards: { name: level }, words: { word: shard } }`.
- Keep building `sentences.json` unchanged until 10b switches its callers, then delete it and `buildSentences()`.

**`lib/examples/`** (new, pure logic)
- `load.ts`: `loadManifest()` and `loadShards(names)`, built on `memoJson` (export it from `lib/anki/load.ts` or move it to `lib/download.ts`'s neighbour `lib/fetchJson.ts`). Exports `examplesFor(words)`, which fetches only the shards those words live in.
- `rank.ts`: `rankExamples(word, candidates, { tokenizer, vocab })`. It segments each sentence with `segment()` (`lib/segment/tokenizer.ts`), gives each other token its lowest level via `vocabFor` (`lib/vocab/lookup.ts`), and counts non-HSK tokens and names (汤姆) as level 10. Sort key, in order: (number of tokens above the word's level, highest other-token level, has a human translation first, character count via `Array.from`, then row id). The result is deterministic.
- Tests: `rank.test.ts` (an easy sentence beats a hard one, ties are stable, astral characters), and a build test in `lib/examples/examples.test.ts` that checks the shards on disk: no shard over 1.5 MB, every indexed word occurs in its sentences, punctuation is normalised, `好玩` resolves.

## 10b: Anki and Quiz

**Anki** (`lib/anki/buildDeck.ts`, `app/tools/anki/page.tsx`)
- `DeckData.sentences` becomes `examples` (per-word candidates). `buildRow` takes the top-ranked sentence. The pinyin is still `convertLine(..., { toneStyle: "mark", spacing: "word" })` and the meaning is still `vi || en`.
- New option **"Số câu ví dụ" (1 / 2 / 3)**, default 1. With 2 or 3, the top-k sentences are joined with `<br>` in `sentence`, `sentence_pinyin` and `sentence_meaning`, aligned line by line (Anki renders the HTML). The preview table splits on `<br>`.
- **Golden tests**: `__golden__/deck.json` encodes `anki_desk.py`'s first-match rule, which this phase deliberately changes (owner decision). Keep the golden assertions for every non-sentence column. Move the sentence assertions to new expectations, with a comment citing this plan. The existing `呢` Pinyin test and the AI-refusal-row test must still pass.

**Quiz** (`lib/quiz/build.ts`)
- `QuizData.sentences` becomes `examples`. `sentenceFor(data, word, rng)` picks at random among the top 3 ranked candidates that contain the word and have a hint, so repeated quizzes use different sentences. The cloze/ordering rules are unchanged (`BLANK`, `MAX_ORDER_TOKENS`, no option already in the sentence).
- Update `build.test.ts` fixtures to the new data shape.

**Shared UI**: the credit line on both pages gains "Câu ví dụ: Tatoeba (CC BY 2.0 FR); bản dịch máy: Google Dịch". Cards or questions built from a machine-translated row show a small "dịch máy" tag in the preview. All strings go in `lib/i18n/vi.ts`.

## 10c: N+1 sentence bank and landing page

**N+1** (`app/tools/comprehensible-input/page.tsx`)
- Next to the sentence textarea, add **"Lấy câu mẫu"**: pick an HSK level (1…7-9) and a count (50/100/200). It loads that level's shard(s) with `loadShards` and fills the textarea with distinct sentences (rows indexed from that level's words, shortest first). The user can still edit the text, and the existing ordering pipeline (`lib/comprehensible-input/`) is unchanged.
- Optional "Từ đã biết" prefill: all HSK words below the chosen level (from `vocab.json`). Off by default.

**Landing page**
- `lib/i18n/vi.ts` `roadmap.items`: add `{ status: "planned", title: "Chữ phồn thể", description: "Chuyển toàn bộ công cụ sang chữ phồn thể (Đài Loan): Pinyin, Hán Việt, phiếu tập viết, thẻ Anki và trắc nghiệm đều đúng với chữ phồn thể." }`.
- Update the `features` descriptions for Anki, Quiz and N+1 only to state what now exists (examples for ~9k HSK words; N+1 sentence bank). No new statistics beyond counts printed by the build.

**Docs and credits**
- CLAUDE.md "Data sources and credits": Tatoeba (CC BY 2.0 FR) and Google Translate machine translations (offline, `scripts/translate-sentences.mjs`). Also update the tools table rows for anki/quiz/comprehensible-input.
- `userguide/` pages for anki, quiz and comprehensible-input, plus `README.md` credits, with exact labels and "Lỗi thường gặp" entries (e.g. "Bản dịch máy có thể chưa chính xác").

## Critical files

- `scripts/build-data.mjs`, new `scripts/translate-sentences.mjs`, new `assets/dictionary/sentences_tatoeba_mt.tsv`
- new `lib/examples/{load,rank}.ts` + tests; `lib/anki/{load,buildDeck}.ts`, `lib/anki/anki.test.ts`; `lib/quiz/build.ts`, `build.test.ts`
- `app/tools/{anki,quiz,comprehensible-input}/page.tsx`, `lib/i18n/vi.ts`
- `docs/plans/2026-10-15-roadmap.md`, `CLAUDE.md`, `userguide/*`

Reuse: `memoJson` (`lib/anki/load.ts`), `segment` (`lib/segment/tokenizer.ts`), `vocabFor` (`lib/vocab/lookup.ts`), `convertLine` (`lib/pinyin/convert.ts`), `rng`/`shuffle` (`lib/quiz/rng.ts`), the stroke-shard size guard pattern in `build-data.mjs`.

## Verification

1. `node scripts/translate-sentences.mjs` on a 200-sentence dry run (`--limit 200`). Check that the TSV resumes after an interrupt.
2. `pnpm build:data`. Shard sizes are printed, all under 1.5 MB, and the manifest word count is ≈9.5k.
3. `pnpm test` (rank, examples data, anki, quiz), `pnpm run lint`, `pnpm run build`.
4. `pnpm run dev`:
   - Anki: paste an HSK 5 list; nearly every row has an example; "Số câu ví dụ = 3" exports aligned `<br>` lines; import the TSV into Anki.
   - Quiz: generate the same list twice; cloze sentences differ.
   - N+1: "Lấy câu mẫu" HSK 2 × 100, then sort.
   - Check that the Network tab fetches only the needed shards and no translation endpoint. Check dark mode and another accent, and that the landing Roadmap shows "Chữ phồn thể".
