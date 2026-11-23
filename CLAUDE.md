# Hán Ngữ Studio

Free browser tools for Vietnamese people who learn and teach Chinese. Live: https://han-ngu-studio.vercel.app/ (vi at `/`, English at `/en`).
Next.js 15 App Router, React 19, TypeScript strict, Tailwind 3, **pnpm**. 100% AI-coded: Novian does not read the code.
Version `0.1.0`, no tag yet (see Release). Human product notes (vi): `/home/novian/learning-myself/cong-viec/san-pham/han-ngu-studio/README.md`.

## Read when needed (not every round)
- `BACKLOG.md`: read at the start of each round (see Working rule).
- `docs/tools.md`: every tool, its route, features and code folders. Read before changing a tool.
- `docs/data-sources.md`: datasets, licences, how each data file is built, Python→TS porting rules (golden tests). Read before touching `assets/`, `public/data/`, `scripts/build-*`, credits or a port.
- `docs/site-notes.md`: home page rules, teacher guide, link previews (OG), sitemap, JSON-LD, `userguide/` rules. Read before adding a page or a big feature.
- `docs/ui-rules.md`: UI checklist. Run it before screenshots.
- `docs/plans/`: plans (`<YYYY-MM-DD>-<topic>.md`; plan mode saves here too).

## Working rule (Novian, 2026-11-22)
- A message from Novian about the app is a NOTE by default: answer, investigate if cheap, record it in `BACKLOG.md` `## Open` (newest first, `- **Title (who, date):** cause + fix idea`) in a PR. Change app code only when he says do/fix. Shipped → move to `## Done (<date>)`.
- Edit `BACKLOG.md` one entry at a time (cut from its `- **` line to the next `- **` / `## `, never slice up to `## Done`); `git diff BACKLOG.md | grep '^-'` must show only that entry.

## HARD RULES
1. **Vercel Hobby (free) only.** No paid features (KV, Postgres, Blob, Edge Config…).
2. **No backend, no database.** Everything runs in the browser: no API routes, Server Actions, functions.
3. **Correctness over speed.**
4. **User text is never stored or sent.** Allowed exceptions, all in the user's own localStorage, never sent: memory notes (`/tools/decompose`), known words (`/tools/reader`), "đã học" ticks (`/tools/path`), lessons (`/lesson`). Text read in other tools is never stored. Words/characters passed between pages go in the URL **hash**, never the query string. Outbound only on a user action: online voices (opt-in, one clicked word, never sentences); Anki pictures (consent box per visit, one English keyword per word to Openverse, `lib/anki/images.ts`); "Tra thêm trên Hanzii" plain link (never embed/fetch any dictionary site); YouTube tutorials as plain links in `lib/videos.ts` (never an embedded player). Full per-feature wording: end of `docs/tools.md`. Analytics: Vercel Web Analytics via `components/SiteAnalytics.tsx`, URL cut at `?`/`#`, no custom events with user text.
5. **Static first.** Data is static JSON in `public/data/`, sharded and lazy-loaded. No external API or translation call at runtime. Never ship data scraped from other sites. A new dataset goes into `THIRD-PARTY-NOTICES.md` and `/licenses` (`lib/legal/sources.ts`).

## Commands
- `pnpm run dev` → http://localhost:3000
- **`pnpm check` before calling anything done** (~2 min): `pnpm test` (Vitest, golden tests) → `lint` → `build` → `check:smoke` (`scripts/check/smoke.mjs`: every sitemap page + hidden tools, vi and `/en`, first visit in system Chrome via playwright-core, never `playwright install`; fails on non-200, console/page error, broken image, large-download prompt; ignores only the local `/_vercel/insights/script.js` 404; plus /lesson paste-handout flow). A lint error fails the Vercel deploy.
- `pnpm shots [paths…]` (after a fresh build): home, /lesson with handout, every `TOOL_GROUPS` tool × 1440/390 × light/dark → `shots/` (gitignored). Look at the relevant ones, attach to the PR.
- `pnpm build:data` after changing `assets/`; commit the output. Then `UPDATE_SAMPLES=1 pnpm test` if it changed the first-visit samples (`lib/{lookup,lesson}/sample.json`).
- `pnpm perf --label <name>`: speed lab, results in `docs/perf/`.
- `pnpm audit`: keep 0 high/critical.
- Deploy = Vercel Git: PR → Preview, merge to `main` → Production (`pnpm ship` does merge + verify). Manual verify: `gh api repos/khanhnhanbk/han-ngu-studio/deployments --jq '.[0] | [.environment, .sha[0:7]]'` shows Production on the new sha; `/`, `/en`, `/lesson`, `/sitemap.xml` return 200.

