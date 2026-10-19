#!/usr/bin/env node
/**
 * pnpm build:audio — pack the audio-cmn human recordings into shards.
 *
 * Source: https://github.com/hugolpz/audio-cmn at a pinned commit, folders
 * 24k-abr/hsk (words and characters, speaker Yue Tan) and 24k-abr/syllabs
 * (toned syllables, speaker Chen Wang), CC-BY-SA (assets/dictionary/
 * LICENSE-audio-cmn.txt). Run once; the output in public/data/audio/ is
 * committed. Then run `pnpm build:data` so sizes.json lists the shards.
 *
 * Output:
 *   public/data/audio/w-<n>.bin, s-<n>.bin  MP3 files concatenated, ~64 KB each
 *   public/data/audio/index.json            { commit, words: { 学习: [shard, offset, length] },
 *                                             syllables: { hang2: [...] } }
 * The MP3 bytes are copied unchanged; the browser slices one file out of a
 * shard and decodes it (lib/speech/audio.ts).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = "https://github.com/hugolpz/audio-cmn.git";
// Pinned: v2.x layout (24k-abr, ü written as v, no neutral-tone syllables).
const COMMIT = "59dbafbda8b172ffc3b8b295cd5938ae1b3de803";
const FOLDERS = ["24k-abr/hsk", "24k-abr/syllabs"];
const CACHE = join(ROOT, "node_modules/.cache/audio-cmn");
const OUT = join(ROOT, "public/data/audio");
const SHARD_BYTES = 64 * 1024;

const git = (...args) => execFileSync("git", ["-C", CACHE, ...args], { stdio: ["ignore", "ignore", "inherit"] });

/** Sparse, blob-filtered checkout of just the two folders at COMMIT. */
function fetchSource() {
  if (!existsSync(join(CACHE, ".git"))) {
    mkdirSync(CACHE, { recursive: true });
    git("init", "-q");
    git("remote", "add", "origin", REPO);
  }
  git("sparse-checkout", "set", ...FOLDERS);
  git("fetch", "-q", "--depth", "1", "--filter=blob:none", "origin", COMMIT);
  git("checkout", "-q", "--force", COMMIT);
}

/** [key, bytes] for the files of one folder; `keyOf` returns null to skip a file. */
function readFolder(folder, keyOf) {
  const dir = join(CACHE, folder);
  const out = [];
  for (const name of readdirSync(dir)) {
    const key = keyOf(name);
    if (key) out.push([key, readFileSync(join(dir, name))]);
  }
  // Code-point order, so the packing is the same on every machine.
  return out.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

// cmn-学习.mp3 → 学习. Skip the curated phrase patterns ("一_也_").
const wordKey = (name) => {
  const m = /^cmn-(.+)\.mp3$/.exec(name.normalize("NFC"));
  return m && !m[1].includes("_") && /^\p{Script=Han}+$/u.test(m[1]) ? m[1] : null;
};
// cmn-hang2.mp3 → hang2 (tones 1–4, ü as v). Skip "_hm1" and the like.
const syllableKey = (name) => {
  const m = /^cmn-([a-z]+[1-4])\.mp3$/.exec(name);
  return m ? m[1] : null;
};

/** Pack files into shards of about SHARD_BYTES; returns the index entries. */
function pack(entries, prefix) {
  const index = {};
  let shard = 0;
  let parts = [];
  let size = 0;
  const flush = () => {
    if (!parts.length) return;
    writeFileSync(join(OUT, `${prefix}-${shard}.bin`), Buffer.concat(parts));
    shard++;
    parts = [];
    size = 0;
  };
  for (const [key, bytes] of entries) {
    if (size > 0 && size + bytes.length > SHARD_BYTES) flush();
    index[key] = [shard, size, bytes.length];
    parts.push(bytes);
    size += bytes.length;
  }
  flush();
  return { index, shards: shard };
}

fetchSource();
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const words = pack(readFolder(FOLDERS[0], wordKey), "w");
const syllables = pack(readFolder(FOLDERS[1], syllableKey), "s");
writeFileSync(join(OUT, "index.json"), JSON.stringify({ commit: COMMIT, words: words.index, syllables: syllables.index }));
console.log(
  `audio/: ${Object.keys(words.index).length} words in ${words.shards} shards, ` +
    `${Object.keys(syllables.index).length} syllables in ${syllables.shards} shards (audio-cmn ${COMMIT.slice(0, 7)})`,
);
