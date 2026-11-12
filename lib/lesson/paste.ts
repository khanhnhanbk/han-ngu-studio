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
const TONE_MARK = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ1-5]/i;

/**
 * Every standard Mandarin syllable without tone, ü written "v". Letters alone
 * cannot tell Pinyin from Vietnamese ("nhà", "làm", "anh" use the same
 * letters), but those words do not split into these syllables.
 */
const SYLLABLES = new Set(
  `a ai an ang ao
  ba bai ban bang bao bei ben beng bi bian biao bie bin bing bo bu
  pa pai pan pang pao pei pen peng pi pian piao pie pin ping po pou pu
  ma mai man mang mao me mei men meng mi mian miao mie min ming miu mo mou mu
  fa fan fang fei fen feng fo fou fu
  da dai dan dang dao de dei den deng di dia dian diao die ding diu dong dou du duan dui dun duo
  ta tai tan tang tao te tei teng ti tian tiao tie ting tong tou tu tuan tui tun tuo
  na nai nan nang nao ne nei nen neng ni nian niang niao nie nin ning niu nong nou nu nuan nun nuo nv nve
  la lai lan lang lao le lei leng li lia lian liang liao lie lin ling liu lo long lou lu luan lun luo lv lve
  ga gai gan gang gao ge gei gen geng gong gou gu gua guai guan guang gui gun guo
  ka kai kan kang kao ke kei ken keng kong kou ku kua kuai kuan kuang kui kun kuo
  ha hai han hang hao he hei hen heng hong hou hu hua huai huan huang hui hun huo
  ji jia jian jiang jiao jie jin jing jiong jiu ju juan jue jun
  qi qia qian qiang qiao qie qin qing qiong qiu qu quan que qun
  xi xia xian xiang xiao xie xin xing xiong xiu xu xuan xue xun
  zha zhai zhan zhang zhao zhe zhei zhen zheng zhi zhong zhou zhu zhua zhuai zhuan zhuang zhui zhun zhuo
  cha chai chan chang chao che chen cheng chi chong chou chu chua chuai chuan chuang chui chun chuo
  sha shai shan shang shao she shei shen sheng shi shou shu shua shuai shuan shuang shui shun shuo
  ra ran rang rao re ren reng ri rong rou ru rua ruan rui run ruo
  za zai zan zang zao ze zei zen zeng zi zong zou zu zuan zui zun zuo
  ca cai can cang cao ce cen ceng ci cong cou cu cuan cui cun cuo
  sa sai san sang sao se sen seng si song sou su suan sui sun suo
  e ei en eng er o ou
  yi ya yan yang yao ye yin ying yo yong you yu yuan yue yun
  wu wa wai wan wang wei wen weng wo`.split(/\s+/),
);

const TONELESS: Record<string, string> = {
  ā: "a", á: "a", ǎ: "a", à: "a",
  ē: "e", é: "e", ě: "e", è: "e",
  ī: "i", í: "i", ǐ: "i", ì: "i",
  ō: "o", ó: "o", ǒ: "o", ò: "o",
  ū: "u", ú: "u", ǔ: "u", ù: "u",
  ǖ: "v", ǘ: "v", ǚ: "v", ǜ: "v", ü: "v",
};

/**
 * How many syllables a Pinyin token holds ("gōngzuò" → 2, "xue2xi2" → 2,
 * "yìdiǎnr" → 3 with the erhua "r"), or null when it is not Pinyin. Tone
 * digits and apostrophes mark boundaries; the rest is split into the fewest
 * standard syllables, each optionally followed by an erhua "r".
 */
export function pinyinSyllables(token: string): { count: number; erhua: boolean } | null {
  if (!PINYIN_TOKEN.test(token)) return null;
  const plain = Array.from(token.toLowerCase(), (c) => TONELESS[c] ?? c).join("");
  if (/[ńňǹ]/.test(plain)) return null;
  let count = 0;
  let erhua = false;
  for (const piece of plain.split(/['1-5]+/)) {
    if (!piece) continue;
    // best[i]: fewest syllables covering piece[0..i), with whether an erhua "r" was used.
    const best: ({ n: number; r: boolean } | null)[] = [{ n: 0, r: false }];
    for (let i = 1; i <= piece.length; i++) {
      best[i] = null;
      for (let j = Math.max(0, i - 7); j < i; j++) {
        const prev = best[j];
        if (!prev) continue;
        const unit = piece.slice(j, i);
        let cand: { n: number; r: boolean } | null = null;
        if (SYLLABLES.has(unit)) cand = { n: prev.n + 1, r: prev.r };
        else if (unit.endsWith("r") && unit !== "err" && SYLLABLES.has(unit.slice(0, -1)))
          cand = { n: prev.n + 2, r: true };
        else if (unit === "r" && j > 0) cand = { n: prev.n + 1, r: true };
        if (cand && (!best[i] || cand.n < best[i]!.n)) best[i] = cand;
      }
    }
    const end = best[piece.length];
    if (!end) return null;
    count += end.n;
    erhua ||= end.r;
  }
  return count > 0 ? { count, erhua } : null;
}

/** A token that reads as Pinyin, alternatives "shéi/shuí" included. */
const isPinyinToken = (t: string) => t.split("/").every((p) => p !== "" && pinyinSyllables(p) !== null);
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

/**
 * Split "zǎo buổi sáng" / "zǎo – buổi sáng" / "shéi / shuí" into Pinyin and
 * meaning. A token is Pinyin only when it splits into Mandarin syllables, and
 * no more syllables are taken than the word has characters (one extra for an
 * erhua "r"), so "家 jiā nhà" keeps "nhà" in the meaning.
 */
function splitRest(rest: string, chars: number): { pinyin: string; meaning: string } {
  const text = rest.trim().replace(/^[-–—:：=]\s*/, "");
  if (!text) return { pinyin: "", meaning: "" };
  const tokens = text.split(/\s+/);
  // A leading run of Pinyin-looking tokens is the Pinyin; brackets too: "[zǎo]", "(zǎo)".
  const bracket = /^[[(（【]\s*([^\])）】]+)\s*[\])）】]\s*(.*)$/.exec(text);
  if (bracket && bracket[1].split(/\s+/).every((t) => t === "/" || isPinyinToken(t))) {
    return {
      pinyin: bracket[1].trim(),
      meaning: bracket[2].replace(/^[-–—:：=]\s*/, "").trim(),
    };
  }
  // Only Latin words, all of them syllables, and no tone mark at all ("ba me"): too unsure, keep it as the meaning.
  const bare = (t: string) => t.replace(/[,;/]+$/, "");
  if (
    tokens.length > 2 &&
    !TONE_MARK.test(text) &&
    tokens.every((t) => t === "/" || isPinyinToken(bare(t)))
  ) {
    return { pinyin: "", meaning: text };
  }
  let n = 0;
  let used = 0; // syllables taken for the current reading; "/" starts another reading
  while (n < tokens.length) {
    const tok = tokens[n];
    if (tok === "/") {
      if (n === 0 || n + 1 >= tokens.length || !isPinyinToken(bare(tokens[n + 1]))) break;
      used = 0;
      n++;
      continue;
    }
    const t = bare(tok);
    if (!isPinyinToken(t)) break;
    const sylls = t.split("/").map((p) => pinyinSyllables(p)!);
    const count = Math.max(...sylls.map((s) => s.count));
    const erhua = sylls.some((s) => s.erhua);
    if (used >= chars || used + count > chars + (erhua ? 1 : 0)) break;
    used += count;
    n++;
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
  return { word: run, ...splitRest(rest, Array.from(run).length) };
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
