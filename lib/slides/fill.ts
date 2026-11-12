import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

import { fitShape, paragraphSize, type FitNote } from "./fit";

export type { FitNote } from "./fit";

/**
 * Slides from a teacher's own PowerPoint (.pptx) template, filled in the
 * browser. Text like {{chu}} or {{pinyin}} in the template is replaced, Anki
 * style. Every slide that holds a word field is a "word slide": the group of
 * word slides is repeated once per word, in place; the other slides (title,
 * end) are kept once, with {{bai}} filled. The file never leaves the device.
 */

/** Fields filled once per word. */
export const WORD_FIELDS = [
  "chu",
  "pinyin",
  "hanviet",
  "nghia",
  "vidu",
  "vidu_pinyin",
  "vidu_nghia",
  // A second, different example, for templates with one example per slide.
  "vidu2",
  "vidu2_pinyin",
  "vidu2_nghia",
  "hsk",
  "so",
] as const;
/** Fields filled on every slide. */
export const LESSON_FIELDS = ["bai"] as const;

export type WordField = (typeof WORD_FIELDS)[number];
export type SlideWord = Record<Exclude<WordField, "so">, string>;

export type FillResult =
  | { ok: true; bytes: Uint8Array; slides: number; unknown: string[]; fitted: FitNote[] }
  | { ok: false; error: "notPptx" | "noWordSlide" | "noWords" };

const PLACEHOLDER = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;
const PARAGRAPH = /<a:p(?:\s[^>]*)?>[\s\S]*?<\/a:p>/g;
const RUN_TEXT = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g;

/** English names for the English site's guide ({{word}} = {{chu}}). */
export const FIELD_ALIASES: Readonly<Record<string, WordField | "bai">> = {
  word: "chu",
  meaning: "nghia",
  example: "vidu",
  example_pinyin: "vidu_pinyin",
  example_meaning: "vidu_nghia",
  example2: "vidu2",
  example2_pinyin: "vidu2_pinyin",
  example2_meaning: "vidu2_nghia",
  no: "so",
  lesson: "bai",
};

const fieldName = (raw: string) => {
  const key = raw.toLowerCase();
  return Object.hasOwn(FIELD_ALIASES, key) ? FIELD_ALIASES[key] : key;
};

const SLIDE_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide";
const SLIDE_CONTENT = "application/vnd.openxmlformats-officedocument.presentationml.slide+xml";
const NOTES_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide";

const decodeXml = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&");

const encodeXml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Field names used in a slide's text (runs joined per paragraph, since PowerPoint splits text into runs). */
export function fieldsIn(xml: string): string[] {
  const found = new Set<string>();
  for (const para of xml.match(PARAGRAPH) ?? []) {
    const text = [...para.matchAll(RUN_TEXT)].map((m) => decodeXml(m[1])).join("");
    for (const m of text.matchAll(PLACEHOLDER)) found.add(fieldName(m[1]));
  }
  return [...found];
}

const fillValue = (values: Readonly<Record<string, string>>) => (whole: string, name: string) => {
  const key = fieldName(name);
  return Object.hasOwn(values, key) ? values[key].replace(/[\r\n]+/g, " ") : whole;
};

/** Fill the placeholder paragraphs of a piece of slide XML. */
function fillParagraphs(xml: string, values: Readonly<Record<string, string>>): string {
  return xml.replace(PARAGRAPH, (para) => {
    const runs = [...para.matchAll(RUN_TEXT)];
    const text = runs.map((m) => decodeXml(m[1])).join("");
    if (!PLACEHOLDER.test(text)) return para;
    PLACEHOLDER.lastIndex = 0;
    const filled = text.replace(PLACEHOLDER, fillValue(values));
    let i = 0;
    return para.replace(/(<a:t(?:\s[^>]*)?>)[\s\S]*?(<\/a:t>)/g, (_, open: string, close: string) =>
      `${open}${i++ === 0 ? encodeXml(filled) : ""}${close}`,
    );
  });
}

const SHAPE = /<p:sp(?:\s[^>]*)?>[\s\S]*?<\/p:sp>/g;
const ITEM = /<p:(sp|pic|graphicFrame)(?:\s[^>]*)?>[\s\S]*?<\/p:\1>/g;