## Code conventions
- Pure logic (no React/DOM) in `lib/<tool>/` with tests; UI in `components/<tool>/`; pages in `app/` with an `app/en/…` twin for every page. Split a mixed component only when touching it anyway, never a refactor-only PR.
- `"use client"` for browser code. Avoid `any`. CJK: `Array.from(str)` / `for…of`, never `str.length` / `str[i]`.
- UI text only via `lib/i18n` in both `vi.ts` and `en.ts` (missing key fails the build); `useDictionary()`, `useHref()`; never `getDictionary("vi")` in a component. English names: glossary at the end of `docs/tools.md`.
- Routes are English. Renaming a route → add old path + `/en` twin to `redirects()` in `next.config.js`.
- Tailwind with theme tokens only (`brand-*`, `ink-*`, `surface`, `page`); no hex, no `bg-white`. Check dark mode and another accent (`components/ThemePicker.tsx`).
- Exports (PDF, TSV, .apkg, .pptx) are made in the browser.
- Large downloads ask first: call `confirmDownload(files)` (`lib/data/budget.ts`) before loading data; new loaders use `memoJson`.
- Giản/Phồn: pipelines and data stay Simplified; pages convert at the boundary with `useConverter()` (`toSimp` in, `toShown` out). Details in `docs/tools.md`.
- Tool lists live in `lib/links.ts` (`TOOL_GROUPS`, `HIDDEN_TOOLS`); menu, footer, home, smoke and shots all read them.
- A user-facing change updates its `userguide/` page (exact labels from `lib/i18n/vi.ts`). A big feature also updates the home page in the same PR (rules in `docs/site-notes.md`). Never invent stats, reviews or features; no sign-up forms.

## Git, PR, release
- One PR per change from latest `main`, never commit to `main`. PR has screenshots (or command output when nothing visual changed). No stacked PRs.
- Claude squash-merges its own PR on green checks with **`pnpm ship [pr]`** (`scripts/ship.mjs`): waits for checks → squash-merge + delete branch → local `main` pulled → waits for Production on the new sha → live `/`, `/en`, `/lesson`, `/sitemap.xml` = 200. One line per step, timeouts, exit 1 on failure.
- Release, only when Novian says a version is accepted: PR `Release vX.Y.Z` bumps `package.json` (new feature → minor, fixes → patch) and adds a `CHANGELOG.md` entry (1–5 Vietnamese lines, then English, from `git log <last-tag>..main --oneline`); after merge `git tag -a vX.Y.Z -m vX.Y.Z && git push origin vX.Y.Z` on the merge commit; update "Version" above. Rollback = promote that commit in Vercel. First tag `v0.1.0` waits for Novian's OK.

## Settled decisions (Novian's; apply, don't ask again)
- Branch + PR, Claude merges on green (2026-11-19): every merge goes live to teachers; preview + screenshots let him look first.
- No backend, Vercel Hobby only, even for a teacher → student flow (2026-11-12).
- Lessons, known words, "đã học", memory notes in localStorage only (2026-11-12).
- Vercel Web Analytics page views, URL cut at `?`/`#` (2026-11-12).
- Anki pictures from Openverse with per-visit consent (2026-11-09). Old glyph forms from Wikimedia Commons, public domain only (2026-11-09).
- English routes, old paths redirected (2026-11-12).
- Tools grouped by teacher job; Ngắt từ, Hán Việt, N+1 hidden (2026-11-14, "công cụ chưa mạnh thì ẩn đi"). The home-page "Bạn muốn làm gì?" tree map was dropped; don't re-propose it.
- Tutorial videos = plain YouTube links, never embedded.
