import { pinyin } from "pinyin-pro";

import { segment, type Tokenizer } from "@/lib/segment/tokenizer";

export type ToneStyle = "mark" | "number" | "none";
export type Spacing = "word" | "syllable";

export type PinyinOptions = {
  toneStyle: ToneStyle;
  spacing: Spacing;
};

/** One segmented word with its syllables, or text passed through as is. */
export type Segment =
  | { kind: "han"; chars: string[]; syllables: string[] }
  | { kind: "other"; text: string };

export type PinyinLine = {
  /** The original line. */
  source: string;
  /** Pinyin for the whole line. */
  text: string;
  segments: Segment[];
};

const TONE_TYPE = { mark: "symbol", number: "num", none: "none" } as const;

// A syllable starting with a/o/e (any tone) needs an apostrophe when it is
// not the first syllable of a word: Xī'ān, píng'ān.
const VOWEL_START = /^[aoeāáǎàōóǒòēéěè]/i;

// Pinyin is Latin text, so full-width punctuation becomes its ASCII form.
const ASCII_PUNCT: Record<string, string> = {
  "，": ",",
  "。": ".",
  "！": "!",
  "？": "?",
  "；": ";",
  "：": ":",
  "、": ",",
  "（": "(",
  "）": ")",
  "～": "~",
};
// No space before these (closing punctuation) or after these (opening).
const NO_SPACE_BEFORE = /^[,.!?;:)\]}”’»》」』~…]/;
const NO_SPACE_AFTER = /[(\[{“‘«《「『]$/;

function toAscii(text: string): string {
  return Array.from(text, (ch) => ASCII_PUNCT[ch] ?? ch).join("");
}

/** Join Pinyin tokens with one space, except around punctuation. */
function joinPinyin(tokens: string[]): string {
  let out = "";
  for (const token of tokens) {
    if (out && !NO_SPACE_BEFORE.test(token) && !NO_SPACE_AFTER.test(out)) {
      out += " ";
    }
    out += token;
  }
  return out;
}

function syllableText(raw: string, char: string, style: ToneStyle): string {
  // A Han character pinyin-pro cannot read stays as the character itself.
  if (!raw) return char;
  // pinyin-pro writes the neutral tone as 0; CC-CEDICT (and our data) use 5.
  if (style === "number") return raw.replace(/0$/, "5");
  return raw;
}

function joinSyllables(syllables: string[], spacing: Spacing): string {
  if (spacing === "syllable") return syllables.join(" ");
  return syllables
    .map((s, i) => (i > 0 && VOWEL_START.test(s) ? `'${s}` : s))
    .join("");
}

/**
 * Convert one line to Pinyin.
 *
 * pinyin-pro reads the whole line so polyphones get their context
 * (他长大了 → le, while a lone 了 would be liǎo). Our tokenizer is only used
 * to group those syllables into words.
 */
export function convertLine(
  tokenizer: Tokenizer,
  line: string,
  opts: PinyinOptions,
): PinyinLine {
  const chars = Array.from(line);
  // type "all" returns one entry per code point, astral characters included.
  const readings = pinyin(line, {
    type: "all",
    toneType: TONE_TYPE[opts.toneStyle],
  });

  const [tokens] = segment(tokenizer, line);
  const segments: Segment[] = [];
  const outTokens: string[] = [];
  let pos = 0;

  for (const token of tokens) {
    const tokenChars = Array.from(token);
    // segment() drops whitespace between tokens; skip it here too.
    while (pos < chars.length && chars[pos] !== tokenChars[0]) pos++;
    const start = pos;
    pos += tokenChars.length;

    const isHan = readings[start]?.isZh ?? false;
    if (isHan) {
      const syllables = tokenChars.map((ch, i) =>
        syllableText(readings[start + i]?.pinyin ?? "", ch, opts.toneStyle),
      );
      segments.push({ kind: "han", chars: tokenChars, syllables });
      outTokens.push(joinSyllables(syllables, opts.spacing));
    } else {
      segments.push({ kind: "other", text: token });
      outTokens.push(toAscii(token));
    }
  }

  // Chinese writes one ellipsis as "……"; Pinyin uses a single "…".
  const text = joinPinyin(outTokens).replace(/…+/g, "…");
  return { source: line, text, segments };
}

/** Convert text line by line; empty lines are kept. */
export function convertText(
  tokenizer: Tokenizer,
  text: string,
  opts: PinyinOptions,
): PinyinLine[] {
  return text
    .split("\n")
    .map((line) => convertLine(tokenizer, line.replace(/\r$/, ""), opts));
}

/** Tab-separated "original<TAB>pinyin" rows, one per non-empty line. */
export function toTsv(lines: PinyinLine[]): string {
  return lines
    .filter((l) => l.source.trim())
    .map((l) => `${l.source.replace(/\t/g, " ")}\t${l.text}`)
    .join("\n");
}
