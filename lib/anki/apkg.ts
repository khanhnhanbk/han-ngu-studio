import { zipSync, type Zippable } from "fflate";
import type { SqlJsStatic } from "sql.js";

import { EXAMPLE_SEPARATOR, type Column, type DeckRow } from "./buildDeck";

/**
 * .apkg export: a zip of an SQLite collection ("collection.anki2", schema 11,
 * which every Anki client imports), a "media" JSON map and the media files
 * named 0, 1, 2… Built entirely in the browser.
 */

/** Note type fields, in order. The first is the sort field. */
export const APKG_FIELDS = [
  "Hanzi",
  "Pinyin",
  "Meaning",
  "Sentence",
  "SentencePinyin",
  "SentenceMeaning",
  "Wubi",
  "HanViet",
  "HSK",
  "MeaningVi",
  "Image",
  // Empty for now (Phase 5b); present so a later export updates notes
  // without changing the note type.
  "Audio",
] as const;
export type ApkgField = (typeof APKG_FIELDS)[number];

const FIELD_OF: Record<Column, ApkgField> = {
  word: "Hanzi",
  pinyin: "Pinyin",
  meaning: "Meaning",
  sentence: "Sentence",
  sentence_pinyin: "SentencePinyin",
  sentence_meaning: "SentenceMeaning",
  wubi: "Wubi",
  hanviet: "HanViet",
  hsk_level: "HSK",
  meaning_vi: "MeaningVi",
};

/** Stable ids: re-importing a deck updates its notes instead of adding copies. */
export const MODEL_ID = 1760000000001;
const MODEL_NAME = "Hán Ngữ Studio";
export const DEFAULT_DECK_NAME = "Hán Ngữ Studio";

export type ApkgNote = { fields: Record<ApkgField, string>; tags: string[] };
export type ApkgMedia = { name: string; data: Uint8Array };

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * A deck row as note fields (HTML). Columns the user unticked stay empty.
 * Several examples per card stay one per line (EXAMPLE_SEPARATOR is <br>).
 */
export function rowToNote(row: DeckRow, columns: readonly Column[], image?: string): ApkgNote {
  const fields = Object.fromEntries(APKG_FIELDS.map((f) => [f, ""])) as Record<ApkgField, string>;
  for (const c of columns) {
    fields[FIELD_OF[c]] = row[c]
      .replace(/[\t\r\n]+/g, " ")
      .split(EXAMPLE_SEPARATOR)
      .map(escapeHtml)
      .join(EXAMPLE_SEPARATOR);
  }
  // The word is the sort field and the GUID source, so it is always kept.
  fields.Hanzi = escapeHtml(row.word);
  if (image) fields.Image = `<img src="${escapeHtml(image)}">`;
  return { fields, tags: ["HanNguStudio"] };
}

const CSS = `.card {
  font-family: "Be Vietnam Pro", "Segoe UI", Arial, sans-serif;
  font-size: 20px;
  text-align: center;
  color: #1c1917;
  background: #fffdf7;
}
.nightMode .card, .card.nightMode { color: #f5f5f4; background: #1c1917; }
.hanzi, .sentence { font-family: "LXGW WenKai TC", "KaiTi", "STKaiti", "Kaiti TC", "BiauKai", serif; }
.hanzi { font-size: 64px; }
.pinyin { font-size: 26px; color: #8a6d1f; }
.nightMode .pinyin { color: #e6cf70; }
.hanviet { font-size: 22px; font-weight: 600; margin-top: 4px; }
.meaning { margin-top: 12px; }
.meaning-en { font-size: 16px; color: #78716c; }
.image img { max-width: 100%; max-height: 280px; margin-top: 12px; border-radius: 8px; }
.sentence { font-size: 28px; margin-top: 16px; }
.sentence-pinyin, .sentence-meaning { font-size: 16px; color: #78716c; }
.extra { font-size: 13px; color: #a8a29e; margin-top: 12px; }`;

const FRONT = `<div class="hanzi">{{Hanzi}}</div>`;
const BACK = `{{FrontSide}}
<hr id="answer">
<div class="pinyin">{{Pinyin}}</div>
{{#HanViet}}<div class="hanviet">{{HanViet}}</div>{{/HanViet}}
{{#MeaningVi}}<div class="meaning">{{MeaningVi}}</div>{{/MeaningVi}}
{{#Meaning}}<div class="meaning-en">{{Meaning}}</div>{{/Meaning}}
{{#Image}}<div class="image">{{Image}}</div>{{/Image}}
{{#Sentence}}<div class="sentence">{{Sentence}}</div>{{/Sentence}}
{{#SentencePinyin}}<div class="sentence-pinyin">{{SentencePinyin}}</div>{{/SentencePinyin}}
{{#SentenceMeaning}}<div class="sentence-meaning">{{SentenceMeaning}}</div>{{/SentenceMeaning}}
<div class="extra">{{HSK}}{{#Wubi}} · Ngũ bút: {{Wubi}}{{/Wubi}}</div>
{{Audio}}`;

const SCHEMA = `
CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null,
  ver integer not null, dty integer not null, usn integer not null, ls integer not null, conf text not null,
  models text not null, decks text not null, dconf text not null, tags text not null);
CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null,
  usn integer not null, tags text not null, flds text not null, sfld integer not null, csum integer not null,
  flags integer not null, data text not null);
CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null,
  mod integer not null, usn integer not null, type integer not null, queue integer not null, due integer not null,
  ivl integer not null, factor integer not null, reps integer not null, lapses integer not null, left integer not null,
  odue integer not null, odid integer not null, flags integer not null, data text not null);
CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ease integer not null,
  ivl integer not null, lastIvl integer not null, factor integer not null, time integer not null, type integer not null);
CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);
CREATE INDEX ix_notes_usn on notes (usn);
CREATE INDEX ix_cards_usn on cards (usn);
CREATE INDEX ix_revlog_usn on revlog (usn);
CREATE INDEX ix_cards_nid on cards (nid);
CREATE INDEX ix_cards_sched on cards (did, queue, due);
CREATE INDEX ix_revlog_cid on revlog (cid);
CREATE INDEX ix_notes_csum on notes (csum);`;

