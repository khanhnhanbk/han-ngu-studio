# Hán Ngữ Studio (chinese-tools-web)

A **free** tool that helps Vietnamese speakers learn and teach Chinese. Live site: https://han-ngu-studio.vercel.app/

Stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3, `pinyin-pro`. Package manager: **pnpm** (`pnpm-lock.yaml` is the tracked lockfile).

## Tools

Every tool follows the **Giản thể / Phồn thể** switch in the Navbar (`lib/script/`, see Code conventions).

| Tool | Route | Status |
|---|---|---|
| Word lookup "Tra từ" (one word or character: readings with Pinyin, Hán Việt, HSK level, part of speech, Vietnamese senses, measure words; examples; words with the same start; links to the other tools and an on-click "Tra thêm trên Hanzii" link) | `/tools/tra-tu` | Live, client-side (`lib/lookup/`, full CVDICT in `public/data/cvdict/` via `lib/cvdict/`, part of speech in `vocab.json`, labels `lib/vocab/pos.ts`) |
| Story reader "Truyện đọc" (short modern stories by HSK level, new words, Vietnamese translation hidden under each sentence, culture note; opens in Đọc hiểu via `#story=<id>`) | `/tools/stories` | Live, client-side (`lib/stories/`, content in `assets/stories/<id>.json` checked by `scripts/lib/stories.mjs`, built into `public/data/stories/`) |
| Character practice sheet (米字格 grid, Pinyin, Wubi, traceable characters, stroke-order strip) → PDF | `/tools/practice-sheet` | Live, client-side (stroke data in `public/data/strokes/`, `lib/strokes/`) |
| Stroke-order lookup (animation, step diagram, quiz) | `/tools/stroke-order` | Live, client-side (Hanzi Writer, data from `public/data/strokes/`) |
| Reader "Đọc hiểu" (words coloured by HSK level, tap-a-word card with Pinyin/Hán Việt/meanings, Smart Pinyin, 95 %-rule difficulty estimate, word table, known words, study list → Anki/Quiz/practice sheet) | `/tools/reader` | Live, client-side (`lib/reader/`, reuses `analyzeLine`, `vocabFor`, meanings; UI in `components/reader/`) |
| Word segmentation | `/tools/segment` | Live, client-side (`lib/segment/`, word list in `public/data/word_list.txt`) |
| Pinyin converter (whole-line context, ruby view, TSV) | `/tools/pinyin` | Live, client-side (`lib/pinyin/`) |
| Hán Việt (per-word readings, details panel, TSV) | `/tools/hanviet` | Live, client-side (`lib/hanviet/`, data in `public/data/hanviet.json`) |
| Anki deck generator (Pinyin, meaning, 1–3 ranked examples, Wubi, Hán Việt, HSK level, Vietnamese meaning) → `.apkg` (deck + note type + 4 templates, built in the browser by `lib/anki/apkg.ts` with sql.js, wasm in `public/data/vendor/`) or TSV; guide with 4 copy-paste card templates at `/tools/anki/huong-dan` (`lib/anki/templates.ts`, `components/anki-guide/`) | `/tools/anki` | Live, client-side (`lib/anki/`, `lib/vocab/`, `lib/examples/`, data in `public/data/{meanings,wubi,vocab}.json` and `public/data/examples/`) |
| Vocabulary quiz (meaning, Pinyin, Hán Việt, cloze, sentence ordering) → play, print, TSV | `/tools/quiz` | Live, client-side (`lib/quiz/`, sentences from `public/data/examples/` via `lib/examples/`) |
| 214 Kangxi radicals (search, variants, example characters) | `/tools/radicals` | Live, client-side (`lib/radicals/`, data in `public/data/radicals.json`) |
| Character decomposition (component tree coloured on the glyph, semantic/phonetic parts, component families, suggested memory tricks + local mnemonic notes) | `/tools/decompose` | Live, client-side (`lib/decompose/`, data in `public/data/decompose.json`, stroke→component `matches` in `public/data/strokes/`) |
| N+1 sentence ordering (one new word per sentence), with a built-in sentence bank by HSK level | `/tools/comprehensible-input` | Live, client-side (`lib/comprehensible-input/`, bank from `public/data/examples/`) |

## HARD RULES

