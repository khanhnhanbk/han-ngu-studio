import { memoJson } from "@/lib/fetchJson";

import { MACHINE_TRANSLATED, type Example, type ExampleBank, type ExampleManifest, type ExampleRow, type ExampleShard } from "./types";

const MANIFEST_FILE = "/data/examples/manifest.json";
const shardFile = (name: string) => `/data/examples/${name}.json`;

export const loadManifest = memoJson<ExampleManifest>(MANIFEST_FILE);

const shardLoaders = new Map<string, () => Promise<ExampleShard>>();

function loadShard(name: string): Promise<ExampleShard> {
  if (!shardLoaders.has(name)) shardLoaders.set(name, memoJson<ExampleShard>(shardFile(name)));
  return shardLoaders.get(name)!();
}

export function toExample([hanzi, vi, en, flags]: ExampleRow, order: number): Example {
  return { hanzi, vi, en, machine: (flags & MACHINE_TRANSLATED) !== 0, order };
}

/** The candidates for `words`, from shards already in memory. */
export function bankFrom(
  manifest: ExampleManifest,
  shards: ReadonlyMap<string, ExampleShard>,
  words: Iterable<string>,
): ExampleBank {
  const bank: ExampleBank = {};
  for (const word of words) {
    if (Object.hasOwn(bank, word) || !Object.hasOwn(manifest.words, word)) continue;
    const shard = shards.get(manifest.words[word]);
    if (!shard || !Object.hasOwn(shard.index, word)) continue;
    bank[word] = shard.index[word].map((id, i) => toExample(shard.rows[id], i));
  }
  return bank;
}

/** Fetch only the shards `words` live in, and return their candidates. */
export async function loadExamples(words: readonly string[]): Promise<ExampleBank> {
  const manifest = await loadManifest();
  const names = new Set<string>();
  for (const w of words) if (Object.hasOwn(manifest.words, w)) names.add(manifest.words[w]);
  const shards = new Map(await Promise.all([...names].map(async (n) => [n, await loadShard(n)] as const)));
  return bankFrom(manifest, shards, words);
}

/** Files loadExamples(words) downloads (for lib/data/budget.ts). */
export async function exampleFiles(words: readonly string[]): Promise<string[]> {
  const manifest = await loadManifest();
  const names = new Set<string>();
  for (const w of words) if (Object.hasOwn(manifest.words, w)) names.add(manifest.words[w]);
  return [MANIFEST_FILE, ...[...names].map(shardFile)];
}

/** Files loadLevelSentences(level) downloads. */
export async function levelFiles(level: string): Promise<string[]> {
  const manifest = await loadManifest();
  return [MANIFEST_FILE, ...Object.keys(manifest.shards).filter((n) => manifest.shards[n] === level).map(shardFile)];
}

/** Every sentence listed under the words of one HSK level ("1" … "7-9"), once each. */
export async function loadLevelSentences(level: string): Promise<ExampleRow[]> {
  const manifest = await loadManifest();
  const names = Object.keys(manifest.shards).filter((n) => manifest.shards[n] === level);
  const shards = await Promise.all(names.map(loadShard));
  const seen = new Set<string>();
  const out: ExampleRow[] = [];
  for (const shard of shards) {
    for (const row of shard.rows) {
      if (!seen.has(row[0])) {
        seen.add(row[0]);
        out.push(row);
      }
    }
  }
  return out;
}
