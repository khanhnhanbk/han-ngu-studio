import { Heap, compareTuples } from "./heap";

/** One input line. `words` are its segmented tokens. */
export interface OrderInput {
  text: string;
  words: string[];
}

export interface OrderedRow {
  text: string;
  /** Original 0-based position in the input, blank lines included. */
  idx: number;
  newWords: string[];
  newCount: number;
}

export interface OrderSummary {
  zero: number;
  one: number;
  twoPlus: number;
  distinctNewWords: number;
}

const MISSING_FREQ = 999999;
const LONG_THRESHOLD = 25;

/**
 * Compare strings by Unicode code point, like Python's str ordering.
 * JS default sort / localeCompare are wrong here: UTF-16 puts surrogate
 * pairs (U+D800-DFFF) below U+E000-U+FFFF, but non-BMP code points are
 * greater than every BMP code point.
 */
export function codePointCompare(a: string, b: string): number {
  const x = Array.from(a);
  const y = Array.from(b);
  const n = Math.min(x.length, y.length);
  for (let i = 0; i < n; i++) {
    const p = x[i].codePointAt(0) as number;
    const q = y[i].codePointAt(0) as number;
    if (p !== q) return p < q ? -1 : 1;
  }
  return x.length - y.length;
}

interface Entry {
  key: number[];
}

/**
 * Greedy N+1 ordering: repeatedly emit the sentence with the smallest
 * key (is_long, unknown_count, best_freq, -known_count, idx, version, sid),
 * then treat its new words as known. Blank lines are skipped but keep
 * their idx. Lazy priority queue: stale entries are skipped on pop.
 * known_count = number of distinct words of the sentence that are known.
 */
export function orderSentences(
  sentences: OrderInput[],
  known: Set<string>,
  freqRank: Map<string, number>,
): OrderedRow[] {
  const knownNow = new Set(known);
  // Distinct words per sentence (Python set; order irrelevant as we sort).
  const items: { idx: number; text: string; words: string[] }[] = [];
  sentences.forEach((s, idx) => {
    if (!s.text.trim()) return; // Python strip() vs JS trim(): see freq.ts
    items.push({ idx, text: s.text, words: [...new Set(s.words)] });
  });

  const wordToSids = new Map<string, number[]>();
  items.forEach((it, sid) => {
    for (const w of it.words) {
      const l = wordToSids.get(w);
      if (l) l.push(sid);
      else wordToSids.set(w, [sid]);
    }
  });

  const version = items.map(() => 0);
  const done = items.map(() => false);
  // Python len(str) counts code points; JS .length counts UTF-16 units.
  const isLong = items.map((it) =>
    Array.from(it.text).length > LONG_THRESHOLD ? 1 : 0,
  );

  const makeKey = (sid: number): number[] => {
    const unknown = items[sid].words.filter((w) => !knownNow.has(w));
    let best = MISSING_FREQ;
    for (const w of unknown) {
      const f = freqRank.get(w);
      if (f !== undefined && f < best) best = f;
    }
    const knownCount = items[sid].words.length - unknown.length;
    return [
      isLong[sid],
      unknown.length,
      best,
      -knownCount,
      items[sid].idx,
      version[sid],
      sid,
    ];
  };

  // JS has no tuple comparison, so compareTuples emulates Python's.
  const heap = new Heap<Entry>((a, b) => compareTuples(a.key, b.key));
  items.forEach((_, sid) => heap.push({ key: makeKey(sid) }));

  const rows: OrderedRow[] = [];
  for (let e = heap.pop(); e; e = heap.pop()) {
    const sid = e.key[6];
    if (done[sid] || e.key[5] !== version[sid]) continue;
    done[sid] = true;
    const newWords = items[sid].words
      .filter((w) => !knownNow.has(w))
      .sort(codePointCompare);
    rows.push({
      text: items[sid].text,
      idx: items[sid].idx,
      newWords,
      newCount: newWords.length,
    });
    // Set iteration is insertion-ordered in JS; the resulting pushes do not
    // affect order because the heap key is a total order (sid is unique).
    const affected = new Set<number>();
    for (const w of newWords) {
      knownNow.add(w);
      for (const s of wordToSids.get(w) ?? []) if (!done[s]) affected.add(s);
    }
    for (const s of affected) {
      version[s]++;
      heap.push({ key: makeKey(s) });
    }
  }
  return rows;
}

export function summarize(rows: OrderedRow[]): OrderSummary {
  const learned = new Set<string>();
  let zero = 0;
  let one = 0;
  let twoPlus = 0;
  for (const r of rows) {
    if (r.newCount === 0) zero++;
    else if (r.newCount === 1) one++;
    else twoPlus++;
    r.newWords.forEach((w) => learned.add(w));
  }
  return { zero, one, twoPlus, distinctNewWords: learned.size };
}
