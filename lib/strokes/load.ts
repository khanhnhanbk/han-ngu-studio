import type { StrokeData, StrokeShard } from "./types";

// Must match STROKE_SHARD_BITS in scripts/build-data.mjs.
const SHARD_BITS = 6;

/** Shard file name (without .json) holding a character's stroke data. */
export function shardKey(char: string): string {
  const cp = char.codePointAt(0);
  if (cp === undefined) throw new Error("empty character");
  return (cp >> SHARD_BITS).toString(16);
}

const pending = new Map<string, Promise<StrokeShard>>();

/** Fetch one shard once (memoised; retried after a failure). */
function loadShard(key: string): Promise<StrokeShard> {
  let p = pending.get(key);
  if (!p) {
    p = fetch(`/data/strokes/${key}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<StrokeShard>;
      })
      .catch((err: unknown) => {
        pending.delete(key);
        throw err;
      });
    pending.set(key, p);
  }
  return p;
}

/**
 * Stroke data for each distinct character. Characters without data are left
 * out of the map. A shard that does not exist (404) means none of its
 * characters have data; other failures reject.
 */
export async function loadStrokes(
  chars: Iterable<string>,
): Promise<Map<string, StrokeData>> {
  const unique = Array.from(new Set(chars));
  const keys = Array.from(new Set(unique.map(shardKey)));
  const shards = new Map<string, StrokeShard>();
  await Promise.all(
    keys.map(async (key) => {
      try {
        shards.set(key, await loadShard(key));
      } catch (err) {
        if (err instanceof Error && err.message === "HTTP 404") {
          shards.set(key, {});
          return;
        }
        throw err;
      }
    }),
  );
  const out = new Map<string, StrokeData>();
  for (const char of unique) {
    const shard = shards.get(shardKey(char));
    if (shard && Object.hasOwn(shard, char)) out.set(char, shard[char]);
  }
  return out;
}

/** Stroke data for one character, or null when there is none. */
export async function loadStroke(char: string): Promise<StrokeData | null> {
  return (await loadStrokes([char])).get(char) ?? null;
}
