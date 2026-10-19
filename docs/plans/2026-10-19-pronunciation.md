# Word pronunciation (🔊) that is actually good

## Context

The owner wants click-to-hear pronunciation for **vocabulary only** (words and characters, never paragraphs). It must be **free** and genuinely usable, "not just have but awful when used". Users may install voices themselves.

**Why browser voices alone are not enough:**
- Quality depends on the device: Windows Huihui is robotic, Apple Tingting is good, Linux often has nothing.
- Chrome and Edge's best Chinese voices are **online**: they send the text to Google or Microsoft.
- On a single character the engine picks one reading with no context: 行 is read xíng even in 银行.

**Free human recordings exist:** [audio-cmn](https://github.com/hugolpz/audio-cmn), CC-BY-SA:
- **8,596 HSK words and characters**, recorded by Yue Tan, including 1,734 single characters;
- **1,707 toned syllables**, recorded by Chen Wang, tones 1–4, with ü written as `v` (`lv4`, `nve3`), and no neutral-tone files;
- at the `24k-abr` bitrate: 37.8 MB of words + 7.8 MB of syllables, about 4.5 KB per file (measured through the GitHub API).

**Owner's decisions:**
- **Human audio first**: bundle the 24k recordings (about 46 MB). The device voice is only a fallback.
- **Online voices are opt-in**: off by default; the user can enable them in the settings with a clear warning.
- **Placement**: Đọc hiểu (word card and word table), and the character tools: Thứ tự nét, Chiết tự (the current character and the family tiles), 214 bộ thủ (example characters).

## Which sound plays (most reliable source first)

| Clicked | Source |
|---|---|
| A single character whose Pinyin is known from context (Đọc hiểu), tone 1–4 | **Human syllable** for that reading (`cmn-hang2`). 行 in 银行 always sounds háng. |
| A single character without context, or a neutral tone | **Human recording of the character** (HSK set), if there is one |
| A multi-character word | **Human recording of the word** (HSK set), if there is one |
| Anything else | **Device voice** (Web Speech). Offline voices only, unless the user opted in to online ones. |
| No recording and no usable voice | The button opens the **voice settings** with an install guide for the user's system |

Recordings are keyed by **Simplified** form. In Phồn thể mode the caller passes the Simplified form it already has (`simpOf`, `conv.toSimp`).

## 1. Data: `scripts/build-audio.mjs` (new command `pnpm build:audio`, run once, output committed)

- Download audio-cmn at a **pinned commit** (one tarball), and take `24k-abr/hsk/` and `24k-abr/syllabs/`. Skip the odd entries (underscore prefixes, `一_也_` patterns).
- Pack the MP3s, unchanged, into binary shards of about 64 KB: `public/data/audio/w-<n>.bin` (words, about 600 files) and `public/data/audio/s-<n>.bin` (syllables, about 120 files).
- Write `public/data/audio/index.json`: `{ commit, words: { 学习: [shard, offset, length] }, syllables: { hang2: [...] } }`, about 90 KB gzip.
- Re-running `pnpm build:data` keeps `sizes.json` correct, so the download gate counts these files. One click costs the index (once) plus a single shard of about 64 KB, so it never prompts.
- `assets/dictionary/LICENSE-audio-cmn.txt`: CC-BY-SA, the authors (Yue Tan for words, Chen Wang for syllables), audio-cmn by Hugo Lopez (SWAC recordings), and the pinned commit.
- Keeping shards (rather than one big file read with HTTP Range requests) means no dependency on Range support, normal HTTP caching, and the same pattern as the stroke shards.

## 2. Logic: `lib/speech/`

- **`resolve.ts`** (pure, tested): `resolveSound(index, { word, tone3?: string[] })` returns `{ kind: "syllable" | "word", ref }` or `{ kind: "voice", text }`, following the table above.
  - The syllable key comes from our TONE3 Pinyin: `nu:3` → `nv3`, tone 5 → no syllable.
- **`audio.ts`** (browser): plays recordings through an `AudioContext`.
  - The context is created or resumed **synchronously inside the click** (iOS Safari otherwise blocks audio started after an `await`).
  - Then: fetch the shard (memoised loader that calls `markLoaded`), slice it, `decodeAudioData`, play.
  - Decoded buffers are kept in an LRU cache; starting a new sound stops the previous one.
- **`voices.ts`**:
  - list Chinese voices (`zh-CN`, `zh_CN`, `cmn`, then `zh-TW` / `zh-HK`), waiting for `voiceschanged` (Chrome loads voices late);
  - rank them: the user's choice first, then local voices, then higher-quality names (Natural / Premium / Enhanced, Tingting, Xiaoxiao…);
  - online voices (`localService === false`) only if allowed;
  - speak with `lang = "zh-CN"`, after `cancel()`, at the chosen rate.
- **`prefs.ts`**: `{ voiceURI, allowOnline, rate }` in localStorage (key `hns-speech`). These are preferences, not user text.
- **`useSpeak()`**: `speak(target)` and the state of each button (idle / loading / playing / unavailable). It preloads the index once a page shows its first 🔊.

## 3. UI: `components/speech/`

**`SpeakButton.tsx`**
- A small 🔊 icon button. Its `aria-label` reads "Nghe {word}" / "Listen to {word}".
- While loading or playing, the icon animates. A second click stops playback.
- Never shown for whole sentences or paragraphs.

**`SpeechSettings.tsx`** (dialog "Giọng đọc")
- **Where the sound comes from**: human recordings for common words; the device voice only when there is none.
- A **device voice** dropdown, with local voices first.
- A checkbox **Cho phép giọng online (Google/Microsoft)**, with a note that the clicked word is sent to that company.
- A **rate** slider (0.6–1.0, default 0.8) and a **Thử** button (你好).
- An **install guide** for the detected system:
  - Windows: Settings → Time & language → Speech → Add voices → Chinese (Simplified);
  - macOS / iOS: Spoken Content → Manage voices → Chinese (China mainland), a "Premium/Enhanced" voice;
  - Android: Google speech services → install Chinese (Mandarin);
  - Linux: no good offline voice; recordings still work.

It opens from a "Giọng đọc" link next to each tool's 🔊, and automatically when a word has no source.

**Where the buttons go**
- **Đọc hiểu**: the word card (with context Pinyin, so single characters use the syllable recording) and each word-table row.
- **Thứ tự nét**: next to the large character.
- **Chiết tự**: next to the current character, and a small 🔊 on each family tile.
- **214 bộ thủ**: a small 🔊 on each example-character tile (the tile stays a link).

## 4. i18n, docs, rules

- **`lib/i18n/vi.ts` and `en.ts`**: a `speech` section (button labels, settings, install guides, credits). The i18n tests already enforce matching keys.
- **CLAUDE.md**:
  - hard rule 4: *"Exception: if the user explicitly turns on an online browser voice in Giọng đọc, their browser sends the single clicked word to that voice provider. Off by default; never sentences."*;
  - a data-credits line for audio-cmn;
  - the `pnpm build:audio` command;
  - mark Roadmap 5a done.
- **Roadmap**: remove the "Nghe phát âm" card (the Anki audio card stays).
- **User guide**: a new "Nghe phát âm" section in `userguide/README.md` (settings, install guide per system, privacy); short notes in `reader.md`, `stroke-order.md`, `decompose.md` and `radicals.md`.
- **Credits on each page with 🔊**: "Phát âm: audio-cmn (CC BY-SA), giọng Yue Tan, Chen Wang".

## Tests

- **`lib/speech/resolve.test.ts`**:
  - 行 with `hang2` gives syllable `hang2`; with `xing2`, `xing2`;
  - 了 with `le5` (neutral) gives the character's recording;
  - 女 with `nu:3` gives `nv3`;
  - 学习 gives the word recording; a word with no recording gives voice; Traditional input is resolved by the caller (documented).
- **Index integrity** (reads the committed `index.json` and shard sizes): every entry lies inside its shard; spot entries exist (`学习`, `hang2`, `nv3`); an MP3 sync header is present at a few offsets.
- **`voices.ts`**: ranking with fake voice lists; online voices hidden unless allowed; zh-CN preferred over zh-TW.
- **`prefs.ts`**: parsing and defaults.

## Verification

1. `pnpm build:audio` (once), `pnpm build:data` (sizes), `pnpm test`, `pnpm run lint`, `pnpm run build`.
2. Browser (production build):
   - clicking 🔊 fetches `index.json` plus one shard, decodes and starts an `AudioBufferSourceNode` (checked through instrumentation, since headless has no speakers);
   - a second click on the same word uses the cache;
   - 银行's 行 resolves to `hang2`;
   - a word with no recording opens the settings when no voice exists;
   - the settings dialog shows the right install guide;
   - Phồn thể mode and `/en`, dark mode, phone width;
   - no request goes anywhere but our `/data/audio/` files.
3. Manual listening on a real device before pushing: the owner checks a few words (单 / 行 / 学习 / 银行) on their phone and computer.
4. Commit on main; push when the owner asks. Check that the Vercel deployment accepts the extra ~46 MB and ~720 files, and spot-check one live shard.