1. **Must deploy on the Vercel Free (Hobby) plan.** Top priority. No paid features (Edge Config, KV, Postgres, Blob, etc.).
2. **NO backend, NO database.** All processing runs in the browser. No API routes, Server Actions, serverless functions or Python runtime for processing logic.
3. **Correctness over speed.** Never trade accuracy for performance.
4. **User text is never stored or sent anywhere.** Processing happens on the user's device. Exceptions: notes the user deliberately writes (memory stories on `/tools/decompose`) and the words the user marks as known in Đọc hiểu (`/tools/reader`) may be kept in that user's own browser (localStorage), never sent anywhere, with TSV export/import. The text being read is never stored. Online browser voices: only if the user explicitly turns them on in Giọng đọc (off by default), their browser sends the single clicked word to that voice provider (Google/Microsoft); never sentences. The "Tra thêm trên Hanzii" link on `/tools/tra-tu` is a plain link opened in a new tab: only the looked-up word, only when the user clicks it. Never embed or fetch Hanzii (or any other dictionary site).
5. **Static first.** Data (dictionaries, Sino-Vietnamese readings, Wubi codes) is static JSON in `public/` or imported directly. Split large files and lazy-load them.

## Commands

- `pnpm run dev`: dev server (http://localhost:3000)
- `pnpm run build`: production build. **Must succeed before any task counts as done.**
- `pnpm run lint`: lint (ESLint `next/core-web-vitals` + `next/typescript`). `next build` also lints, so **a lint error fails the Vercel deploy**.
- `pnpm test`: Vitest (`lib/**/*.test.ts`), including golden tests
- `pnpm build:audio`: one-off, re-pack the audio-cmn recordings into `public/data/audio/` (`scripts/build-audio.mjs`, pinned commit; then run `pnpm build:data` so `sizes.json` lists them)
- `pnpm build:data`: rebuild `public/data/*.json` from `assets/dictionary/` (`scripts/build-data.mjs`). Run after changing source data and commit the output.

## Porting algorithms from Python to TypeScript

Python originals are the owner's old scripts. The legacy segmentation API (`api/`) was removed after its port; see git history before that commit if needed. Raw source data lives in `assets/dictionary/`.

- Port **faithfully**. Do not "improve" an algorithm unless asked.
- Where Python and JS differ (Unicode, sorting, regex, integer division, rounding, dict ordering), match the Python output and add a comment explaining why.
- CJK outside the BMP: use `Array.from(str)` or `for...of`; never `str.length` / `str[i]` to count or split characters.
- Every port needs **golden tests** comparing against the Python output on the same inputs. Store them as JSON in `lib/<tool-name>/__golden__/` with a `source` field naming the Python file and commit.
- Pure logic goes in `lib/<tool-name>/`, separate from UI.
- Convert large data once to static JSON. No external API calls at runtime.

## Code conventions

- Strict TypeScript; avoid `any`.
- Components using browser APIs or client logic need `"use client"`.
- UI text goes through `lib/i18n`, in **both** `vi.ts` and `en.ts` (`en` is typed as `Dictionary`, so a missing key fails the build; `lib/i18n/i18n.test.ts` checks the keys match and that `en` has no stray Vietnamese). Components read it with `useDictionary()` and build internal links with `useHref()` (`lib/i18n/useLocale.ts`); never call `getDictionary("vi")` in a component.
- **English site at `/en`**: the locale comes from the URL (`localeFromPath`), Vietnamese keeps the plain paths. Every page has an `app/en/…` twin that re-exports the same page component plus English metadata (`toolMetadata` / `alternates` in `lib/i18n/metadata.ts`; Vietnamese tool folders get theirs from a small `layout.tsx`). Add both when adding a page. Tool data (Hán Việt, Vietnamese meanings, sentence translations) is not translated.
- English glossary: Phiếu tập viết = Practice sheet · Thứ tự nét = Stroke order · Chiết tự = Character breakdown · 214 bộ thủ = 214 radicals · Ngắt từ = Word segmentation · Hán Việt = Sino-Vietnamese (Hán Việt) · Tạo thẻ Anki = Anki deck builder · Trắc nghiệm = Quiz · Sắp xếp câu N+1 = N+1 sentence order · Ngũ bút = Wubi · Giản thể / Phồn thể = Simplified / Traditional · dịch máy = machine-translated · Đọc hiểu = Reader · Tra từ = Word lookup · Từ loại = Part of speech · Lượng từ = Measure words.
- Style with Tailwind, matching the existing design. Colours come from theme tokens (CSS variables in `app/globals.css`): `brand-*`, `ink-*`, `surface`, `page`. Never use raw hex or `bg-white` for surfaces; check new UI in dark mode and with another accent (theme picker: `components/ThemePicker.tsx`, `lib/theme.ts`).
- Exported files (PDF, TSV) are generated on the client.
- **Large downloads ask first.** Before loading data, call `confirmDownload(files)` (`lib/data/budget.ts`) with the site paths the action needs (loaders export them: `TOKENIZER_FILES`, `HANVIET_FILE`, `strokeFiles()`, `exampleFiles()`…). It prompts (`components/DownloadPrompt.tsx`) only when the not-yet-downloaded part exceeds 2 MB gzip, using `public/data/sizes.json` from `pnpm build:data`. New data files get into `sizes.json` automatically; new loaders must use `memoJson` (or call `markLoaded`).
- **Giản thể / Phồn thể** (`lib/script/`, switch in the Navbar): pipelines and data stay Simplified. Pages convert at their boundary with `useConverter()`: `conv.toSimp(input)` into the pipeline, `conv.toShown(...)` and `createAligner` for what is shown/exported. In Giản thể mode both are the identity, so existing behaviour never changes. `t2cn` is not a no-op on Simplified text (著, 么, 乾), so `toSimp` only converts text that has non-shared Traditional characters (`SHARED_CHARS`).

## Folder structure

- `app/`: pages (`page.tsx` landing, `tools/practice-sheet/`, `tools/segment/`)
- `components/`: landing-page sections (Hero, Features, FAQ, …) and `practice-sheet/` tool UI
- `lib/`: client logic (`practiceSheet.ts`, `segment/`, `i18n/`)
- `public/data/`: static data files fetched at runtime
- `assets/dictionary/`: raw source data (CSV/TSV) for future data builds
- `docs/plans/`: implementation plans (see below)
- `userguide/`: end-user guide in Vietnamese, one page per tool. Lives on GitHub only (not served, listed in `.vercelignore`).

## Plans

- Plan mode saves plans to `docs/plans/` (set via `plansDirectory` in `.claude/settings.json`).
- For plans written outside plan mode, also save them in `docs/plans/` as `<YYYY-MM-DD>-<topic>.md`.

## Data sources and credits

- Meanings: CC-CEDICT (CC BY-SA 4.0) for English. HSK 3.0 levels and Pinyin: the Ministry of Education list (GF 0025-2021) via ivankra/hsk30 (MIT, `assets/dictionary/LICENSE-hsk30.txt`); Vietnamese meanings: CVDICT by Phong Phan (CC BY-SA 4.0, machine-translated from CC-CEDICT and reviewed, `assets/dictionary/LICENSE-cvdict.txt`). Joined once by `pnpm build:vocab-source` (`scripts/build-vocab-source.mjs`, pinned commits; CVDICT parsing in `scripts/lib/cvdict.mjs`) into `assets/dictionary/vocab_hsk30.csv` (level, Pinyin, meaning, HSK `pos`, CVDICT measure words) → `public/data/vocab.json`, looked up with `lib/vocab/`. The same run writes the whole of CVDICT to `assets/dictionary/cvdict.tsv`, which `pnpm build:data` shards by first character into `public/data/cvdict/<n>.json` (64 shards, `CVDICT_SHARDS` in `lib/cvdict/lookup.ts` must match). Never ship data scraped from other sites (the earlier xiehanzi.com list was removed for that reason). Wubi 86: pywubi 0.3.0 table (MIT, `assets/dictionary/LICENSE-pywubi.txt`). Example sentences: owner's own data (`sentences.tsv`) plus Tatoeba (CC BY 2.0 FR, `assets/dictionary/100000sentences.csv`), merged by `pnpm build:data` into word-sharded `public/data/examples/` and ranked in the browser (`lib/examples/rank.ts`). Tatoeba translations are Google Translate output, made **once, offline** by `scripts/translate-sentences.mjs` (needs `GOOGLE_TRANSLATE_API_KEY`, resumable) into `assets/dictionary/sentences_tatoeba_mt.tsv`, and flagged as machine-translated in the UI. Never call a translation service at runtime.
- Sheet fonts: LXGW WenKai TC, Ma Shan Zheng, Noto Serif SC/TC, Noto Sans SC/TC (SIL OFL), self-hosted by `next/font/google` (`app/layout.tsx`, `app/tools/practice-sheet/fonts.ts`). User-uploaded fonts are loaded with `FontFace` in the browser only.
- Stroke order: Hanzi Writer 3.7.3 (MIT) for animation/quiz, with `charDataLoader` reading our own files (never its CDN). Characters and words passed between pages go in the URL hash (`#c=`, `#chars=…&strokes=1`, `#words=…` read by Anki and Quiz via `lib/reader/handoff.ts`), never the query string, so they are not sent to the server.
- Stroke data: hanzi-writer-data 2.0.1, derived from Make Me a Hanzi (Arphic Public License, `assets/dictionary/LICENSE-arphic.txt`). Built by `pnpm build:data` from the pinned devDependency into 8-code-point shards `public/data/strokes/<hex>.json` (about 11 KB each; `SHARD_BITS` in `lib/strokes/load.ts` must match).
- Radicals: names and meanings in `assets/dictionary/radicals.tsv` are our own curation, checked against PREP's list (prepedu.com) with its typos fixed. Characters per radical come from Unicode Unihan `kRSUnicode` (Unicode License v3, `assets/dictionary/LICENSE-unicode.txt`), extracted once to `assets/dictionary/unihan_radicals.tsv`.
- Character decomposition: Make Me a Hanzi `dictionary.txt` (LGPL-3.0+, `assets/dictionary/makemeahanzi-dictionary.txt`, licence and pinned commit in `assets/dictionary/LICENSE-makemeahanzi-lgpl.txt`): IDS, etymology (pictophonetic semantic/phonetic parts) and per-stroke `matches`. Built by `pnpm build:data` into `public/data/decompose.json` (keys in frequency order) and the stroke shards.
- Traditional conversion: OpenCC dictionaries (Apache-2.0) via `opencc-js` 1.4.2 (MIT), lazy-loaded in the browser only in Phồn thể mode (Taiwan characters, `cn`↔`tw`, no vocabulary swaps). Phồn thể glyphs: Noto Sans TC / Noto Serif TC (SIL OFL). `radicals.json` also carries Taiwan-character lists (`charsTrad`, `membersTrad`, `countTrad`), built by `pnpm build:data` with opencc-js.
- Pronunciation: human recordings from audio-cmn (CC BY-SA; words by Yue Tan, syllables by Chen Wang; `assets/dictionary/LICENSE-audio-cmn.txt`), packed into 32 KB shards + a split index (`index-w-<0..31>.json` by FNV-1a hash of the word, `index-s.json` for syllables) in `public/data/audio/`, left out of `sizes.json`. **Off by default** (`enabled` in `lib/speech/prefs.ts`, turned on per device with `SpeechToggle`): until then no 🔊 shows and nothing loads; a click fetches one ~3 KB index part + one shard. `lib/speech/` picks the sound (`resolveSound`: in-context single character → syllable for that reading; else the word's recording; else device voice via Web Speech, offline voices only unless allowed; last resort the chained syllables). 🔊 buttons (`components/speech/SpeakButton.tsx`) are for words and characters only, never sentences; the settings dialog loads lazily through `SpeechSettingsHost` (root layout) and lists free tools for whole paragraphs (Edge Read aloud, Speak Selection, Select to Speak, Google Dịch) instead of building paragraph TTS.
- Hán Việt readings: `char_hanviet.csv` is ph0ngp/hanviet-pinyin-wordlist (MIT, `assets/dictionary/LICENSE-hanviet-pinyin-wordlist.txt`) with some readings edited. Frequency order: SUBTLEX-CH (Cai & Brysbaert 2010, no licence, cite it); only ranks are committed (`frequency` in `char_hanviet.csv` is a rank, higher = more common; `word_list.txt` = CC-CEDICT headwords in SUBTLEX-CH order). Never commit the raw frequency figures.
- Suggested memory stories ("Gợi ý ghi nhớ" in `/tools/decompose`): our own content in `assets/dictionary/mnemonics.tsv` (`char`, `story`, `status` draft|reviewed, `kind` goc|meo, `source`), drafted offline with AI help and reviewed by the owner. `goc` = explained from the real origin and must name a `source` (badge "Theo nguồn gốc"); `meo` = made-up memory trick (badge "Mẹo nhớ"); never present a `meo` story as history; checked by `scripts/lib/mnemonics.mjs` (story shows the char and every top-level IDS part, ≤ 160 chars) and built into `public/data/mnemonics.json`. Unreviewed stories are labelled in the UI. Never generate them at runtime.
- Corrections from readers: "Góp ý" links (`lib/feedback.ts`) open a pre-filled new GitHub issue with only our content (story id/title, character + suggested trick), never the learner's notes or text; nothing is sent until the reader submits on GitHub. Footer has a general "Góp ý / báo lỗi (GitHub)" link.
- Every dataset is listed in `THIRD-PARTY-NOTICES.md` and on `/giay-phep` (`lib/legal/sources.ts`); update both when data changes.
- Keep these credits visible on the pages that use the data and in `userguide/`.

## User guide

- Every user-facing tool change must update its page in `userguide/` (and the index in `userguide/README.md`).
- Write it in Vietnamese, step by step, quoting the **exact** UI labels from `lib/i18n/vi.ts`, and keep a "Lỗi thường gặp" section.

## Notes

- The landing page shows only what exists: live tools in `Features`, grouped by `TOOL_GROUPS` in `lib/links.ts` (Chữ Hán / Đọc văn bản / Từ vựng & ôn tập; names and one-line menu hints in `nav.groups` / `nav.hints` of `lib/i18n/vi.ts`), upcoming work in `Roadmap` (follows `docs/plans/2026-10-15-roadmap.md`). When a phase ships, move it from Roadmap to Features by adding the tool to a group (the Navbar menu and Footer read the same groups).
- The old "Get notified" email form, invented testimonials and the "Pro" pricing plan were removed. Do not add sign-up forms that need a backend.
- Do not invent statistics, reviews or features that do not exist in the UI.
