/**
 * Chinese word segmentation (Viterbi over a frequency-ranked word list).
 *
 * Faithful port of the legacy `api/_core/tokenizer.py` (git 049a657).
 * All lengths and indices are in Unicode code points, as in Python, so
 * characters outside the BMP are never split into surrogate halves.
 */

export type Tokenizer = {
  /** Segment one run of Han characters into words. */
  tokenize(text: string): string[];
};

// Han characters (CJK Unified Ideographs + Extension A). BMP only, exactly
// like Python's HAN_RE: astral ideographs (e.g. U+20000) are "other" tokens.
const HAN_RE = /^[一-鿿㐀-䶿]$/;
// Latin letters and digits stay together as a single token.
const LATIN_RE = /^[A-Za-z0-9]$/;

// Punctuation that must not be preceded by a space.
const NO_SPACE_BEFORE = new Set(Array.from("，。！？；：、）》」』”…,.!?;:)"));
// Punctuation that must not be followed by a space (full-width punctuation
// already carries its own spacing).
const NO_SPACE_AFTER = new Set(Array.from("（《「『“(，。！？；：、）》」』”…"));

// Python's str.isspace() set. JS trim()/\s differ: they miss \x1c-\x1f and
// \x85 but also strip U+FEFF, which Python keeps.
const PY_SPACE =
  "\t\n\v\f\r\x1c\x1d\x1e\x1f \x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000";
const PY_STRIP_RE = new RegExp(`^[${PY_SPACE}]+|[${PY_SPACE}]+$`, "g");

/** Python's str.strip(). */
function pyStrip(s: string): string {
  return s.replace(PY_STRIP_RE, "");
}

function cpLength(s: string): number {
  return Array.from(s).length;
}

/**
 * Build a tokenizer from the word list's lines (one word per line, most
 * frequent first). A word's rank is its line number, counting empty lines,
 * like Python's `enumerate` over the file.
 */
export function createTokenizer(lines: readonly string[]): Tokenizer {
  const wordCost = new Map<string, number>();
  let maxWordLength = 1;

  lines.forEach((line, idx) => {
    const word = pyStrip(line);
    if (!word) return;
    const rank = idx + 1;
    const length = cpLength(word);
    const lengthBonus = 2.5 * (length - 1);
    // Map.set overwrites like a Python dict: a duplicate takes the later rank.
    wordCost.set(word, Math.log(rank) - lengthBonus);
    if (length > maxWordLength) maxWordLength = length;
  });

  // Heavy penalty for single characters that are not words on their own.
  const oovCost = Math.log(wordCost.size + 1);

  /**
   * DAG[k] lists every end index i such that chars[k..i] is a dictionary
   * word or a single character.
   *
   * Python grows every fragment to the end of the text (O(N²) substrings).
   * Fragments longer than the longest dictionary word can never match, so
   * we stop there: same DAG, without millions of throwaway strings.
   */
  function getDag(chars: string[]): number[][] {
    const n = chars.length;
    const dag: number[][] = [];
    for (let k = 0; k < n; k++) {
      const ends: number[] = [k];
      let frag = chars[k];
      const limit = Math.min(n, k + maxWordLength);
      for (let i = k + 1; i < limit; i++) {
        frag += chars[i];
        if (wordCost.has(frag)) ends.push(i);
      }
      dag.push(ends);
    }
    return dag;
  }

  function tokenize(text: string): string[] {
    if (!text) return [];

    const chars = Array.from(text);
    const n = chars.length;
    const dag = getDag(chars);

    // route[i] = [lowest total cost from i to the end, end index of the word]
    const routeCost = new Float64Array(n + 1);
    const routeEnd = new Int32Array(n + 1);

    // Viterbi, backwards from the end of the text.
    for (let idx = n - 1; idx >= 0; idx--) {
      let bestCost = Infinity;
      let bestEnd = -1;
      let word = "";
      let next = idx;
      for (const x of dag[idx]) {
        // Ends are ascending, so extend the word instead of re-slicing.
        while (next <= x) word += chars[next++];
        const cost = wordCost.get(word) ?? oovCost;
        const total = cost + routeCost[x + 1];
        // Strict "<": on ties Python's min() keeps the first candidate.
        if (total < bestCost) {
          bestCost = total;
          bestEnd = x;
        }
      }
      routeCost[idx] = bestCost;
      routeEnd[idx] = bestEnd;
    }

    const result: string[] = [];
    let x = 0;
    while (x < n) {
      const y = routeEnd[x] + 1;
      result.push(chars.slice(x, y).join(""));
      x = y;
    }
    return result;
  }

  return { tokenize };
}

type RunKind = "han" | "latin" | "other";

/** Split a line into han / latin runs and single "other" characters. */
function splitRuns(line: string): Array<[RunKind, string]> {
  const chars = Array.from(line);
  const runs: Array<[RunKind, string]> = [];
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    const re = HAN_RE.test(ch) ? HAN_RE : LATIN_RE.test(ch) ? LATIN_RE : null;
    if (re) {
      let j = i;
      while (j < chars.length && re.test(chars[j])) j++;
      runs.push([re === HAN_RE ? "han" : "latin", chars.slice(i, j).join("")]);
      i = j;
    } else {
      runs.push(["other", ch]);
      i++;
    }
  }
  return runs;
}

/** Return tokens per line. Splits on "\n" only, like Python. */
export function segment(tokenizer: Tokenizer, text: string): string[][] {
  return text.split("\n").map((line) => {
    const tokens: string[] = [];
    for (const [kind, chunk] of splitRuns(line)) {
      if (kind === "han") {
        tokens.push(...tokenizer.tokenize(chunk));
      } else if (kind === "latin") {
        tokens.push(chunk);
      } else if (pyStrip(chunk)) {
        // Whitespace (incl. "\r" from CRLF, U+3000) is dropped.
        tokens.push(chunk);
      }
    }
    return tokens;
  });
}

/** Join tokens with spaces, respecting CJK/ASCII punctuation rules. */
export function joinTokens(tokens: readonly string[]): string {
  let out = "";
  for (const token of tokens) {
    if (!out) {
      out = token;
      continue;
    }
    const first = Array.from(token)[0];
    const last = Array.from(out).at(-1);
    if (first !== undefined && NO_SPACE_BEFORE.has(first)) {
      out += token;
    } else if (last !== undefined && NO_SPACE_AFTER.has(last)) {
      out += token;
    } else {
      out += " " + token;
    }
  }
  return out;
}
