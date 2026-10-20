# Plan: make "Bật phát âm" big and easy to find (Navbar + tool pages) — 2026-10-20

## Context

Pronunciation is off by default (`lib/speech/prefs.ts`). The only way to turn it on is `SpeechToggle` (`components/speech/SpeechToggle.tsx`): a tiny 12 px icon + dotted-underline `text-xs` link hidden in the credits line at the **bottom** of 4 tools (reader, stroke-order, decompose, radicals). Users don't see it, so they never discover the 🔊 buttons. Goal: a clearly visible control at the **top of the site** (Navbar, every page) plus a visible button near the top of the tools that have audio. Behaviour stays the same: off by default, nothing loads until the user opts in and clicks a word.

## Changes

1. **New `components/speech/SpeechNavButton.tsx`** (`"use client"`), reusing `useSpeechEnabled`, `readSpeechPrefs`/`saveSpeechPrefs`, `openSpeechSettings` exactly like `SpeechToggle`:
   - **Off**: pill button styled like the Navbar controls (`rounded-lg bg-ink-50 px-2 py-1 text-sm font-medium`), muted-speaker icon + label "Phát âm: tắt"; `title` = `enable` + `enableHint`. Click → enable (🔊 buttons appear instantly via `SPEECH_PREFS_EVENT`).
   - **On**: same pill in brand colours (`bg-brand-50 text-brand-ink`, check token names in `app/globals.css`), speaker icon + "Phát âm: bật"; click → `openSpeechSettings()` (the dialog already has **Tắt phát âm**).
   - `aria-pressed={enabled}`; `inline` prop (full label) for the phone menu, like `ScriptSwitch`.
   - Before hydration `useSpeechEnabled` is `false` → renders "off" first; acceptable (same as today).
2. **Icon**: add `components/icons/volume-x.tsx` mirroring `volume-2.tsx` (lucide `volume-x`) for the off state.
3. **Navbar** (`components/Navbar.tsx`): put `<SpeechNavButton />` in the desktop right cluster before `<LanguageSwitch />`; in the phone menu add a section heading (`dict.speech.navLabel`) + `<SpeechNavButton inline />` next to Loại chữ / theme. Also show a compact icon-only version **outside** the hamburger on phones (left of the menu button) so it's visible without opening the menu.
4. **Tool pages — bigger in-page toggle**: give `SpeechToggle` a `variant="prominent"` (btn-secondary-style pill, 16 px icon, `text-sm`, shows `enable` + hint on a second line when off; "Giọng đọc" when on). Place it near the top of the 4 tools (next to the input / title area) in `app/tools/{reader,stroke-order,decompose,radicals}/page.tsx`; keep the small existing link in the credits line.
5. **i18n** (`lib/i18n/vi.ts` + `en.ts`, `speech` block): `navLabel: "Phát âm"/"Pronunciation"`, `navOn: "Phát âm: bật"/"Sound: on"`, `navOff: "Phát âm: tắt"/"Sound: off"`. Reuse `enable`, `enableHint`, `settingsLink`.
6. **User guide**: `userguide/README.md` (Nghe phát âm section) and the 4 tool pages: replace "(cuối trang)" with "nút **Phát âm: tắt** trên thanh menu đầu trang (hoặc nút **Bật phát âm** trong công cụ)"; update "Muốn tắt" step.

No new data, no network change: still Hard Rule 4 compliant (prefs in localStorage only).

## Verification

- `pnpm test` (i18n key parity), `pnpm run lint`, `pnpm run build`.
- `pnpm run dev`: on `/` and `/en`, Navbar shows "Phát âm: tắt"; click → becomes "bật", go to `/tools/reader`, tap a word → 🔊 shows and plays; click Navbar button again → settings dialog → **Tắt phát âm** → button returns to "tắt" and 🔊 disappears. Check desktop `lg` width (Navbar not overflowing at 1024 px), phone width (icon visible outside the menu), dark mode and another accent from ThemePicker.
- Network tab: no audio request until a 🔊 is clicked.
