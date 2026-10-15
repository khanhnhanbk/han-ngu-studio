# Hán Ngữ Studio (chinese-tools-web)

A **free** tool that helps Vietnamese speakers learn and teach Chinese. Live site: https://han-ngu-studio.vercel.app/

Stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 3, `pinyin-pro`. Package manager: **npm** (`package-lock.json` is the tracked lockfile).

## Tools

| Tool | Route | Status |
|---|---|---|
| Character practice sheet (米字格 grid, Pinyin, Wubi, traceable characters) → PDF | `/tools/practice-sheet` | Live, client-side |
| Word segmentation | `/tools/segment` | Live, but **still calls the legacy Python API** (`/api/py/segment`). Must be ported to TS. |
| Anki deck generator (Pinyin, meaning, Sino-Vietnamese, examples) → TSV | | Not built |
| Cloze exercise generator | | Not built |
| N+1 sentence ordering (one new word per sentence) | | Not built |

## HARD RULES

1. **Must deploy on the Vercel Free (Hobby) plan.** Top priority. No paid features (Edge Config, KV, Postgres, Blob, etc.).
2. **NO backend, NO database.** All processing runs in the browser. No API routes, Server Actions, serverless functions or Python runtime for processing logic.
3. **Correctness over speed.** Never trade accuracy for performance.
4. **User text is never stored or sent anywhere.** Processing happens on the user's device.
5. **Static first.** Data (dictionaries, Sino-Vietnamese readings, Wubi codes) is static JSON in `public/` or imported directly. Split large files and lazy-load them.

## Commands

- `npm run dev`: dev server (http://localhost:3000)
- `npm run build`: production build. **Must succeed before any task counts as done.**
- `npm run lint`: lint
- `npm run dev:api`: **legacy** Python API (uvicorn, port 8000), only needed for `/tools/segment` until it is ported. Do not add code that depends on it.
- No JS test runner is set up yet. Add one (e.g. Vitest) when the first golden test is written.

## Porting algorithms from Python to TypeScript

Python originals live in `api/_core/` (tests in `api/tests/`, data in `api/data/`).

- Port **faithfully**. Do not "improve" an algorithm unless asked.
- Where Python and JS differ (Unicode, sorting, regex, integer division, rounding, dict ordering), match the Python output and add a comment explaining why.
- CJK outside the BMP: use `Array.from(str)` or `for...of`; never `str.length` / `str[i]` to count or split characters.
- Every port needs **golden tests** comparing against the Python output on the same inputs.
- Pure logic goes in `lib/<tool-name>/`, separate from UI.
- Convert large data once to static JSON. No external API calls at runtime.
- After a port, remove the matching legacy code: the Python file, the `/api/py` rewrite in `next.config.js`, the function in `vercel.json`, `lib/api.ts` if unused, and `requirements.txt` once `api/` is empty.

## Code conventions

- Strict TypeScript; avoid `any`.
- Components using browser APIs or client logic need `"use client"`.
- UI text is **Vietnamese** and goes through `lib/i18n` (`getDictionary`). English currently falls back to Vietnamese; add `lib/i18n/en.ts` when translating.
- Style with Tailwind, matching the existing design.
- Exported files (PDF, TSV) are generated on the client.

## Folder structure

- `app/`: pages (`page.tsx` landing, `tools/practice-sheet/`, `tools/segment/`)
- `components/`: landing-page sections (Hero, Features, FAQ, …) and `practice-sheet/` tool UI
- `lib/`: client logic (`practiceSheet.ts`, `i18n/`, `api.ts` legacy fetch helper)
- `api/`: legacy Python code (FastAPI + tokenizer). To be removed.
- `docs/plans/`: implementation plans (see below)

## Plans

- Plan mode saves plans to `docs/plans/` (set via `plansDirectory` in `.claude/settings.json`).
- For plans written outside plan mode, also save them in `docs/plans/` as `<YYYY-MM-DD>-<topic>.md`.

## Notes

- The "Get notified" form has no backend. Use a free external form service or remove it; never build a backend for it.
- Do not invent statistics, reviews or features that do not exist in the UI.
