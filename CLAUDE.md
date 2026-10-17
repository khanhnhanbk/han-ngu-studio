# Hán Ngữ Studio (chinese-tools-web)

A **free** tool that helps Vietnamese speakers learn and teach Chinese. Live site: https://han-ngu-studio.vercel.app/

Stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3, `pinyin-pro`. Package manager: **pnpm** (`pnpm-lock.yaml` is the tracked lockfile).

## Tools

| Tool | Route | Status |
|---|---|---|
| Character practice sheet (米字格 grid, Pinyin, Wubi, traceable characters, stroke-order strip) → PDF | `/tools/practice-sheet` | Live, client-side (stroke data in `public/data/strokes/`, `lib/strokes/`) |
| Stroke-order lookup (animation, step diagram, quiz) | `/tools/stroke-order` | Live, client-side (Hanzi Writer, data from `public/data/strokes/`) |
| Word segmentation | `/tools/segment` | Live, client-side (`lib/segment/`, word list in `public/data/word_list.txt`) |
| Pinyin converter (whole-line context, ruby view, TSV) | `/tools/pinyin` | Live, client-side (`lib/pinyin/`) |
| Hán Việt (per-word readings, details panel, TSV) | `/tools/hanviet` | Live, client-side (`lib/hanviet/`, data in `public/data/hanviet.json`) |
| Anki deck generator (Pinyin, meaning, example, Wubi, Hán Việt) → TSV | `/tools/anki` | Live, client-side (`lib/anki/`, data in `public/data/{meanings,sentences,wubi}.json`) |
| Cloze exercise generator | | Not built |
| N+1 sentence ordering (one new word per sentence) | `/tools/comprehensible-input` | Live, client-side |

## HARD RULES

1. **Must deploy on the Vercel Free (Hobby) plan.** Top priority. No paid features (Edge Config, KV, Postgres, Blob, etc.).
2. **NO backend, NO database.** All processing runs in the browser. No API routes, Server Actions, serverless functions or Python runtime for processing logic.
3. **Correctness over speed.** Never trade accuracy for performance.
4. **User text is never stored or sent anywhere.** Processing happens on the user's device.
5. **Static first.** Data (dictionaries, Sino-Vietnamese readings, Wubi codes) is static JSON in `public/` or imported directly. Split large files and lazy-load them.

## Commands

- `pnpm run dev`: dev server (http://localhost:3000)
- `pnpm run build`: production build. **Must succeed before any task counts as done.**
- `pnpm run lint`: lint (ESLint `next/core-web-vitals` + `next/typescript`). `next build` also lints, so **a lint error fails the Vercel deploy**.
- `pnpm test`: Vitest (`lib/**/*.test.ts`), including golden tests
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
- UI text is **Vietnamese** and goes through `lib/i18n` (`getDictionary`). English currently falls back to Vietnamese; add `lib/i18n/en.ts` when translating.
- Style with Tailwind, matching the existing design. Colours come from theme tokens (CSS variables in `app/globals.css`): `brand-*`, `ink-*`, `surface`, `page`. Never use raw hex or `bg-white` for surfaces; check new UI in dark mode and with another accent (theme picker: `components/ThemePicker.tsx`, `lib/theme.ts`).
- Exported files (PDF, TSV) are generated on the client.

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

- Meanings: CC-CEDICT (CC BY-SA 4.0). Wubi 86: pywubi 0.3.0 table (MIT, `assets/dictionary/LICENSE-pywubi.txt`). Example sentences: owner's own data.
- Sheet fonts: LXGW WenKai TC, Ma Shan Zheng, Noto Serif SC, Noto Sans SC (SIL OFL), self-hosted by `next/font/google` (`app/layout.tsx`, `app/tools/practice-sheet/fonts.ts`). User-uploaded fonts are loaded with `FontFace` in the browser only.
- Stroke order: Hanzi Writer 3.7.3 (MIT) for animation/quiz, with `charDataLoader` reading our own files (never its CDN). Characters passed between pages go in the URL hash (`#c=`, `#chars=…&strokes=1`), never the query string, so they are not sent to the server.
- Stroke data: hanzi-writer-data 2.0.1, derived from Make Me a Hanzi (Arphic Public License, `assets/dictionary/LICENSE-arphic.txt`). Built by `pnpm build:data` from the pinned devDependency into 64-code-point shards `public/data/strokes/<hex>.json`.
- Keep these credits visible on the pages that use the data and in `userguide/`.

## User guide

- Every user-facing tool change must update its page in `userguide/` (and the index in `userguide/README.md`).
- Write it in Vietnamese, step by step, quoting the **exact** UI labels from `lib/i18n/vi.ts`, and keep a "Lỗi thường gặp" section.

## Notes

- The landing page shows only what exists: live tools in `Features` (from `TOOLS` in `lib/links.ts`), upcoming work in `Roadmap` (follows `docs/plans/2026-10-15-roadmap.md`). When a phase ships, move it from Roadmap to Features (and the Navbar/Footer get it from `TOOLS`).
- The old "Get notified" email form, invented testimonials and the "Pro" pricing plan were removed. Do not add sign-up forms that need a backend.
- Do not invent statistics, reviews or features that do not exist in the UI.
