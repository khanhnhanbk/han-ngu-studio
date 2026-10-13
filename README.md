# Hán Ngữ Studio — Web

Landing page + (future) web tools for Vietnamese learners & teachers of Chinese.
Built with **Next.js (App Router) + TypeScript + Tailwind CSS**. Deploys free on **Vercel**.

## Status

- ✅ Phase 1 — Landing page (this pass)
- ✅ Phase 2 — Practice-sheet generator (`/tools/practice-sheet`, rendered in the browser, print to PDF)
- ✅ Word segmentation (`/tools/segment`, Python API in `api/`)
- ⏳ Phase 3 — Anki export, Cloze, N+1
- ⏳ Phase 4 — i18n (EN), SEO, analytics, monetization

## Local development

```bash
cd web
npm install
npm run dev
# open http://localhost:3000
```

## Build

```bash
npm run build
npm run start
```

## Deploy to Vercel (free)

1. Push this repo to GitHub.
2. Go to https://vercel.com → **New Project** → import the repo.
3. Set **Root Directory** to `web` (important — the repo also contains Python code).
4. Framework preset auto-detects **Next.js**. Click **Deploy**.
5. You get a free `*.vercel.app` URL. Add a custom domain later if you want.

## Structure

```
web/
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
