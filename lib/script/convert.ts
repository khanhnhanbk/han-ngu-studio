import type { Script } from "./preference";

export type ConvertFn = (text: string) => string;

/**
 * Converts between the user's text and the Simplified text every pipeline
 * runs on. In Simplified mode both directions are the identity, so the
 * tools behave exactly as they did before the switch existed.
 */
export type ScriptConverter = {
  script: Script;
  /** Text for the (Simplified-only) pipelines and data lookups. */
  toSimp: ConvertFn;
  /** Text shown to the user and exported, in the chosen script. */
  toShown: ConvertFn;
};

export const IDENTITY: ScriptConverter = {
  script: "simp",
  toSimp: (text) => text,
  toShown: (text) => text,
};

/**
 * Characters that t2cn changes but that are also normal in Simplified text
 * (著名, 什么, 乾隆…). They are not evidence that the input is Traditional,
 * so Simplified input typed in Phồn thể mode is never pushed through t2cn.
 * `script.test.ts` rebuilds this list from public/data/word_list.txt.
 */
export const SHARED_CHARS = new Set(
  Array.from(
    "么著於夥乾菸摺徵拚睪篠吒麴寀剋擣昇脩梲榦樧氾潀澐灒麽牴犛琱璸瓛皁劄秈薹綎罃醣蒐蔘蔯薳苧蟳袷醟鉳錼鍅壎捱霢鞝榘韝騑鼂",
  ),
);

/**
 * Run `convert` without changing the code-point count, so offsets in the
 * converted text line up with the original. OpenCC phrase rules keep the
 * length for CJK in practice; if one ever does not, fall back to converting
 * one code point at a time.
 */
export function aligned(convert: ConvertFn, text: string): string {
  const out = convert(text);
  if (Array.from(out).length === Array.from(text).length) return out;
  return Array.from(text, (ch) => {
    const c = convert(ch);
    return Array.from(c).length === 1 ? c : ch;
  }).join("");
}

/** True when the text has a character t2cn would change that is not shared. */
export function hasTraditional(toCn: ConvertFn, text: string): boolean {
  for (const ch of text) {
    if (!SHARED_CHARS.has(ch) && toCn(ch) !== ch) return true;
  }
  return false;
}

export function makeConverter(toCn: ConvertFn, toTw: ConvertFn): ScriptConverter {
  return {
    script: "trad",
    toSimp: (text) => (hasTraditional(toCn, text) ? aligned(toCn, text) : text),
    toShown: (text) => aligned(toTw, text),
  };
}

let tradPromise: Promise<ScriptConverter> | null = null;

/**
 * Load the OpenCC dictionaries for Phồn thể mode. cn2t is about 1 MB, so it
 * is only fetched once the user picks Traditional, then cached.
 */
export function loadTradConverter(): Promise<ScriptConverter> {
  tradPromise ??= Promise.all([import("opencc-js/t2cn"), import("opencc-js/cn2t")])
    .then(([t2cn, cn2t]) =>
      makeConverter(
        t2cn.Converter({ from: "tw", to: "cn" }),
        cn2t.Converter({ from: "cn", to: "tw" }),
      ),
    )
    .catch((err: unknown) => {
      tradPromise = null; // allow a retry after a network error
      throw err;
    });
  return tradPromise;
}

/**
 * Walks the shown text alongside the Simplified text it was converted from.
 * `take(token)` finds the next occurrence of a Simplified token (pipelines
 * may drop whitespace between tokens) and returns the same span of the shown
 * text. Both strings have the same code-point count (see `aligned`).
 */
export function createAligner(simp: string, shown: string) {
  const s = Array.from(simp);
  const t = Array.from(shown);
  let pos = 0;
  return function take(token: string): string {
    const tok = Array.from(token);
    if (tok.length === 0) return "";
    for (let i = pos; i + tok.length <= s.length; i++) {
      if (tok.every((ch, j) => s[i + j] === ch)) {
        pos = i + tok.length;
        return t.slice(i, pos).join("");
      }
    }
    // Not a span of the source (should not happen): show the token as is.
    return token;
  };
}
