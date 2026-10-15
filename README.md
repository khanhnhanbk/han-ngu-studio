# Hán Ngữ Studio — Web

Landing page + (future) web tools for Vietnamese learners & teachers of Chinese.
Built with **Next.js (App Router) + TypeScript + Tailwind CSS**. Deploys free on **Vercel**.

## Status

- ✅ Phase 1 — Landing page (this pass)
- ✅ Phase 2 — Practice-sheet generator (`/tools/practice-sheet`, rendered in the browser, print to PDF)
- ✅ Word segmentation (`/tools/segment`, runs in the browser)
- ⏳ Pinyin, Hán Việt, Anki deck, Anki images, TTS: see [`docs/plans/2026-10-15-roadmap.md`](docs/plans/2026-10-15-roadmap.md)
- ⏳ Phase 4 — i18n (EN), SEO, analytics, monetization

## Local development

```bash
pnpm install
pnpm dev
# open http://localhost:3000
pnpm test  # Vitest (golden tests)
```

## Build

```bash
pnpm build
pnpm start
```

## Deploy to Vercel (free)

1. Push this repo to GitHub.
2. Go to https://vercel.com → **New Project** → import the repo.
3. Framework preset auto-detects **Next.js**. Click **Deploy**.
4. You get a free `*.vercel.app` URL. Add a custom domain later if you want.

## Structure

```
.
├─ app/
│  ├─ layout.tsx            # root layout, fonts, metadata
│  ├─ page.tsx              # landing page composition
│  ├─ tools/practice-sheet/ # 米字格/田字格 practice-sheet generator
│  ├─ tools/segment/        # word segmentation tool
│  └─ globals.css
├─ components/              # landing sections
│  ├─ Navbar.tsx  Hero.tsx  Problem.tsx  Features.tsx
│  ├─ HowItWorks.tsx  ForTeachers.tsx  Testimonials.tsx
│  ├─ Pricing.tsx  FAQ.tsx  CTASection.tsx  Footer.tsx
│  └─ practice-sheet/SheetPage.tsx  # one A4 sheet as SVG
├─ lib/practiceSheet.ts     # character parsing, pagination, pinyin
├─ lib/segment/             # word segmentation (Viterbi, runs in the browser)
├─ public/data/             # static data (word_list.txt), lazy-loaded
├─ lib/i18n/               # Vietnamese copy (English-ready)
│  ├─ vi.ts
│  └─ index.ts
├─ tailwind.config.ts
└─ next.config.js
```

## Internationalization

All copy lives in `lib/i18n/vi.ts`. To add English:

1. Copy `vi.ts` → `en.ts` and translate.
2. Register it in `lib/i18n/index.ts` (`en: en`).
3. Later, add a locale switcher / `next-intl` for routing (`/en`).

## Fonts

- **Be Vietnam Pro** — UI text (full Vietnamese diacritics).
- **Noto Sans SC** — Chinese glyphs (`.hanzi` class).
- **LXGW WenKai TC** — Kai-style glyphs on practice sheets (`--font-kai`).
