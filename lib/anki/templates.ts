// Type-only: importing buildDeck's COLUMNS would pull pinyin-pro into the
// guide page. templates.test.ts checks this list equals COLUMNS.
import type { Column } from "./buildDeck";

/**
 * Suggested Anki card templates for the TSV export (/tools/anki/huong-dan).
 * The note type's fields are named exactly like the TSV columns, so Anki
 * 2.1.55+ maps them from the "#columns:" header line by itself.
 */
export const NOTE_TYPE_NAME = "Hán Ngữ Studio";
export const NOTE_TYPE_FIELDS: readonly Column[] = [
  "word",
  "pinyin",
  "meaning",
  "sentence",
  "sentence_pinyin",
  "sentence_meaning",
  "wubi",
  "hanviet",
  "hsk_level",
  "meaning_vi",
  "pos",
];

/**
 * The .apkg note type (lib/anki/apkg.ts): the TSV fields plus two that only a
 * package can carry, the memory stories of the word's characters and its
 * recording ([sound:…], the file is inside the package). A new note type,
 * "Hán Ngữ Studio 2", so decks imported with the first one stay as they are.
 */
export const APKG_NOTE_TYPE_NAME = "Hán Ngữ Studio 2";
export const APKG_EXTRA_FIELDS = ["mnemonic", "audio"] as const;
export type ApkgField = Column | (typeof APKG_EXTRA_FIELDS)[number];
export const APKG_FIELDS: readonly ApkgField[] = [...NOTE_TYPE_FIELDS, ...APKG_EXTRA_FIELDS];

/** "listen" (Nghe) exists only in the .apkg: it needs the audio field. */
export type CardTemplateId = "recognize" | "recall" | "sentence" | "type" | "listen";
export type CardTemplate = { id: CardTemplateId; front: string; back: string };

/** Shared styling (Anki: Cards → Styling). Night mode follows Anki's own class. */
export const CARD_CSS = `.card {
  font-family: "Be Vietnam Pro", "Segoe UI", Arial, sans-serif;
  font-size: 20px;
  line-height: 1.5;
  text-align: center;
  color: #1c1917;
  background: #fffdf7;
}
.card.nightMode, .nightMode .card {
  color: #f5f5f4;
  background: #1c1917;
}
.hanzi, .sentence {
  font-family: "LXGW WenKai TC", "KaiTi", "STKaiti", "Kaiti TC", "BiauKai", serif;
}
.hanzi { font-size: 64px; line-height: 1.2; }
.sentence { font-size: 30px; }
.pinyin { font-size: 24px; color: #8a6d1f; }
.nightMode .pinyin { color: #e6cf70; }
.hanviet { font-size: 20px; font-weight: 600; }
.pos { font-size: 14px; color: #a8a29e; }
.meaning { font-size: 22px; margin-top: 8px; }
.meaning-en, .sub { font-size: 16px; color: #78716c; }
.hint { font-size: 16px; color: #a8a29e; margin-top: 8px; }
.extra { font-size: 13px; color: #a8a29e; margin-top: 16px; }
.example { margin-top: 16px; }
#typeans { font-family: "LXGW WenKai TC", "KaiTi", serif; font-size: 28px; }
.mnemonic { font-size: 16px; margin-top: 12px; text-align: left; }
.listen { font-size: 40px; margin: 24px 0 8px; }`;

const MEANING = `{{#meaning_vi}}<div class="meaning">{{meaning_vi}}</div>{{/meaning_vi}}
{{^meaning_vi}}<div class="meaning">{{meaning}}</div>{{/meaning_vi}}`;

const POS = `{{#pos}}<div class="pos">{{pos}}</div>{{/pos}}`;

const EXAMPLE = `{{#sentence}}
<div class="example">
  <div class="sentence">{{sentence}}</div>
  <div class="sub">{{sentence_pinyin}}</div>
  <div class="sub">{{sentence_meaning}}</div>
</div>
{{/sentence}}`;

/** Words written into the templates, in the page's language. */
export type CardLabels = { hanviet: string; wubi: string; mnemonic?: string; listen?: string };

/** The four suggested card types, with their labels in one language. */
export function cardTemplates(labels: CardLabels = { hanviet: "Hán Việt", wubi: "Ngũ bút" }): readonly CardTemplate[] {
  const EXTRA = `<div class="extra">{{hsk_level}}{{#wubi}} · ${labels.wubi}: {{wubi}}{{/wubi}}</div>`;
  return [
  {
    // Hán → nghĩa: the basic card.
    id: "recognize",
    front: `<div class="hanzi">{{word}}</div>`,
    back: `{{FrontSide}}
<hr id="answer">
<div class="pinyin">{{pinyin}}</div>
${POS}
<div class="hanviet">{{hanviet}}</div>
${MEANING}
{{#meaning_vi}}<div class="meaning-en">{{meaning}}</div>{{/meaning_vi}}
${EXAMPLE}
${EXTRA}`,
  },
  {
    // Nghĩa → Hán: recall the character from its meaning.
    id: "recall",
    front: `${MEANING}
{{#hanviet}}<div class="hint">${labels.hanviet}: {{hanviet}}</div>{{/hanviet}}`,
    back: `{{FrontSide}}
<hr id="answer">
<div class="hanzi">{{word}}</div>
<div class="pinyin">{{pinyin}}</div>
${POS}
${EXAMPLE}
${EXTRA}`,
  },
  {
    // Đọc hiểu câu: only created for words that have an example sentence.
    id: "sentence",
    front: `<div class="sentence">{{sentence}}</div>`,
    back: `{{FrontSide}}
<hr id="answer">
<div class="sub">{{sentence_pinyin}}</div>
<div class="meaning">{{sentence_meaning}}</div>
<div class="example">
  <div class="hanzi" style="font-size: 40px">{{word}}</div>
  <div class="pinyin">{{pinyin}}</div>
  ${POS}
  ${MEANING}
</div>`,
  },
  {
    // Gõ chữ: type the word with a Chinese keyboard; Anki marks each character.
    id: "type",
    front: `${MEANING}
<div class="hint">{{pinyin}}</div>
{{type:word}}`,
    back: `${MEANING}
<div class="hint">{{pinyin}}</div>
{{type:word}}
<hr id="answer">
${POS}
<div class="hanviet">{{hanviet}}</div>
${EXAMPLE}`,
  },
  ];
}