type Rect = { at: number; x: number; y: number; cx: number; cy: number; text: boolean; pic: boolean };

/** Position and size of every shape, picture and table on a slide, in drawing order. */
function slideRects(xml: string): Rect[] {
  const out: Rect[] = [];
  for (const m of xml.matchAll(ITEM)) {
    const pos = /<a:off\b[^>]*\bx="(-?\d+)"[^>]*\by="(-?\d+)"[^>]*\/>\s*<a:ext\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/.exec(m[0]);
    if (!pos) continue;
    const [x, y, cx, cy] = pos.slice(1).map(Number);
    out.push({ at: m.index, x, y, cx, cy, text: /<a:t(?:\s[^>]*)?>[^<]/.test(m[0]), pic: m[1] !== "sp" });
  }
  return out;
}

/**
 * How far right a text box's text can go before it runs into something: a
 * picture or table drawn on top of it, or another text box, that starts
 * inside the box and sits at the same height (the template's box is often
 * drawn wider than the free space, under a picture).
 */
function rightLimit(box: Rect, all: readonly Rect[]): number {
  let right = box.x + box.cx;
  for (const o of all) {
    if (o === box || !(o.text || (o.pic && o.at > box.at))) continue;
    const sameHeight = o.y < box.y + box.cy && o.y + o.cy > box.y;
    if (sameHeight && o.x > box.x && o.x < right) right = o.x;
  }
  return right;
}

/**
 * Replace the placeholders of one slide. A paragraph that holds a placeholder
 * gets its whole text in its first run (keeping that run's formatting) and
 * the other runs emptied; other paragraphs are left untouched. Unknown fields
 * stay visible so the teacher sees the typo. A text box whose filled text
 * would not fit gets a smaller font (lib/slides/fit.ts), listed in `fitted`.
 */
export function fillSlideXml(xml: string, values: Readonly<Record<string, string>>, fitted?: FitNote[]): string {
  const rects = slideRects(xml);
  const shapes = xml.replace(SHAPE, (sp, at: number) => {
    const fields = fieldsIn(sp).filter((f) => Object.hasOwn(values, f));
    if (fields.length === 0) return sp;
    const filled = fillParagraphs(sp, values);
    const paras = (filled.match(PARAGRAPH) ?? []).map((p) => ({
      text: [...p.matchAll(RUN_TEXT)].map((m) => decodeXml(m[1])).join(""),
      sz: paragraphSize(p, filled),
    }));
    const box = rects.find((r) => r.at === at);
    return fitShape(filled, fields, paras, fitted, box && rightLimit(box, rects) - box.x);
  });
  // Text outside a plain text box (tables, groups) is filled as it is.
  return fillParagraphs(shapes, values);
}

type SlideRef = { rId: string; path: string };

/** Slides in presentation order, with their part paths ("ppt/slides/slide1.xml"). */
function slideOrder(files: Record<string, Uint8Array>): SlideRef[] | null {
  const pres = files["ppt/presentation.xml"];
  const rels = files["ppt/_rels/presentation.xml.rels"];
  if (!pres || !rels) return null;
  const targets = new Map<string, string>();
  for (const m of strFromU8(rels).matchAll(/<Relationship\b[^>]*>/g)) {
    const id = /\bId="([^"]+)"/.exec(m[0])?.[1];
    const target = /\bTarget="([^"]+)"/.exec(m[0])?.[1];
    if (id && target && m[0].includes(`Type="${SLIDE_TYPE}"`)) {
      targets.set(id, target.startsWith("/") ? target.slice(1) : `ppt/${target}`);
    }
  }
  const out: SlideRef[] = [];
  for (const m of strFromU8(pres).matchAll(/<p:sldId\b[^>]*\br:id="([^"]+)"[^>]*\/>/g)) {
    const path = targets.get(m[1]);
    if (path && files[path]) out.push({ rId: m[1], path });
  }
  return out;
}

const relsPath = (slide: string) => slide.replace(/([^/]+)$/, "_rels/$1.rels");

/** Values for one word slide; `so` is the word's number in the lesson. */
export function wordValues(word: SlideWord, index: number, lessonName: string): Record<string, string> {
  return { ...word, so: String(index + 1), bai: lessonName };
}

