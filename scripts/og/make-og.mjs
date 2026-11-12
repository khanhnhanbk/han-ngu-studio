// Draws the per-tool link-preview images (1200×630 PNG) into public/og/.
//
//   node scripts/og/make-og.mjs                 # write public/og/*.png and public/og/en/*.png
//   node scripts/og/make-og.mjs --check <dir>   # also write the centre-square crops to <dir>
//
// Needs Playwright with Chromium and network access to Google Fonts (Be Vietnam Pro,
// Noto Sans SC), only when the images are redrawn; the site serves the PNGs as static files.
//
// Facebook comments, Messenger and Zalo crop the image to the centre 630×630 square
// (x 285–915), so every word and the main character tile must sit inside it. The script
// measures each element after layout and stops with an error if anything spills out.
// See docs/plans/2026-11-10-link-preview.md and docs/plans/2026-11-12-tool-link-previews.md.
import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { EN_HOME, TOOLS } from "./tools.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "public", "og");
const W = 1200;
const H = 630;
const SAFE = { left: (W - H) / 2, right: (W + H) / 2 }; // 285–915
const MAX_TEXT = 590; // widest line, leaves a margin inside the square

const checkIdx = process.argv.indexOf("--check");
const checkDir = checkIdx > -1 ? process.argv[checkIdx + 1] : null;

const SUBLINE = { vi: "Hán Ngữ Studio · miễn phí", en: "Hán Ngữ Studio · free" };

const lines = (title) => (Array.isArray(title) ? title.join("<br>") : title);

function html({ char, title, subline, home }) {
  const tile = home
    ? `<div class="main tile gold"><span>${char}</span></div>`
    : `<div class="main tile grid"><svg viewBox="0 0 100 100" aria-hidden="true">
         <path d="M0 0L100 100M100 0L0 100M50 0V100M0 50H100" /></svg><span>${char}</span></div>`;
  // Side tiles are decoration only: they fall outside the square crop.
  const deco = (left, top, faint) =>
    `<div class="deco${faint ? " faint" : ""}" style="left:${left}px;top:${top}px"><svg viewBox="0 0 100 100"><path d="M0 0L100 100M100 0L0 100M50 0V100M0 50H100" /></svg><span>${char}</span></div>`;
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@700;800&family=Noto+Sans+SC:wght@500&display=block" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
  body { background: linear-gradient(180deg, #FCF8E8 0%, #FFFFFF 100%); font-family: "Be Vietnam Pro", sans-serif; color: #0F172A; position: relative; }
  .stack { position: absolute; left: ${SAFE.left}px; width: ${H}px; top: 0; height: ${H}px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .tile { width: 240px; height: 240px; border-radius: 40px; position: relative; display: flex; align-items: center; justify-content: center; }
  .tile span { font-family: "Noto Sans SC", sans-serif; font-weight: 500; font-size: 168px; line-height: 1; position: relative; }
  .tile.gold { background: #D4AF37; box-shadow: 0 18px 40px rgba(138, 109, 31, .25); }
  .tile.grid { background: #FFFFFF; border: 5px solid #D4AF37; box-shadow: 0 18px 40px rgba(138, 109, 31, .18); }
  .tile svg, .deco svg { position: absolute; inset: 0; width: 100%; height: 100%; }
  .tile svg path { stroke: #EBD9A0; stroke-width: 1; stroke-dasharray: 3 3; fill: none; vector-effect: non-scaling-stroke; }
  .title { margin-top: 36px; text-align: center; font-weight: 800; font-size: 68px; line-height: 1.12; white-space: nowrap; letter-spacing: -0.01em; }
  .sub { margin-top: 14px; font-weight: 700; font-size: 34px; line-height: 1.2; color: #8A6D1F; white-space: nowrap; }
  .deco { position: absolute; width: 168px; height: 168px; border: 3px solid #EBD9A0; border-radius: 14px; background: rgba(255,255,255,.7); display: flex; align-items: center; justify-content: center; }
  .deco svg path { stroke: #F1E4BC; stroke-width: 1; fill: none; vector-effect: non-scaling-stroke; }
  .deco span { font-family: "Noto Sans SC", sans-serif; font-size: 118px; line-height: 1; color: #0F172A; position: relative; }
  .deco.faint span { color: #CBD5E1; }
</style></head><body>
  ${deco(60, 132, false)}
  ${deco(60, 330, true)}
  ${deco(972, 132, false)}
  ${deco(972, 330, true)}
  <div class="stack">
    ${tile}
    <div class="main title">${lines(title)}</div>
    <div class="main sub">${subline}</div>
  </div>
</body></html>`;
}

const jobs = [];
for (const t of TOOLS) {
  jobs.push({ out: join(OUT, `${t.file}.png`), char: t.char, title: t.vi, subline: SUBLINE.vi });
  jobs.push({ out: join(OUT, "en", `${t.file}.png`), char: t.char, title: t.en, subline: SUBLINE.en });
}
jobs.push({ out: join(OUT, "en", `${EN_HOME.file}.png`), char: EN_HOME.char, title: EN_HOME.en, subline: EN_HOME.tagline, home: true });

mkdirSync(join(OUT, "en"), { recursive: true });
if (checkDir) mkdirSync(checkDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const problems = [];
for (const job of jobs) {
  await page.setContent(html(job), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  // Shrink a long title a little (down to 56 px) until it fits; it never wraps by itself.
  const size = await page.evaluate((max) => {
    const el = document.querySelector(".title");
    let px = el.querySelector("br") ? 62 : 68;
    while (el.getBoundingClientRect().width > max && px > 56) el.style.fontSize = `${--px}px`;
    return px;
  }, MAX_TEXT);
  const boxes = await page.$$eval(".main", (els) => els.map((e) => e.getBoundingClientRect().toJSON()));
  for (const b of boxes) {
    if (b.left < SAFE.left || b.right > SAFE.right || b.top < 0 || b.bottom > H || b.width > MAX_TEXT + 1) {
      problems.push(`${job.out}: "${[job.title].flat().join(" ")}" box ${Math.round(b.left)}–${Math.round(b.right)} outside ${SAFE.left}–${SAFE.right}`);
    }
  }
  await page.screenshot({ path: job.out });
  if (checkDir) {
    const name = job.out.slice(OUT.length + 1).replaceAll("/", "-");
    await page.screenshot({ path: join(checkDir, `square-${name}`), clip: { x: SAFE.left, y: 0, width: H, height: H } });
  }
  console.log(`${job.out.slice(ROOT.length + 1)}  title ${size}px`);
}
await browser.close();
if (problems.length) {
  console.error(`\nOutside the centre square:\n${problems.join("\n")}`);
  process.exit(1);
}
