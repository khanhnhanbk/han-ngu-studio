# Plan: simpler Navbar with one settings menu — 2026-10-20

(The earlier plan in this file, the pronunciation button, shipped in 41ee09e.)

## Context

The desktop Navbar now has 4 links + 6 controls (Cách hoạt động, Cho giáo viên, Sắp ra mắt, Công cụ ▾ | Phát âm: tắt, VI/EN, 简/繁, Giao diện, Dùng thử miễn phí). It is crowded and confusing. Owner chose: keep the sound button visible, put language, script and theme into **one ⚙ settings menu**, and remove the CTA button, the "Cách hoạt động" link (the user guide covers it) and the "Sắp ra mắt" link (both still reachable on the landing page and in the footer).

Target (desktop):
```
汉 Hán Ngữ Studio   Công cụ ▾  Cho giáo viên                     🔊 Phát âm: tắt   ⚙ VI · 简 ▾
```
Phone bar: `汉 Hán Ngữ Studio … 🔊 ☰`.

## Changes

1. **New `components/SettingsMenu.tsx`** (`"use client"`):
   - `SettingsPanel`: rows with a small label + control: **Ngôn ngữ** → `<LanguageSwitch inline />`; **Loại chữ** → `<ScriptSwitch inline />`; **Phát âm** → `<SpeechNavButton />`; **Giao diện** → `<ThemePicker inline />` (mode + accent panel, already exists).
   - `SettingsMenu`: button `⚙ {LOCALE upper} · {简|繁} ▾` (shows the current state; `aria-label` = `dict.nav.settings`), opening a popover (`absolute right-0 top-full mt-2 w-80 rounded-xl border bg-surface p-4 shadow-lg`). Copy the click-outside + Escape logic from `ThemePicker` (`components/ThemePicker.tsx`). Uses `useLocale()` and `useScript()` (`lib/script/useScript.ts`) for the label.
2. **New `components/icons/settings.tsx`**: static lucide `settings` gear, same shape as `components/icons/volume-x.tsx`.
3. **`components/Navbar.tsx`**:
   - Nav order: **Công cụ ▾** first (the main thing people want), then Cho giáo viên. Drop the `howItWorks` link (owner: the user guide covers it; the landing section `#how-it-works` stays) and the `roadmap` link (stays in Footer).
   - Right cluster: `<SpeechNavButton />` + `<SettingsMenu />` only. Remove `LanguageSwitch`, `ScriptSwitch`, `ThemePicker` and the CTA `Link` from the bar.
   - Phone menu: links, tool groups, then one heading **Cài đặt** + `<SettingsPanel />`; remove the separate Ngôn ngữ / Loại chữ / Phát âm / Giao diện sections, the roadmap link and the CTA. Keep the 🔊 icon + ☰ on the phone bar.
4. **i18n** (`lib/i18n/vi.ts`, `en.ts`): `nav.settings: "Cài đặt"` / `"Settings"`. Keep `nav.cta`, `nav.roadmap` if still used elsewhere (CTASection, Footer); remove only if unused.
5. **User guide**: `userguide/README.md` (lines on EN, Giao diện, Giản thể / Phồn thể, Nghe phát âm) and every "Bấm **繁** trên thanh menu" in tool pages (anki, comprehensible-input, … — grep `thanh menu`) → "bấm **⚙** trên thanh menu → **Loại chữ** → **繁**"; Giao diện now "⚙ → **Giao diện**"; EN now "⚙ → **Ngôn ngữ** → **EN** (hoặc cuối trang)".

## Verification

- `pnpm test`, `pnpm run lint`, `pnpm run build`.
- `pnpm run dev`: desktop 1024 / 1280 px — one row, no overflow; ⚙ opens panel, switching EN keeps the hash, 简/繁 updates the button label, theme changes apply, Escape / outside click closes. Phone 375 px — 🔊 and ☰ visible; menu shows Cài đặt panel. Dark mode + another accent.
