# Link-preview image per tool

Date: 2026-11-12. Item 4 of the owner's six "learn from tinhtiemxan.com" tasks: a shared tool link
(Zalo, Facebook, Messenger) should show that tool, not the same home picture on every page.

## Before

- `toolMetadata` (`lib/i18n/metadata.ts`) gave every tool page `/opengraph-image.png`.
- `app/en/layout.tsx` sets `openGraph` without `images`. A child segment that sets `openGraph` drops the
  inherited file-convention image, so `/en`, `/en/guide` and `/en/licenses` had no `og:image` at all.

## Change

- `scripts/og/make-og.mjs` (+ the list in `scripts/og/tools.mjs`) draws static 1200×630 PNGs with
  Playwright from HTML: the tool's own character in a 米字格 tile (the same characters planned for the
  tool-card icons: 课 路 查 故 写 笔 读 分 拼 越 卡 考 部 拆 句), the tool title, and
  "Hán Ngữ Studio · miễn phí" / "· free". Fonts: Be Vietnam Pro + Noto Sans SC from Google Fonts at draw time.
  Output: `public/og/<route>.png` (Vietnamese), `public/og/en/<route>.png` (English) and
  `public/og/en/home.png` for `/en`. No `ImageResponse`, nothing runs on the server (HARD RULES 1, 2).
- Safe area: every word and the main tile sit inside the centre 630×630 (x 285–915). The script measures
  each element after layout and exits with an error when one spills out. Titles never wrap by themselves:
  a title shrinks to at most 56 px, and a longer one is split by hand in `tools.mjs` so no word is left
  alone on a line. The faint 米字格 tiles at the sides are decoration only.
- `toolMetadata` points `openGraph.images` and `twitter.images` at `toolOgImage(locale, path)`;
  `app/en/layout.tsx` names `/og/en/home.png`. URLs carry `?v=OG_VERSION`: raise it when the images are
  redrawn, so Zalo and Facebook fetch the new file instead of a cached one.
- `lib/i18n/og.test.ts` checks every `app/tools/*` route and `/lesson` has both images.

## Redrawing

```
node scripts/og/make-og.mjs --check /tmp/og-check   # also writes the square crops to look at
```

Then raise `OG_VERSION`, commit the PNGs, and after deploy press "Scrape Again" for the changed links at
https://developers.facebook.com/tools/debug/.

Contact sheets: `docs/screenshots/link-preview/tools/` (`vi.png`, `en.png`, `square-crops.png`).
