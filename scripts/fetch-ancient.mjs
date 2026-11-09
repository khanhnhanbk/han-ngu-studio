#!/usr/bin/env node
/**
 * pnpm fetch:ancient — one-off: download old glyph forms (giáp cốt, kim văn,
 * đại triện, tiểu triện) for every HSK 3.0 character from the Wikimedia
 * Commons "Ancient Chinese characters project" (phase 12d; source approved by
 * the owner on 2026-11-09, see docs/plans/2026-11-09-glyph-evolution-sources.md).
 *
 * For each character it looks up File:<char>-{oracle,bronze,bigseal,seal}.svg,
 * first by the Simplified form, then by the OpenCC Traditional form (Commons
 * names most files by the Traditional character). Only files whose licence is
 * "Public domain" or "CC0" are kept; each SVG is cleaned (scripts/lib/
 * ancient.mjs) and written to
 *   assets/ancient/glyphs.json    { 车: { oracle: "<svg …>", … }, … }
 *   assets/ancient/manifest.tsv   char, form, Commons file, licence, sha1, upload time
 * Both are committed; `pnpm build:data` shards glyphs.json into
 * public/data/ancient/. The site never loads anything from Commons.
 *
 * Downloads are cached in node_modules/.cache/acc/ (by sha1), so a re-run only
 * fetches new or changed files. Polite to the API: one request at a time, a
 * descriptive User-Agent, maxlag, and Retry-After on 429/503.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as OpenCC from "opencc-js";

import { ANCIENT_FORMS, ANCIENT_LICENCES, cleanSvg } from "./lib/ancient.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "assets/ancient");
const CACHE = join(ROOT, "node_modules/.cache/acc");
const API = "https://commons.wikimedia.org/w/api.php";
const UA = "HanNguStudioBuild/1.0 (https://github.com/khanhnhanbk/han-ngu-studio; one-off data fetch)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, as = "json") {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) return as === "json" ? res.json() : res.text();
    if (res.status !== 429 && res.status < 500) throw new Error(`HTTP ${res.status} for ${url}`);
    const wait = Math.min(Number(res.headers.get("retry-after")) || 10, 120);
    console.warn(`HTTP ${res.status}, waiting ${wait}s`);
    await sleep(wait * 1000);
  }
  throw new Error(`gave up on ${url}`);
}

/** title → { url, sha1, timestamp, licence } for the files that exist. */
async function lookup(titles) {
  const found = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      formatversion: "2",
      maxlag: "5",
      prop: "imageinfo",
      iiprop: "url|sha1|timestamp|extmetadata",
      iiextmetadatafilter: "LicenseShortName",
      titles: titles.slice(i, i + 50).join("|"),
    });
    const data = await get(`${API}?${params}`);
    for (const page of data.query?.pages ?? []) {
      const info = page.imageinfo?.[0];
      if (page.missing || !info) continue;
      found.set(page.title, {
        url: info.url.split("?")[0],
        sha1: info.sha1,
        timestamp: info.timestamp,
        licence: info.extmetadata?.LicenseShortName?.value ?? "",
      });
    }
    process.stdout.write(`\rlooked up ${Math.min(i + 50, titles.length)}/${titles.length}`);
    await sleep(1000);
  }
  process.stdout.write("\n");
  return found;
}

const vocab = JSON.parse(readFileSync(join(ROOT, "public/data/vocab.json"), "utf-8"));
const chars = [];
for (const word of Object.keys(vocab)) {
  for (const c of word) if (/\p{Script=Han}/u.test(c) && !chars.includes(c)) chars.push(c);
}
const toTrad = OpenCC.Converter({ from: "cn", to: "t" });
const title = (c, form) => `File:${c}-${form}.svg`;

console.log(`${chars.length} HSK characters`);
const bySimp = await lookup(chars.flatMap((c) => ANCIENT_FORMS.map((f) => title(c, f))));
// Traditional names for the forms not found under the Simplified one.
const tradTitles = [];
for (const c of chars) {
  const t = toTrad(c);
  if (t === c) continue;
  for (const f of ANCIENT_FORMS) if (!bySimp.has(title(c, f))) tradTitles.push(title(t, f));
}
const byTrad = await lookup(tradTitles);

mkdirSync(OUT, { recursive: true });
mkdirSync(CACHE, { recursive: true });
const glyphs = {};
const manifest = [["char", "form", "file", "licence", "sha1", "uploaded"].join("\t")];
const skipped = { licence: 0, unclean: 0 };
let downloaded = 0;
for (const c of chars) {
  for (const form of ANCIENT_FORMS) {
    const t = bySimp.has(title(c, form)) ? title(c, form) : title(toTrad(c), form);
    const info = bySimp.get(t) ?? byTrad.get(t);
    if (!info) continue;
    if (!ANCIENT_LICENCES.has(info.licence)) {
      skipped.licence++;
      continue;
    }
    const cached = join(CACHE, `${info.sha1}.svg`);
    if (!existsSync(cached)) {
      writeFileSync(cached, await get(info.url, "text"));
      downloaded++;
      await sleep(300);
    }
    const svg = cleanSvg(readFileSync(cached, "utf-8"));
    if (!svg) {
      skipped.unclean++;
      continue;
    }
    (glyphs[c] ??= {})[form] = svg;
    manifest.push([c, form, t.slice("File:".length), info.licence, info.sha1, info.timestamp].join("\t"));
  }
  if (glyphs[c]) process.stdout.write(`\r${Object.keys(glyphs).length} characters with forms, ${downloaded} downloaded`);
}
process.stdout.write("\n");

writeFileSync(join(OUT, "glyphs.json"), JSON.stringify(glyphs));
writeFileSync(join(OUT, "manifest.tsv"), manifest.join("\n") + "\n");
console.log(
  `${Object.keys(glyphs).length} characters, ${manifest.length - 1} files; skipped ${skipped.licence} (licence), ${skipped.unclean} (not a plain drawing)`,
);