async function sha1Hex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Deck id from its name: the same name always maps to the same deck. */
export async function deckId(name: string): Promise<number> {
  return 2 ** 30 + (Number.parseInt((await sha1Hex(`deck:${name}`)).slice(0, 8), 16) % 2 ** 30);
}

/** Plain text of a field, as Anki stores the sort field and its checksum. */
const stripHtml = (s: string) =>
  s.replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

function collectionJson(deckName: string, did: number, now: number) {
  const sec = Math.floor(now / 1000);
  const deck = (id: number, name: string) => ({
    id, name, desc: "", mod: sec, usn: -1, collapsed: false, browserCollapsed: false, dyn: 0, conf: 1,
    extendNew: 10, extendRev: 50, newToday: [0, 0], revToday: [0, 0], lrnToday: [0, 0], timeToday: [0, 0],
  });
  const model = {
    id: MODEL_ID, name: MODEL_NAME, type: 0, mod: sec, usn: -1, sortf: 0, did, tags: [], vers: [],
    flds: APKG_FIELDS.map((name, ord) => ({ name, ord, sticky: false, rtl: false, font: "Arial", size: 20, media: [] })),
    tmpls: [{ name: "Nhận diện", ord: 0, qfmt: FRONT, afmt: BACK, bqfmt: "", bafmt: "", did: null }],
    css: CSS,
    latexPre: "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
    latexPost: "\\end{document}",
    latexsvg: false,
    // The card exists when Hanzi (field 0) is not empty.
    req: [[0, "any", [0]]],
  };
  const conf = {
    activeDecks: [1], curDeck: 1, newSpread: 0, collapseTime: 1200, timeLim: 0, estTimes: true, dueCounts: true,
    curModel: String(MODEL_ID), nextPos: 1, sortType: "noteFld", sortBackwards: false, addToCur: true,
  };
  const dconf = {
    1: {
      id: 1, name: "Default", mod: 0, usn: 0, maxTaken: 60, autoplay: true, timer: 0, replayq: true, dyn: false,
      new: { delays: [1, 10], ints: [1, 4, 7], initialFactor: 2500, order: 1, perDay: 20, separate: true, bury: true },
      rev: { perDay: 200, ease4: 1.3, fuzz: 0.05, ivlFct: 1, maxIvl: 36500, minSpace: 1, bury: true },
      lapse: { delays: [10], mult: 0, minInt: 1, leechFails: 8, leechAction: 0 },
    },
  };
  return {
    conf: JSON.stringify(conf),
    models: JSON.stringify({ [MODEL_ID]: model }),
    decks: JSON.stringify({ 1: deck(1, "Default"), [did]: deck(did, deckName) }),
    dconf: JSON.stringify(dconf),
  };
}

/** Build the .apkg bytes. `SQL` is an initialised sql.js module. */
export async function buildApkg(
  SQL: SqlJsStatic,
  opts: { deckName: string; notes: readonly ApkgNote[]; media: readonly ApkgMedia[]; now?: number },
): Promise<Uint8Array> {
  const now = opts.now ?? Date.now();
  const sec = Math.floor(now / 1000);
  const deckName = opts.deckName.trim() || DEFAULT_DECK_NAME;
  const did = await deckId(deckName);
  const db = new SQL.Database();
  try {
    db.run(SCHEMA);
    const json = collectionJson(deckName, did, now);
    db.run("INSERT INTO col VALUES (1, ?, ?, ?, 11, 0, 0, 0, ?, ?, ?, ?, '{}')", [
      sec, now, now, json.conf, json.models, json.decks, json.dconf,
    ]);
    const insertNote = db.prepare("INSERT INTO notes VALUES (?, ?, ?, ?, -1, ?, ?, ?, ?, 0, '')");
    const insertCard = db.prepare("INSERT INTO cards VALUES (?, ?, ?, 0, ?, -1, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, '')");
    for (const [i, note] of opts.notes.entries()) {
      const flds = APKG_FIELDS.map((f) => note.fields[f]).join("\x1f");
      const sort = stripHtml(note.fields.Hanzi);
      const guid = (await sha1Hex(`han-ngu-studio:${sort}`)).slice(0, 20);
      const csum = Number.parseInt((await sha1Hex(sort)).slice(0, 8), 16);
      const tags = note.tags.length ? ` ${note.tags.join(" ")} ` : "";
      insertNote.run([now + i, guid, MODEL_ID, sec, tags, flds, sort, csum]);
      // New cards in the order of the list (due = position).
      insertCard.run([now + i, now + i, did, sec, i + 1]);
    }
    insertNote.free();
    insertCard.free();
    const media: Record<string, string> = {};
    const files: Zippable = { "collection.anki2": db.export() };
    opts.media.forEach((m, i) => {
      media[String(i)] = m.name;
      // Images are already compressed: store them as they are.
      files[String(i)] = [m.data, { level: 0 }];
    });
    files.media = new TextEncoder().encode(JSON.stringify(media));
    return zipSync(files, { level: 6 });
  } finally {
    db.close();
  }
}
