# Pronunciation: off by default, lighter when on

## Context

The 🔊 recordings work (the owner heard them; some, like 我, are not very clear, to improve later). The owner's priorities now are a fast site, a light Vercel footprint and smooth use; "enough is enough", no new features beyond this. They asked: how long does a user wait with sound versus without, and does it need a strong connection? If it does, sound should not load by default but only when the user turns it on. For whole paragraphs, point users to free TTS tools instead.

### Measured cost today (gzip sizes)

| What | When | Size |
|---|---|---|
| Speech JS (player, settings dialog) | every page (part of it is in the root layout) | ≈ 8–10 KB |
| Audio index `index.json` | **as soon as** a page with 🔊 opens, even with no click | **98 KB** |
| One shard (MP3, does not compress) | each new word clicked | ≈ 60 KB |

### Estimated wait for the first 🔊 click (download time plus a few round trips)

| Connection | Now (index + 64 KB shard) | After this plan (index part + 32 KB shard) |
|---|---|---|
| Wi-Fi / good 4G (≈10 Mbps, 50 ms) | ≈ 0.2 s | ≈ 0.1 s |
| Ordinary 3G (≈1.5 Mbps, 150 ms) | ≈ 1.3 s | ≈ 0.5 s |
| Weak 3G (≈400 kbps, 400 ms) | ≈ 4–5 s | ≈ 1.5 s |

- A word clicked again plays instantly (cached).
- Without sound, the page itself is unaffected, except that today it also downloads the 98 KB index in the background, which slows page data on weak connections.

**Answer:** sound does not need a strong connection (small files, only on click). The waste is the automatic 98 KB preload, and weak 3G waits several seconds on a first click.

## Changes (small, no new features)

1. **Sound is off by default and turned on per device.**
   - `lib/speech/prefs.ts` gains `enabled: false`.
   - While off:
     - no 🔊 buttons are rendered;
     - no audio files are fetched;
     - the speech dialog code is not loaded.
   - Each tool that has sound shows one small link where the "Giọng đọc" link is now: **"🔊 Bật phát âm (~60 KB mỗi từ)"**. One tap turns it on, it is remembered, and the buttons appear.
   - When on, the same place shows **Giọng đọc** (the settings), which includes **Tắt phát âm**.
   - A `useSpeechEnabled()` hook (prefs plus the existing `SPEECH_PREFS_EVENT`) controls `SpeakButton` (returns null when off) and the link.
2. **No background preload.** Remove `preloadAudioIndex()` from `SpeakButton`; the index loads on the first click.
3. **A small index per click.**
   - `scripts/build-audio.mjs` splits the word index into 32 files by hashing the word (`index-w-<n>.json`, about 3 KB gzip each) plus `index-s.json` for the syllables (about 14 KB gzip).
   - `resolve.ts` / `player.ts` load only the part the word needs.
   - Shards drop to **32 KB** (about 1,430 audio files instead of 717; the total size is unchanged).
   - Re-run `pnpm build:audio` and `pnpm build:data` (sizes).
4. **Speech code out of the root layout.** `SpeechSettings` loads with `next/dynamic` only when the dialog opens, so pages without sound carry no speech JS beyond the tiny toggle.
5. **Whole paragraphs: suggest free tools, don't build anything.** One short section in the Giọng đọc dialog and in `userguide/README.md`, **"Nghe cả đoạn văn?"**:
   - **Microsoft Edge**: right-click → **Đọc to (Read aloud)**, with natural voices, free.
   - **iPhone / iPad / Mac**: **Speak Selection** (Đọc mục được chọn) in Accessibility → Spoken Content; on-device voices.
   - **Android**: **Select to Speak** (Chọn để nói).
   - **Google Dịch**: paste the text and press the speaker.
   - A note that online services such as Google Dịch / Edge receive the text, so users should choose for themselves.

## Files

- **Logic and data**:
  - `lib/speech/prefs.ts`: add `enabled`, with a test;
  - `lib/speech/player.ts`: per-part index loading, no preload export;
  - `lib/speech/resolve.ts`: index parts, with tests updated;
  - `scripts/build-audio.mjs`: split index and 32 KB shards;
  - regenerate `public/data/audio/`.
- **UI**:
  - `components/speech/SpeakButton.tsx`: hidden when off, no preload;
  - `components/speech/SpeechSettingsLink.tsx`: becomes the on/off and settings link;
  - `components/speech/SpeechSettings.tsx`: an off switch and the paragraph section;
  - `app/layout.tsx`: dynamic import.
- **Text**: `lib/i18n/vi.ts` and `en.ts` (toggle labels, paragraph-tools section).
- **Docs**:
  - `userguide/README.md`: "Nghe phát âm" says how to turn sound on, plus the paragraph tools;
  - the four tool guide pages: one line each;
  - CLAUDE.md: sound is opt-in; the index is split.

## Verification

1. `pnpm test`, `pnpm run lint`, `pnpm run build`. Compare First Load JS for `/`, `/tools/reader` and `/tools/stroke-order` before and after: speech code should be gone from pages without sound.
2. Browser (production build):
   - **sound off (default)**: opening the reader, stroke order, Chiết tự and radicals requests **no** `/data/audio/` files, and no 🔊 buttons show;
   - **sound on**: the first click fetches one index part (≈3 KB) and one shard (≈32 KB), then plays; a repeat click makes no request; the setting survives a reload;
   - turning it off hides the buttons;
   - a throttled run (Chrome DevTools "Slow 3G" profile in Playwright) to measure the real first-click time against the table above.
3. Commit on main; push when the owner asks.
