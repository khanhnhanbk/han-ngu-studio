# Phase 0: Segmentation port to the browser (~600 LOC)

**Depends on:** nothing. Phases 1–3 depend on this one.

## Context

`/tools/segment` still calls the legacy Python API (`/api/py/segment`, FastAPI on Vercel). CLAUDE.md forbids any backend, and every later tool (Pinyin, Hán Việt, Anki) needs a tokenizer in the browser.

This phase ports `api/_core/tokenizer.py` to TypeScript, adds Vitest with golden tests, switches the page over to the TS tokenizer, and deletes the Python code.

Facts checked against the repo:
- `api/data/word_list.txt`: 118,613 lines, no empty lines and no duplicates; the longest word is 19 characters. We ship it as-is, so live results don't change.
- Python's `HAN_RE` covers only the BMP ranges (`一-鿿`, `㐀-䶿`). A character such as 𠀀 (U+20000) becomes an "other" token, and the port must reproduce that.

## Steps

1. **Move the data**: `git mv api/data/word_list.txt public/data/word_list.txt`. It is served statically and lazy-fetched, and Vercel gzips it.
2. **`lib/segment/tokenizer.ts`**: a faithful port, pure logic, no fetch.
   - Costs are `log(idx+1) - 2.5*(cpLen-1)`. `idx` counts every line. Duplicate words take the later rank (dict semantics). The OOV cost is `log(size+1)`.
   - The DAG and the Viterbi pass run on code points. On ties the first candidate wins, matching Python's `min()`.
   - **Performance, with identical output**: fragments longer than the longest dictionary word are not built. Python built them, but they can never match anything.
   - `splitRuns`, `segment` and `joinTokens` match Python exactly.
3. **`lib/segment/load.ts`**: a memoised `fetch('/data/word_list.txt')` that resets on failure so the user can retry.
4. **Golden data**: generated from Python before deleting it, with a scratch script that is not committed. Output: `lib/segment/__golden__/segment.json`. Inputs:
   - the API test cases
   - about 40 sentences from `assets/dictionary/sentences.tsv`
   - edge cases: `\r\n`, an empty line, Latin text and digits, a character outside the BMP, `　`, a long run of 3000+ Han characters, and mixed brackets
5. **Vitest**: `npm test`, `vitest.config.ts` with the `@` alias, and `lib/segment/tokenizer.test.ts`. It also includes a test that the length cutoff gives the same result as the uncapped DAG.
6. **UI**: `app/tools/segment/page.tsx` uses the TS tokenizer. The 5000 limit is counted in code points, and there is a "loading dictionary" state.
7. **Remove legacy code**:
   - `api/`
   - `requirements.txt`
   - `vercel.json`
   - the `rewrites` block in `next.config.js`
   - `lib/api.ts`
   - the `dev:api` script
   - the Python entries in `.vercelignore` and `.gitignore`
8. **Docs**: update CLAUDE.md and README.md.
9. **Commit** on `main`. Do not push.

## Verification

- `npm test`: every golden case matches.
- `npm run build` succeeds, with no `/api` routes.
- In `npm run dev`, open `/tools/segment`:
  - `我喜欢学习中文。` gives `我 喜欢 学习 中文。`
  - `今天天气很好，我们去公园吧。` gives `今天 天气 很 好，我们 去 公园 吧。`
  - The only network request is `word_list.txt`.