export function fillTemplate(template: Uint8Array, words: readonly SlideWord[], lessonName: string): FillResult {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(template);
  } catch {
    return { ok: false, error: "notPptx" };
  }
  const order = slideOrder(files);
  if (!order || order.length === 0) return { ok: false, error: "notPptx" };
  if (words.length === 0) return { ok: false, error: "noWords" };

  const known = new Set<string>([...WORD_FIELDS, ...LESSON_FIELDS]);
  const wordSet = new Set<string>(WORD_FIELDS);
  const unknown = new Set<string>();
  const isWordSlide = order.map((s) => {
    const fields = fieldsIn(strFromU8(files[s.path]));
    for (const f of fields) if (!known.has(f)) unknown.add(f);
    return fields.some((f) => wordSet.has(f));
  });
  const first = isWordSlide.indexOf(true);
  if (first < 0) return { ok: false, error: "noWordSlide" };
  const group = order.filter((_, i) => isWordSlide[i]);
  // The untouched word slides: the first word is written over them, the copies are made from these.
  const originals = new Map(group.map((s) => [s.path, strFromU8(files[s.path])]));

  // New slide parts are numbered after the highest existing one.
  let nextNo = Math.max(0, ...Object.keys(files).map((p) => Number(/^ppt\/slides\/slide(\d+)\.xml$/.exec(p)?.[1] ?? 0))) + 1;
  let presRels = strFromU8(files["ppt/_rels/presentation.xml.rels"]);
  let types = strFromU8(files["[Content_Types].xml"] ?? new Uint8Array());
  let pres = strFromU8(files["ppt/presentation.xml"]);
  let nextRel = 1;
  const newRelId = () => {
    while (presRels.includes(`Id="rIdHns${nextRel}"`)) nextRel++;
    return `rIdHns${nextRel++}`;
  };

  const lessonOnly = { bai: lessonName };
  const fitted: FitNote[] = [];
  const finalRIds: string[] = [];
  order.forEach((slide, i) => {
    if (isWordSlide[i]) {
      if (i !== first) return;
      // The whole group of word slides, once per word, at the first word slide's place.
      words.forEach((word, w) => {
        const values = wordValues(word, w, lessonName);
        for (const src of group) {
          const xml = fillSlideXml(originals.get(src.path)!, values, fitted);
          if (w === 0) {
            files[src.path] = strToU8(xml);
            finalRIds.push(src.rId);
            continue;
          }
          const path = `ppt/slides/slide${nextNo++}.xml`;
          files[path] = strToU8(xml);
          const rels = files[relsPath(src.path)];
          if (rels) {
            // A notes page belongs to one slide only, so copies leave it out.
            const kept = strFromU8(rels).replace(new RegExp(`<Relationship\\b[^>]*Type="${NOTES_TYPE}"[^>]*/>`, "g"), "");
            files[relsPath(path)] = strToU8(kept);
          }
          const rId = newRelId();
          presRels = presRels.replace(
            "</Relationships>",
            `<Relationship Id="${rId}" Type="${SLIDE_TYPE}" Target="slides/${path.slice("ppt/slides/".length)}"/></Relationships>`,
          );
          types = types.replace("</Types>", `<Override PartName="/${path}" ContentType="${SLIDE_CONTENT}"/></Types>`);
          finalRIds.push(rId);
        }
      });
      return;
    }
    files[slide.path] = strToU8(fillSlideXml(strFromU8(files[slide.path]), lessonOnly, fitted));
    finalRIds.push(slide.rId);
  });

  // Slide ids must be unique and at least 256; renumber them all.
  const list = finalRIds.map((rId, i) => `<p:sldId id="${256 + i}" r:id="${rId}"/>`).join("");
  pres = pres.replace(/<p:sldIdLst>[\s\S]*?<\/p:sldIdLst>/, `<p:sldIdLst>${list}</p:sldIdLst>`);
  files["ppt/presentation.xml"] = strToU8(pres);
  files["ppt/_rels/presentation.xml.rels"] = strToU8(presRels);
  files["[Content_Types].xml"] = strToU8(types);

  return { ok: true, bytes: zipSync(files), slides: finalRIds.length, unknown: [...unknown].sort(), fitted };
}
