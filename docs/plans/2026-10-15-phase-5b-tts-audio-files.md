# Phase 5b: Audio files for Anki (spike, then ~800 LOC)

**Depends on:** Phase 4b (`.apkg` export, which carries the audio).

## Context

Anki cards need audio *files*, and `speechSynthesis` can't record. To stay free and keep text on the device, we can run an open Chinese TTS model **in the browser**: sherpa-onnx wasm with a VITS or MeloTTS zh model.

The model weights (roughly 50–120 MB) are:
- downloaded once from Hugging Face's CDN, which supports CORS and is free
- cached with the Cache API

Only weights are downloaded; no user text leaves the device. Do **not** put the model in the Vercel deploy.

**Rejected options**:
- Edge Read Aloud or Google Translate TTS endpoints: unofficial, against their terms of service, and they send user text out.
- Paid cloud TTS: not free.

## Step 1: spike (1 day, throwaway branch)

Measure:
- model download size
- cold and warm load time on a mid-range Android phone
- synthesis speed per sentence
- tone accuracy on 50 test words

**Go/no-go**: ship only if load time is under about 20 s, synthesis keeps up with real time, and tones are correct on 90% or more of the test words. Otherwise stop at Phase 5a.

## Step 2: build (if go)

- **`lib/tts/model.ts`**: loads and caches the model in a Web Worker, with progress.
- **`lib/tts/synthesize.ts`**: turns text into PCM, then encodes WAV, or MP3 via `lamejs` to keep the `.apkg` small.
- **`/tools/anki`**: an "Thêm âm thanh" (add audio) option that fills the Audio field with `[sound:<file>.mp3]` per word and sentence, packed by Phase 4b.

## Verification

- `npm test` (WAV/MP3 header and encoder unit tests) and `npm run build` pass.
- Import the `.apkg` into AnkiDroid and confirm the audio plays.
- The Network tab shows only model downloads.
