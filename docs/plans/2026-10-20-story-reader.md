# Plan: story reader "Truyện đọc" — 2026-10-20

## Context

Next feature from `docs/plans/2026-10-20-next-steps.md`. Learners read short, modern, useful stories (ordering coffee, asking the way, the metro, paying by phone, seeing a doctor, Tết / Spring Festival); each teaches a few new words and ends with a culture note. Owner chose: **6 stories, HSK 1–2**, Vietnamese translation **hidden under each sentence**. Content is our own, drafted by Claude offline and reviewed by the owner (labelled until reviewed). No runtime AI, no backend.

## Design

- **Content**: `assets/stories/<id>.json` — `{ id, level, title, titleVi, topic, status: draft|reviewed, sentences: [[zh, vi]…], newWords: [...], culture }`.
- **Check** `scripts/lib/stories.mjs` (run in `pnpm build:data` and in tests): id slug, level "1"/"2", 4–20 sentences, one sentence per line, Vietnamese present, 3–8 new words each in `vocab.json` at or below the story level and present in the text, culture note ≤ 700 chars.
- **Build** → `public/data/stories/index.json` (list, no text) + `public/data/stories/<id>.json`.
- **Library page** `/tools/stories` (+ `/en/tools/stories`): cards by HSK level (Chinese title, Vietnamese title, topic, new words, draft badge) → "Đọc truyện" opens `/tools/reader#story=<id>`.
- **Đọc hiểu**: reads `#story=<id>`, loads the story, fills and reads the text (one sentence per line). Shows a story panel: title, draft badge, link back to the library, new words with "Thêm vào danh sách học", a "Xem bản dịch" button under each sentence (+ "Hiện tất cả bản dịch"), and the culture note after the text. Editing the text and reading again leaves story mode.
- **Navigation**: tool `stories` in the "Đọc văn bản" group (nav, hints, features item, footer automatically).
- **Tests**: checker rules; real stories pass; each story's words above its level stay a small share (analyzeText with the real data).
- **Docs**: `userguide/stories.md` + README index, reader.md note, CLAUDE.md tools table, `/giay-phep` own-content text, next-steps file.

## Verification

`pnpm build:data`, `pnpm test`, `pnpm run lint`, `pnpm run build`; dev: library → story → reader shows panel, translations toggle, new words → study list → Anki, Phồn thể shows Traditional text, `/en` labels in English (story content stays Chinese/Vietnamese).
