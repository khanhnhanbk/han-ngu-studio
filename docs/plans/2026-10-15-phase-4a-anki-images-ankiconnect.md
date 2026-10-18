# Phase 4a: Image picker + AnkiConnect push (~800 LOC)

> Status: replaced (2026-10-18). The owner declined image search (sending words to Openverse/Wikimedia) and chose `.apkg` delivery over AnkiConnect. Manual per-card images shipped with Phase 4b instead.

**Depends on:** Phase 3 (Anki deck generator).

## Context

Pictures help learners remember vocabulary. The old `anki_connect_control.py` script:
1. scraped Bing for an image per word
2. pushed it to Anki through AnkiConnect, with `storeMediaFile` followed by a batched `updateNoteFields`

Scraping Bing is impossible from a browser (CORS) and is against Bing's terms of service.

There is a free, backend-free alternative:
- **Search** Openverse (`api.openverse.org`), or Wikimedia Commons (`w/api.php?origin=*`) as a fallback. Both allow anonymous CORS requests and return openly licensed images.
- **Push** to Anki with AnkiConnect's `storeMediaFile` and its `url` param. The user's own Anki downloads the image, so the browser never touches the image bytes.

**Privacy (hard rule 4)**: the search sends the vocabulary word, or its English gloss, to a third party. This phase **requires the owner's approval** and must be:
- opt-in on every run
- labelled in Vietnamese ("Từ vựng sẽ được gửi tới Openverse để tìm ảnh")
- limited to the word or its gloss, never sentences

Record the exception in CLAUDE.md. If the owner rejects it, ship only manual upload or paste of images, through Phase 4b.

## Scope

- **`lib/anki/imageQuery.ts`**: a faithful port of `clean_meaning` and `get_local_heuristic_query`, with golden tests. The Gemini path is dropped: it needs a key and would send user data out.
- **`lib/anki/imageSearch.ts`**: an Openverse client with a Wikimedia fallback. At most 4 requests run at once. Each result includes a thumbnail, the full URL, the license and the attribution.
- **Image step on `/tools/anki`**: each word shows 4–6 candidates; the user picks one or skips. The attribution goes into the card, as CC licenses require.
- **`lib/anki/ankiConnect.ts`**: talks to `http://localhost:8765`, protocol version 6.
  - `findNotes` (deck query) → `notesInfo` → keep the notes whose image field is empty.
  - `multi[storeMediaFile{url, filename}]`, then `multi[updateNoteFields]`. This is the same flow as the Python script.
  - The deck name and the field mapping can be set in the UI.
- **Setup guide** in Vietnamese:
  1. install AnkiConnect (add-on code 2055492159)
  2. add the site origin to `webCorsOriginList`
  3. restart Anki

## Tests

- Golden test of the query heuristic against Python.
- Request-builder tests with `fetch` mocked: the payload shape and the batching.

## Verification

- `npm test` and `npm run build` pass.
- Manual run against a real Anki desktop with a deck of 10 cards: the images appear and existing images are not overwritten.
- The Network tab shows no search requests unless the user opted in.
