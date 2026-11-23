# Site-wide notes: home page, user guide, link previews, SEO

<!-- Moved verbatim out of CLAUDE.md (2026-11-23) so it is read only when needed. CLAUDE.md says when. -->

## Notes

- **A big feature updates the home page in the same PR** (owner rule 2026-11-13): the tool cards (`TOOL_GROUPS`), the Hero/ForTeachers lines it touches, the FAQ answers, and `Roadmap` (drop the item once it ships), in both `vi.ts` and `en.ts`. The tool count in `features.subtitle` is `{count}`, filled from `TOOLS.length`, so never write a number there.
- The landing page shows only what exists: live tools in `Features`, grouped by `TOOL_GROUPS` in `lib/links.ts` (Soạn bài & ôn tập / Dạy chữ Hán / Tra & đọc, ids `prepare` / `chars` / `read`; Ngắt từ, Hán Việt, N+1 are in `HIDDEN_TOOLS`: pages live, left out of menu/home/footer; names and one-line menu hints in `nav.groups` / `nav.hints` of `lib/i18n/vi.ts`), upcoming work in `Roadmap` (follows `docs/plans/2026-10-15-roadmap.md`). When a phase ships, move it from Roadmap to Features by adding the tool to a group (the Navbar menu and Footer read the same groups).
- Teacher guide at `/guide` (+ `/en/guide`, `components/guide/TeacherGuide.tsx`, text in `guide` of `lib/i18n`): the Soạn bài flow step by step with screenshots in `public/guide/<locale>/*.webp` (retake them when the lesson UI changes). Promotion drafts (Facebook posts, comment templates, posting log) live in `docs/promotion/`.
- The old "Get notified" email form, invented testimonials and the "Pro" pricing plan were removed. Do not add sign-up forms that need a backend.
- Link preview and icons: `app/opengraph-image.png`, `twitter-image.png`, `favicon.ico`, `icon.png`, `apple-icon.png` (file-convention metadata). A page that sets its own `openGraph` must list `images` again (see `toolMetadata`); notes in `docs/plans/2026-11-10-link-preview.md`. Each tool page and `/en` has its own static picture in `public/og/` (`toolOgImage`), drawn by `node scripts/og/make-og.mjs`, which fails when any word leaves the centre 630×630 square (Facebook comments, Messenger and Zalo crop to it); a new tool needs a row in `scripts/og/tools.mjs`, and redrawn images need `OG_VERSION` raised.
- Search engines: `app/robots.ts` → `/robots.txt` (allow all, points to the sitemap) and `app/sitemap.ts` → `/sitemap.xml`, both static. The page list is `SITEMAP_PATHS` in `lib/seo/sitemap.ts` (every page in vi + `/en` with hreflang, hidden tools left out); `lib/seo/sitemap.test.ts` fails when a new `app/**/page.tsx` is missing from it.
- Structured data (JSON-LD): home = `WebSite` + `Organization` (`SiteJsonLd` in `app/page.tsx`, `app/en/page.tsx`; page body in `components/HomePage.tsx`), each tool = free `WebApplication` + `BreadcrumbList` (`ToolJsonLd` in the Vietnamese tool `layout.tsx` and the `/en` page; Anki puts it in `page.tsx` because its layout also wraps `/tools/anki/guide`). Builders in `lib/seo/jsonld.ts`, text from `seo`/`features` in lib/i18n. Never add ratings, reviews or counts; `lib/seo/jsonld.test.ts` checks every tool route has it.
- Do not invent statistics, reviews or features that do not exist in the UI.


## User guide

- Every user-facing tool change must update its page in `userguide/` (and the index in `userguide/README.md`).
- Write it in Vietnamese, step by step, quoting the **exact** UI labels from `lib/i18n/vi.ts`, and keep a "Lỗi thường gặp" section.

