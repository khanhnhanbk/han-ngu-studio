import { memoJson } from "@/lib/fetchJson";

import { cvdictShard, type CvdictShard } from "./lookup";

/** Site path of the shard that holds `word`. */
export function cvdictFile(word: string): string {
  return `/data/cvdict/${cvdictShard(word)}.json`;
}

/** Site paths of the shards the words need (for confirmDownload), distinct. */
export function cvdictFiles(words: readonly string[]): string[] {
  return [...new Set(words.filter(Boolean).map(cvdictFile))];
}

const loaders = new Map<string, () => Promise<CvdictShard>>();

/** Fetch the shard that holds `word` once (memoised per shard; retried after a failure). */
export function loadCvdictShard(word: string): Promise<CvdictShard> {
  const file = cvdictFile(word);
  let load = loaders.get(file);
  if (!load) loaders.set(file, (load = memoJson<CvdictShard>(file)));
  return load();
}