/**
 * The .apkg templates: the four above with the recording on every back (Anki
 * plays it when the answer shows) and the memory stories on Nhận diện, plus
 * Nghe: the front only plays the word; tap to see it. No typing, so it suits
 * a phone. Field names are APKG_FIELDS.
 */
export function apkgTemplates(
  labels: CardLabels = { hanviet: "Hán Việt", wubi: "Ngũ bút", mnemonic: "Mẹo nhớ", listen: "Nghe rồi nhớ lại từ và nghĩa" },
): readonly CardTemplate[] {
  const MNEMONIC = `{{#mnemonic}}<div class="mnemonic"><b>${labels.mnemonic ?? "Mẹo nhớ"}:</b> {{mnemonic}}</div>{{/mnemonic}}`;
  const base = cardTemplates(labels).map((t) => ({
    ...t,
    back: `${t.back}\n{{audio}}${t.id === "recognize" ? `\n${MNEMONIC}` : ""}`,
  }));
  const listen: CardTemplate = {
    id: "listen",
    front: `<div class="listen">{{audio}}</div>
<div class="hint">${labels.listen ?? "Nghe rồi nhớ lại từ và nghĩa"}</div>`,
    back: `{{FrontSide}}
<hr id="answer">
<div class="hanzi">{{word}}</div>
<div class="pinyin">{{pinyin}}</div>
<div class="hanviet">{{hanviet}}</div>
${MEANING}
${MNEMONIC}`,
  };
  return [...base, listen];
}

/** The Vietnamese templates (the default labels). */
export const CARD_TEMPLATES = cardTemplates();

/** A real row from /tools/anki (学习, one example), for the previews. */
export const SAMPLE_ROW: Record<Column, string> = {
  word: "学习",
  pinyin: "xué xí",
  meaning: "to learn; to study",
  sentence: "我在学校学习。",
  sentence_pinyin: "wǒ zài xuéxiào xuéxí.",
  sentence_meaning: "Tôi đang đi học.",
  wubi: "ipbf nud",
  hanviet: "học tập",
  hsk_level: "HSK 1",
  meaning_vi: "học, học tập",
  pos: "Động từ",
};

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** A field's HTML as the TSV import stores it: text escaped, <br> between examples kept. */
const fieldHtml = (value: string) => value.split("<br>").map(escapeHtml).join("<br>");

/**
 * Render a template the way Anki does, for the preview only: {{field}},
 * {{#field}}…{{/field}}, {{^field}}…{{/field}}, {{FrontSide}} and
 * {{type:field}} (an input on the front, the answer on the back).
 */
export function renderTemplate(
  template: string,
  fields: Readonly<Record<string, string>>,
  side: "front" | "back",
  frontHtml = "",
): string {
  const value = (name: string) => (Object.hasOwn(fields, name) ? fields[name] : "");
  // Sections first, innermost out, until none are left.
  const section = /\{\{([#^])([\w]+)\}\}([\s\S]*?)\{\{\/\2\}\}/;
  let out = template;
  for (let m = section.exec(out); m; m = section.exec(out)) {
    const filled = value(m[2]).trim() !== "";
    const keep = m[1] === "#" ? filled : !filled;
    out = out.slice(0, m.index) + (keep ? m[3] : "") + out.slice(m.index + m[0].length);
  }
  return out.replace(/\{\{(type:)?([\w]+)\}\}/g, (_, type: string | undefined, name: string) => {
    if (name === "FrontSide") return frontHtml;
    if (type) {
      return side === "front"
        ? `<input id="typeans" type="text" aria-label="${escapeHtml(name)}">`
        : `<code id="typeans">${fieldHtml(value(name))}</code>`;
    }
    return fieldHtml(value(name));
  });
}

/** The front and back HTML of a card, as Anki would show them. */
export function renderCard(template: CardTemplate, fields: Readonly<Record<string, string>>) {
  const front = renderTemplate(template.front, fields, "front");
  // Anki leaves the type box out of {{FrontSide}} on the back; none of our
  // templates combine the two, so the front is reused as it is.
  const back = renderTemplate(template.back, fields, "back", front);
  return { front, back };
}

/** Field names a template refers to (for tests and the copy-paste check). */
export function templateFields(template: string): string[] {
  return Array.from(template.matchAll(/\{\{[#^/]?(?:type:)?(\w+)\}\}/g), (m) => m[1]);
}
