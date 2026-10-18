# English version of the website

> Status: done (2026-10-18). Notes: every page ships both dictionaries (about +11 kB per page). Each Vietnamese tool folder gained a `layout.tsx` for its title and hreflang, and each page now has its own title. On Radicals and Character breakdown, radical names and meanings stay Vietnamese (tool data).

## Context

The whole UI is Vietnamese. `lib/i18n` already has a `Locale = "vi" | "en"` type, but `en` falls back to `vi`, and the footer shows a disabled "VI / EN" switch. All 36 files that show text call `getDictionary("vi")` at module level. The owner wants an English site.

**Owner's decisions:**
- English lives at **`/en/…`** URLs. Vietnamese keeps every current URL.
- **All UI text** is translated. Tool data stays as it is: Hán Việt, Vietnamese meanings and example-sentence translations are unchanged, and English meanings already show where they exist.
- A **VI / EN switch in the navbar** (desktop and phone menu) **and the footer**.

## Approach: the locale comes from the URL

- No root-layout split and no rewrites or middleware, so it stays static on the Hobby plan.
- English pages are thin route files under `app/en/` that render the same page components.
- Components read the locale from `usePathname()` (`/en` or `/en/…` means English). During static rendering `usePathname()` already returns the route, so the HTML of every `/en` page is English from the server, with no flash.

### 1. i18n core (`lib/i18n/`)

- **`en.ts`**: `export const en: Dictionary = { … }`, a full translation of `vi.ts`. TypeScript enforces the same shape, including arrays, tuples and functions such as `truncated(limit, n)`.
- **`index.ts`**: map `en` to `en` instead of `vi`.
- **`locale.ts`** (pure):
  - `localeFromPath(path)`;
  - `localizeHref(locale, href)`: prefix `/en` to internal links (`/`, `/tools/…`, `/#faq`); leave external links, `#hash` and `/data` alone;
  - `switchLocalePath(path, target)`: `/tools/pinyin` ↔ `/en/tools/pinyin`.
- **`useLocale.ts`** (client): `useLocale()`, `useDictionary()` and `useHref()` (a localizeHref already bound to the current locale).
- **Glossary**, kept consistent and also listed in CLAUDE.md:

| Vietnamese | English |
|---|---|
| Phiếu tập viết | Practice sheet |
| Thứ tự nét | Stroke order |
| Chiết tự | Character breakdown |
| 214 bộ thủ | 214 radicals |
| Ngắt từ | Word segmentation |
| Hán Việt | Sino-Vietnamese (Hán Việt) |
| Tạo thẻ Anki | Anki deck builder |
| Trắc nghiệm | Quiz |
| Sắp xếp câu N+1 | N+1 sentence order |
| Ngũ bút | Wubi |
| Giản thể / Phồn thể | Simplified / Traditional |
| dịch máy | machine-translated |

### 2. Components read the dictionary from the URL

- **Client components**: replace module-level `const dict = getDictionary("vi")` with `const dict = useDictionary()` inside the component. Files that build helpers at module level from `t` take `t` as a parameter instead. Representative files: `components/Navbar.tsx`, `app/tools/quiz/page.tsx`, `components/decompose/ComponentTree.tsx`.
- **Server components on the home page** (Hero, Problem, Features, HowItWorks, ForTeachers, Roadmap, FAQ, CTASection) and **Footer**: add `"use client"` so they can use the hooks. They are still rendered to HTML at build time. Footer is already used inside client pages. `components/quiz/PrintSheet.tsx` is only imported by a client page, so it just switches to the hook.
- **The few hard-coded strings** move into the dictionaries: the section eyebrows in HowItWorks, FAQ and ForTeachers, the Hero mock label "Phiếu tập viết", and the Anki template labels "Hán Việt:" and "Ngũ bút:". For the last two, `lib/anki/templates.ts` exports `cardTemplates(labels)`, and `SAMPLE_ROW` stays as data.
- **Internal links** go through `useHref()`:
  - `TOOL_GROUPS` hrefs in Navbar, Footer and Features;
  - `/#…` anchors;
  - cross-tool links in stroke-order, radicals, decompose, anki and the Anki guide, including the `#c=` / `#chars=` hashes, which stay as they are.

### 3. Routes

- **`app/en/layout.tsx`**: a nested layout that only exports English `metadata` (title, description, `openGraph.locale: "en_US"`).
- **`app/en/page.tsx`**, plus one file per tool at `app/en/tools/<tool>/page.tsx` (10 tools) and `app/en/tools/anki/huong-dan/page.tsx`. Each re-exports the Vietnamese page component, so the two languages share one component, and adds English `metadata` where the Vietnamese page has some.
- **The Anki guide page** is a server component with `metadata`. Its body moves to `components/anki-guide/AnkiGuide.tsx` (client, uses hooks). Both routes render it, and each exports its own metadata.
- **`<html lang>`**: the root layout stays `lang="vi"`. A tiny inline `<head>` script, next to the theme and script init scripts, sets `lang="en"` when the path starts with `/en`. It runs before first paint.
- **`hreflang`**: the root and `/en` layouts' `metadata.alternates.languages` point each page to its other-language version for the home page; tool pages get the same through a small helper.

### 4. Language switch: `components/LanguageSwitch.tsx`

- Two links, **VI / EN**, styled like `ScriptSwitch`; the current one is marked `aria-current`.
- Each link goes to `switchLocalePath(pathname, target)` and keeps `location.hash`, so a stroke-order page with `#c=学` stays on the same characters.
- Placed in the Navbar next to `ScriptSwitch` (desktop) and in the phone menu (under a "Ngôn ngữ / Language" heading). It also replaces the disabled spans in the Footer.

### 5. Things that stay Vietnamese

- Tool output data.
- The GitHub user guide (`userguide/`). In English the footer link reads "User guide (Vietnamese)".
- Exported file names.
- TSV column names. These are field names that Anki maps.

## Tests

- `lib/i18n/i18n.test.ts`:
  - `en` and `vi` have exactly the same key paths (deep);
  - no `en` value is empty;
  - `en` values contain no Vietnamese diacritics, except an allowlist (Hán Việt, Hán Ngữ Studio, tool names quoted in Vietnamese);
  - `localeFromPath`, `localizeHref` (internal, hash, external, `/data`) and `switchLocalePath` both ways.
- Existing tests unchanged.

## Docs

- CLAUDE.md "Code conventions": UI text lives in both `vi.ts` and `en.ts` (TypeScript checks the shape); read it with `useDictionary()` and build links with `useHref()`; every new page gets an `app/en/…` twin; add the glossary.
- `userguide/README.md`: one line saying the site is available in English at `/en` (the guide itself stays Vietnamese).

## Verification

1. `pnpm test`, `pnpm run lint`, `pnpm run build`. The build lists all `/en/...` routes as static.
2. Browser (production build):
   - every `/en` page shows English text, has `lang="en"`, and has no Vietnamese UI text (spot check by scanning for diacritics outside tool output);
   - the VI/EN switch keeps the same page and hash;
   - links inside `/en` stay in `/en`;
   - the Vietnamese pages are unchanged;
   - check dark mode and 390 px width (English labels are longer: menu, buttons).
3. Commit on main. Push only when the owner asks.
