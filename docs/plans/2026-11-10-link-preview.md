# Link preview (Open Graph) and site icon

Date: 2026-11-10. Asked by the owner: links pasted into Zalo/Facebook showed no picture, and the browser tab had no icon.

## Cause

- `app/layout.tsx` had `openGraph` title/description but no image, and the app had no `favicon.ico` / `icon` / `apple-icon` file.
- Tool pages took `openGraph` from the root, so a shared tool link showed the home title.

## Change

- File-convention metadata in `app/` (static PNGs, prerendered, no runtime cost on Vercel Hobby):
  `opengraph-image.png` + `twitter-image.png` (1200×630, with `.alt.txt`), `favicon.ico` (16/32/48),
  `icon.png` (192, rounded gold tile with 汉 like the Navbar logo), `apple-icon.png` (180, square, no transparency).
- Root metadata: `twitter.card = summary_large_image`, `og:url`, `og:site_name`.
- `toolMetadata` (`lib/i18n/metadata.ts`) now sets `openGraph` per tool (own title, description, url, locale).
  Setting `openGraph` in a child segment drops the inherited file image, so it names `/opengraph-image.png` again.

## Regenerating the images

The images are drawn from HTML with Playwright (Be Vietnam Pro + Noto Sans SC from `@fontsource`) at 1200×630
and 512×512, then shrunk with Pillow. Colours: gold `#D4AF37`, text `#0F172A`, accent text `#8A6D1F`,
background `#FCF8E8` → white. Each headline line is fixed (`white-space: nowrap`) so no word wraps alone.

## Square-crop safe area (2026-11-11)

Facebook shows a link in a comment as a small card with a near-square thumbnail on the left, cropped from the
centre of the 1200×630 image. The first image (headline on the left, 汉语 grid on the right) lost both halves and
read as fragments. The image is now laid out around the centre 630×630 (x 285–915): the gold 汉 tile (250 px),
"Hán Ngữ Studio" (76 px) and "Học tiếng Trung miễn phí" all sit inside it; the 米字格 tiles on the sides are
decoration only. Keep any future text inside that square and large enough to read at ~175 px wide.
Before/after crops: `docs/screenshots/link-preview/`.

## Per-tool images (2026-11-12)

Tool pages and `/en` now have their own pictures in `public/og/`, drawn by `scripts/og/make-og.mjs`;
see `docs/plans/2026-11-12-tool-link-previews.md`.

## Checking after deploy

Facebook caches previews: re-scrape with https://developers.facebook.com/tools/debug/ ("Scrape Again").
Zalo also caches; a fresh link (e.g. add `?v=2`) shows the new preview right away.
