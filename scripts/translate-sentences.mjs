// Translate the Tatoeba example sentences to Vietnamese and English with the
// Google Cloud Translation API (v2), once, offline. Run by hand:
//
//   GOOGLE_TRANSLATE_API_KEY=… node scripts/translate-sentences.mjs [--limit N] [--yes]
//
// Results are appended to assets/dictionary/sentences_tatoeba_mt.tsv and
// committed, so the site never calls a translation service. Sentences already
// in the cache, or already translated by hand in sentences.tsv, are skipped,
// so the script can be stopped and run again at any time (quota, crash).
// Never run in CI or on Vercel.

import { appendFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

import { readCsvFrom } from "./lib/csv.mjs";
import {
  MT_FILE,
  MT_HEADER,
  normalizeSentence,
  readMachineTranslations,
  tatoebaRows,
  tsvCell,
} from "./lib/sentences.mjs";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "assets/dictionary");
const ENDPOINT = "https://translation.googleapis.com/language/translate/v2";
// v2 accepts up to 128 strings per request; stay well under its size limit.
const BATCH = 100;
// Same test as build-data.mjs: a Vietnamese cell holding Hán Việt is no translation.
const HANVIET_NOT_TRANSLATION = /\S_\S|\s。$/;

function parseArgs(argv) {
  const args = { limit: Infinity, yes: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--yes") args.yes = true;
    else if (argv[i] === "--limit") args.limit = Number.parseInt(argv[++i], 10);
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!(args.limit > 0)) throw new Error("--limit must be a positive number");
  return args;
}

/** Google returns HTML entities even with format=text for a few characters. */
function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

async function translate(key, texts, target) {
  const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: texts, source: "zh-CN", target, format: "text" }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const body = await res.json();
  const out = body?.data?.translations?.map((t) => decodeEntities(t.translatedText));
  if (!Array.isArray(out) || out.length !== texts.length) throw new Error("unexpected response");
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key) throw new Error("set GOOGLE_TRANSLATE_API_KEY");

  const done = readMachineTranslations(SRC);
  const human = new Set(
    readCsvFrom(SRC, "sentences.tsv", "\t")
      .filter((r) => r.Vietnamese?.trim() && !HANVIET_NOT_TRANSLATION.test(r.Vietnamese))
      .map((r) => normalizeSentence(r.Hanzi ?? "")),
  );
  // One request per distinct sentence, under its first Tatoeba ID.
  const todo = new Map();
  for (const r of tatoebaRows((name) => readCsvFrom(SRC, name))) {
    if (!done.has(r.hanzi) && !human.has(r.hanzi) && !todo.has(r.hanzi)) todo.set(r.hanzi, r.id);
  }
  const queue = [...todo].slice(0, args.limit);
  const chars = queue.reduce((n, [hanzi]) => n + Array.from(hanzi).length, 0);
  console.log(
    `${done.size} sentences already translated, ${todo.size} to go.\n` +
      `This run: ${queue.length} sentences, ${chars} characters × 2 languages = ${chars * 2} billed characters.`,
  );
  if (queue.length === 0) return;
  if (!args.yes) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question("Continue? [y/N] ");
    rl.close();
    if (answer.trim().toLowerCase() !== "y") return;
  }

  const file = join(SRC, MT_FILE);
  if (!existsSync(file)) writeFileSync(file, MT_HEADER.join("\t") + "\n");
  for (let i = 0; i < queue.length; i += BATCH) {
    const batch = queue.slice(i, i + BATCH);
    const texts = batch.map(([hanzi]) => hanzi);
    const [vi, en] = await Promise.all([translate(key, texts, "vi"), translate(key, texts, "en")]);
    // Appended per batch, so a later failure keeps everything before it.
    appendFileSync(
      file,
      batch.map(([hanzi, id], j) => [id, hanzi, tsvCell(vi[j]), tsvCell(en[j])].join("\t")).join("\n") + "\n",
    );
    console.log(`${Math.min(i + BATCH, queue.length)} / ${queue.length}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
