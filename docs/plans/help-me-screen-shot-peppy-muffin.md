# README screenshots

## Context
The GitHub README has no visuals, and its Status/Structure sections are out of date (they list removed components such as Testimonials and Pricing). The goal is to add real screenshots of the landing page and the 5 live tools to the repo and show them in the README, so visitors to the GitHub page can see what the site does.

## Approach

### 1. Capture screenshots (Playwright, temporary, not added to deps)
- Build and serve the current `main` locally: `pnpm build && pnpm start` (port 3000). This shows exactly what is committed, which is the same as the live site after deploy.
- Write a throwaway script in the scratchpad (not the repo) that uses `pnpm dlx playwright` / `npx -y playwright@<pinned>` with Chromium (`playwright install chromium`; no browser is installed on this WSL machine yet).
- Viewport 1280×800 at deviceScaleFactor 2 for sharp images, light theme by default, plus one dark-mode shot of the landing page (`colorScheme: 'dark'`).
- For each tool: fill the `<textarea>` with a short sample sentence (e.g. `我们一起学习中文。今天天气很好。`), click the action button (Segment / Convert / Build; the practice sheet renders live through `useEffect`), wait for the result, then take a screenshot. The Hán Việt shot also clicks a word to open the details panel.
- Shots (PNG, then compressed with `pngquant`/`oxipng` if available so each file stays under about 300 KB):
  - `landing.png` (hero, above the fold), `landing-dark.png`
  - `practice-sheet.png`, `segment.png`, `pinyin.png`, `hanviet.png`, `anki.png`
- Look at every image (Read tool) before committing, to check that it is not blank, half-loaded or broken.

### 2. Save in the repo
- `docs/screenshots/*.png`
- Add `docs` to `.vercelignore` so the images are not uploaded with the Vercel deploy (they are only for GitHub).

### 3. Update `README.md`
- Add a live-site link and a hero image (`landing.png`) at the top.
- Add a "Screenshots" section: one heading per tool with its image, linking to the tool route on https://han-ngu-studio.vercel.app.
- Light cleanup: refresh the stale Structure block (drop Testimonials/Pricing, add the pinyin/hanviet/anki routes, `lib/` folders, `scripts/`, `assets/`). Keep the rest of the README as it is.
- Keep the data credits (CC-CEDICT, pywubi) by adding a short Credits line, since the README now shows those tools.

### 4. Commit
- One commit: `docs(readme): add screenshots of landing page and tools`, ending with the Co-Authored-By line. Push to `origin/main` only after the user confirms.

## Files
- `docs/screenshots/*.png` (new)
- `README.md`
- `.vercelignore`

## Verification
- Open each PNG to check it visually.
- `pnpm build` still succeeds (no code changes, but this is the project rule).
- Preview the README locally (relative image paths `docs/screenshots/...` resolve on GitHub). After pushing, check the rendered README on github.com/khanhnhanbk/han-ngu-studio.
