import { segment, type Tokenizer } from "@/lib/segment/tokenizer";
import type { VocabData } from "@/lib/vocab/lookup";

/**
 * Common phrases ("cụm từ") with a word, found in the example sentences that
 * contain it (lib/examples loadSentencesWith), by part of speech (HSK list):
 * - a verb with the noun or adjective after it (打扫房间, 打扫干净),
 * - a noun after a verb, adjective or noun (整理房间, 新鲜空气, 酒店房间),
 *   or before another noun (体育记者),
 * - an adjective before a noun (蓝眼睛), a verb after an adjective (认真学习).
 * The other word must be an HSK word of two or more characters (one-character
 * neighbours are mostly grammar: 了, 是, 在, 里) and not a helper verb
 * (没有, 可以, 应该…), and the pair must occur in at least MIN_COUNT
 * different sentences, so one odd sentence is not taken as a phrase. No
 * phrase is better than a made-up one, so many words get none.
 */
export const MIN_COUNT = 2;
export const MAX_PHRASES = 3;

const HAN = /^\p{Script=Han}{2,}$/u;
/** Two-character words tagged V that mostly act as helpers, not as the head of a phrase. */
const HELPERS = new Set([
  "没有",
  "可以",
  "应该",
  "开始",
  "能够",
  "已经",
  "以为",
  "认为",
  "觉得",
  "希望",
  "必须",
  "可能",
  "需要",
  "准备",
  "继续",
  "感到",
  "知道",
  "成为",
  "进行",
  "打算",
  "愿意",
  "好像",
  "一样",
  "一起",
]);

type Pos = ReadonlySet<string>;
const has = (pos: Pos, ...codes: string[]) => codes.some((c) => pos.has(c));
/** Word + next: verb → noun/adjective, noun → noun, adjective → noun. */
const goesAfter = (word: Pos, next: Pos) =>
  (has(word, "V") && has(next, "N", "Adj")) ||
  (has(word, "N") && has(next, "N")) ||
  (has(word, "Adj") && has(next, "N"));
/** Prev + word: verb/adjective/noun → noun, adjective → verb. */
const goesBefore = (prev: Pos, word: Pos) =>
  (has(word, "N") && has(prev, "V", "Adj", "N")) ||
  (has(word, "V") && has(prev, "Adj"));

function posOf(vocab: VocabData, word: string): Set<string> {
  const out = new Set<string>();
  if (!Object.hasOwn(vocab, word)) return out;
  for (const [, , , pos = ""] of vocab[word])
    for (const code of pos.split("/")) if (code) out.add(code);
  return out;
}

/** Up to MAX_PHRASES phrases with `word`, most frequent first (then shorter, then first seen). */
export function collocations(
  tokenizer: Tokenizer,
  vocab: VocabData,
  word: string,
  sentences: readonly string[],
): string[] {
  const own = posOf(vocab, word);
  const other = (t: string | undefined): Pos | null =>
    t && t !== word && HAN.test(t) && !HELPERS.has(t) ? posOf(vocab, t) : null;
  const counts = new Map<string, { n: number; first: number }>();
  sentences.forEach((sentence, order) => {
    const seen = new Set<string>();
    for (const tokens of segment(tokenizer, sentence)) {
      tokens.forEach((t, i) => {
        if (t !== word) return;
        const next = other(tokens[i + 1]);
        const prev = other(tokens[i - 1]);
        if (next && goesAfter(own, next)) seen.add(word + tokens[i + 1]);
        if (prev && goesBefore(prev, own)) seen.add(tokens[i - 1] + word);
      });
    }
    for (const phrase of seen) {
      const c = counts.get(phrase);
      if (c) c.n++;
      else counts.set(phrase, { n: 1, first: order });
    }
  });
  return [...counts]
    .filter(([, c]) => c.n >= MIN_COUNT)
    .sort(
      ([a, x], [b, y]) =>
        y.n - x.n ||
        Array.from(a).length - Array.from(b).length ||
        x.first - y.first,
    )
    .slice(0, MAX_PHRASES)
    .map(([phrase]) => phrase);
}
