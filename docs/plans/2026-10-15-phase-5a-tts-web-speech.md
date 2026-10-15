# Phase 5a: Read-aloud with the Web Speech API (~300 LOC)

**Depends on:** nothing. It plugs into Phases 1–3 wherever they exist.

## Context

Learners need to hear the pronunciation. The browser's built-in `speechSynthesis`:
- is free
- runs on the device
- sends no data to our site

Its limitations:
- Voice quality depends on the operating system.
- It **cannot be recorded**, so it can't produce Anki audio files. Phase 5b covers those.

## Scope

- **`lib/tts/speak.ts`**:
  - Picks the best `zh-CN` voice, with a fallback list (`zh-CN`, then `zh`, then `zh-TW`).
  - Handles `voiceschanged` and Chrome's long-utterance cutoff by speaking one sentence at a time.
  - Rate control; stop and pause.
- **`components/SpeakButton.tsx`**: a 🔊 button for words and sentences.
- Add the button to the Pinyin, Hán Việt and Anki preview, plus a sentence-by-sentence player for paragraphs.
- When no Chinese voice is found, show a Vietnamese hint explaining how to install one on Windows, Android and iOS.
- i18n strings.

## Tests

Unit-test voice selection and sentence chunking, with a mocked `speechSynthesis`.

## Verification

- `npm test` and `npm run build` pass.
- Manual check in Chrome and Edge (desktop) and Chrome (Android); also in Safari (iOS) if possible.
