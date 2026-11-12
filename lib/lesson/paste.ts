import { strFromU8, unzipSync } from "fflate";

/**
 * "Dán cả bài": a teacher copies a whole handout (Ctrl+A in Word, a PDF or a
 * web page) and the lines are sorted here, so nothing has to be cleaned up
 * first:
 *  - a short Chinese word, alone or followed by its Pinyin / meaning
 *    ("1. 早 zǎo", "学习 xuéxí học tập") → a word, keeping what the teacher wrote;
 *  - any other line with Chinese characters → the lesson text;
 *  - a line with no Chinese character (headings, notes, loose Pinyin, page
 *    numbers) → skipped, and listed so the teacher can check.
 */

const HAN = /\p{Script=Han}/u;
const HAN_RUN = /^[\p{Script=Han}〇]+/u;
/** "1." "2)" "3、" "(4)" "-" "•" at the start of a line. */
const NUMBERING = /^\s*(?:[(（]?\d{1,3}[)）.、:：]|[-–•*·])\s*/;
/** Punctuation that only sentences have. */
const SENTENCE_MARK = /[。！？!?，,；;：:、…]/;
/** Letters Pinyin uses (tone marks, ü, tone numbers) but nothing only Vietnamese has. */
const PINYIN_TOKEN = /^(?:[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüńňǹ']+[1-5]?)+$/i;
const SEPARATOR = /\s*(?:\t+|\s[-–—=]\s|[:：=])\s*/;

/** The longest word a list line can hold; longer Chinese runs are sentences. */
export const MAX_WORD_CHARS = 4;

export type WordEntry = {
  word: string;
  /** Pinyin the teacher wrote, "" when none. */
  pinyin: string;
  /** Meaning the teacher wrote, "" when none. */
  meaning: string;
};

export type PasteResult = {
  /** Sentence lines, one per line, numbering removed. */
  text: string;
  words: WordEntry[];
  /** Lines left out (no Chinese character), in order. */
  skipped: string[];
  /** The first skipped line, when it looks like a title (short, before any Chinese). */
  title: string;
};

/** Split "zǎo buổi sáng" / "zǎo – buổi sáng" / "shéi / shuí" into Pinyin and meaning. */
function splitRest(rest: string): { pinyin: string; meaning: string } {
  const text = rest.trim().replace(/^[-–—:：=]\s*/, "");
  if (!text) return { pinyin: "", meaning: "" };
  const tokens = text.split(/\s+/);
  let n = 0;
  while (n < tokens.length && (tokens[n] === "/" || PINYIN_TOKEN.test(tokens[n].replace(/[,;/]+$/, "")))) n++;
  // A leading run of Pinyin-looking tokens is the Pinyin; brackets too: "[zǎo]", "(zǎo)".
  const bracket = /^[[(（【]\s*([^\])）】]+)\s*[\])）】]\s*(.*)$/.exec(text);
  if (bracket && bracket[1].split(/\s+/).every((t) => PINYIN_TOKEN.test(t))) {
    return {
      pinyin: bracket[1].trim(),
      meaning: bracket[2].replace(/^[-–—:：=]\s*/, "").trim(),
    };
  }
  const pinyin = tokens
    .slice(0, n)
    .join(" ")
    .replace(/[,;]+$/, "");
  const meaning = tokens
    .slice(n)
    .join(" ")
    .replace(/^[-–—:：=]\s*/, "")
    .trim();
  // Only Latin words and no tone mark at all ("ba me"): too unsure, keep it as the meaning.
  if (pinyin && !meaning && !/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ1-5]/i.test(pinyin) && tokens.length > 2) {
    return { pinyin: "", meaning: text };
  }
  return { pinyin, meaning };
}

/**
 * One line of the word list: the leading Chinese run is the word, the rest is
 * the teacher's Pinyin and meaning. A line with no leading Chinese is kept
 * whole as the word (as before), so nothing typed is lost.
 */
export function parseWordLine(line: string): WordEntry | null {
  const trimmed = line.trim().replace(NUMBERING, "");
  if (!trimmed) return null;
  const run = HAN_RUN.exec(trimmed)?.[0];
  if (!run) return { word: trimmed, pinyin: "", meaning: "" };
  const rest = trimmed.slice(run.length).split(SEPARATOR).join(" ");
  return { word: run, ...splitRest(rest) };
}

/** The word list as entries, first occurrence of each word kept. */
export function parseEntries(text: string): {
  entries: WordEntry[];
  duplicates: number;
} {
  const seen = new Map<string, WordEntry>();
  let duplicates = 0;
  for (const line of text.split("\n")) {
    const entry = parseWordLine(line);
    if (!entry) continue;
    if (seen.has(entry.word)) duplicates++;
    else seen.set(entry.word, entry);
  }
  return { entries: [...seen.values()], duplicates };
}

/** An entry back as one line of the word list ("早 zǎo – buổi sáng"). */
export function entryLine(e: WordEntry): string {
  return [e.word, e.pinyin, e.meaning && `– ${e.meaning}`].filter(Boolean).join(" ");
}

function isWordLine(line: string): boolean {
  const run = HAN_RUN.exec(line)?.[0];
  if (!run || Array.from(run).length > MAX_WORD_CHARS) return false;
  const rest = line.slice(run.length);
  // More Chinese after the word, or sentence punctuation right after it: a sentence.
  return !HAN.test(rest) && !SENTENCE_MARK.test(rest.trimStart().charAt(0));
}

export function splitPaste(raw: string): PasteResult {
  const textLines: string[] = [];
  const words = new Map<string, WordEntry>();
  const skipped: string[] = [];
  let title = "";
  let seenHan = false;
  for (const rawLine of raw.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (!HAN.test(line)) {
      if (!seenHan && !title && skipped.length === 0 && Array.from(line).length <= 60) title = line;
      skipped.push(line);
      continue;
    }
    seenHan = true;
    const body = line.replace(NUMBERING, "");
    if (isWordLine(body)) {
      const entry = parseWordLine(body);
      if (entry && !words.has(entry.word)) words.set(entry.word, entry);
    } else {
      textLines.push(body);
    }
  }
  return {
    text: textLines.join("\n"),
    words: [...words.values()],
    skipped,
    title,
  };
}

const decodeXml = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");

/**
 * The plain text of a Word file (.docx), one line per paragraph, read in the
 * browser: the file is a zip and the text is in word/document.xml. Returns
 * null when the file is not a .docx.
 */
export function docxText(bytes: Uint8Array): string | null {
  let xml: string;
  try {
    const doc = unzipSync(bytes, {
      filter: (f) => f.name === "word/document.xml",
    })["word/document.xml"];
    if (!doc) return null;
    xml = strFromU8(doc);
  } catch {
    return null;
  }
  const lines: string[] = [];
  for (const para of xml.match(/<w:p[ >][\s\S]*?<\/w:p>/g) ?? []) {
    const text = para
      .replace(/<w:instrText\b[^>]*>[\s\S]*?<\/w:instrText>/g, "")
      .replace(/<w:(?:br|cr)\b[^>]*\/>/g, "\n")
      .replace(/<w:tab\b[^>]*\/>/g, "\t")
      .replace(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<[^>]+>/g, (_, t: string | undefined) => t ?? "");
    lines.push(...decodeXml(text).split("\n"));
  }
  return lines.join("\n");
}
