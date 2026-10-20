import { strToU8, zipSync } from "fflate";
import type { Database, SqlJsStatic } from "sql.js";

import { EXAMPLE_SEPARATOR, type Column, type DeckRow } from "./buildDeck";
import { CARD_CSS, NOTE_TYPE_FIELDS, NOTE_TYPE_NAME, type CardTemplate, type CardTemplateId } from "./templates";

/**
 * A ready-to-import Anki package (.apkg): the deck, the "Hán Ngữ Studio" note
 * type with its four card templates and one new card per chosen template and word,
 * so the learner skips creating fields, pasting templates and mapping columns.
 *
 * Format: the legacy collection.anki2 (schema 11, as written by genanki),
 * which Anki 2.1+, current Anki and AnkiDroid all import. Built entirely in
 * the browser with sql.js; nothing is uploaded.
 */

/** Fixed id so every export reuses the same note type in the user's collection. */
const MODEL_ID = 1_729_800_000_015;
const TEMPLATE_IDS: readonly CardTemplateId[] = ["recognize", "recall", "sentence", "type"];

/**
 * A card is created only when its front shows something: the fields of which
 * at least one must be non-empty (as Anki's "req" would decide).
 */
const REQUIRED: Record<CardTemplateId, readonly Column[]> = {
  recognize: ["word"],
  recall: ["meaning", "meaning_vi"],
  sentence: ["sentence"],
  type: ["pinyin", "meaning", "meaning_vi"],
};

export type ApkgOptions = {
  deckName: string;
  /** Card templates in the page's language; only the ones listed in `cardTypes` are used. */
  templates: readonly CardTemplate[];
  cardTypes: ReadonlySet<CardTemplateId>;
  /** Display names of the templates (Anki shows them as card types). */
  templateNames: Record<CardTemplateId, string>;
  /** Columns the user kept; the others are exported empty. */
  columns: readonly Column[];
  /** Fixed time for reproducible output in tests (ms). */
  now?: number;
};

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Field HTML, as the TSV export with html=true: text escaped, <br> between examples kept. */
export function fieldHtml(value: string): string {
  return value.replace(/[\t\r\n]+/g, " ").split(EXAMPLE_SEPARATOR).map(escapeHtml).join(EXAMPLE_SEPARATOR);
}

/** Field text without HTML, as Anki's strip_html (used for sfld and csum). */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

async function sha1(text: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-1", strToU8(text)));
}

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

/** Anki's note checksum: the first 8 hex digits of SHA-1 of the stripped first field. */
export async function fieldChecksum(field: string): Promise<number> {
  return parseInt(hex(await sha1(stripHtml(field))).slice(0, 8), 16);
}

// Anki's base91 alphabet for note guids (anki/utils.py, base91).
const BASE91 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&()*+,-./:;<=>?@[]^_`{|}~";

/**
 * Stable guid per word: re-importing an updated deck updates the existing
 * notes instead of adding duplicates. BigInt keeps all 64 bits exact.
 */
export async function noteGuid(word: string): Promise<string> {
  let n = BigInt(`0x${hex((await sha1(`han-ngu-studio:${word}`)).slice(0, 8))}`);
  let out = "";
  do {
    out = BASE91[Number(n % 91n)] + out;
    n /= 91n;
  } while (n > 0n);
  return out;
}

/** Deck id from its name, so exports with the same name land in the same deck (never 1, the Default deck). */
export async function deckId(name: string): Promise<number> {
  return 1_000_000_000 + parseInt(hex(await sha1(`deck:${name}`)).slice(0, 10), 16);
}

/** "HSK 7-9" → "HSK7-9" (Anki tags cannot contain spaces). */
const levelTag = (level: string) => level.replace(/\s+/g, "");

const SCHEMA = `
CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null, ver integer not null, dty integer not null, usn integer not null, ls integer not null, conf text not null, models text not null, decks text not null, dconf text not null, tags text not null);
CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null, usn integer not null, tags text not null, flds text not null, sfld integer not null, csum integer not null, flags integer not null, data text not null);
CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null, mod integer not null, usn integer not null, type integer not null, queue integer not null, due integer not null, ivl integer not null, factor integer not null, reps integer not null, lapses integer not null, left integer not null, odue integer not null, odid integer not null, flags integer not null, data text not null);
CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ease integer not null, ivl integer not null, lastIvl integer not null, factor integer not null, time integer not null, type integer not null);
CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);
CREATE INDEX ix_notes_usn on notes (usn);
CREATE INDEX ix_cards_usn on cards (usn);
CREATE INDEX ix_revlog_usn on revlog (usn);
CREATE INDEX ix_cards_nid on cards (nid);
CREATE INDEX ix_cards_sched on cards (did, queue, due);
CREATE INDEX ix_revlog_cid on revlog (cid);
CREATE INDEX ix_notes_csum on notes (csum);`;

/** Default deck options (genanki's defaults: 20 new cards a day, 100 reviews). */
const DECK_CONFIG = {
  autoplay: true,
  id: 1,
  lapse: { delays: [10], leechAction: 0, leechFails: 8, minInt: 1, mult: 0 },
  maxTaken: 60,
  mod: 0,
  name: "Default",
  new: { bury: true, delays: [1, 10], initialFactor: 2500, ints: [1, 4, 7], order: 1, perDay: 20, separate: true },
  replayq: true,
  rev: { bury: true, ease4: 1.3, fuzz: 0.05, ivlFct: 1, maxIvl: 36500, minSpace: 1, perDay: 100 },
  timer: 0,
  usn: 0,
};

function deckJson(id: number, name: string, mod: number) {
  return {
    collapsed: false,
    conf: 1,
    desc: "",
    dyn: 0,
    extendNew: 10,
    extendRev: 50,
    id,
    lrnToday: [0, 0],
    mod,
    name,
    newToday: [0, 0],
    revToday: [0, 0],
    timeToday: [0, 0],
    usn: -1,
  };
}

/** Clean deck name: no tabs/newlines, "::" kept for sub-decks, never empty. */
export function cleanDeckName(name: string, fallback: string): string {
  const parts = name
    .replace(/[\t\r\n"]+/g, " ")
    .split("::")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts.join("::") : fallback;
}

/** Build the .apkg bytes. `SQL` is the initialised sql.js module (browser: lib/anki/sqlite.ts). */
export async function buildApkg(SQL: SqlJsStatic, rows: readonly DeckRow[], options: ApkgOptions): Promise<Uint8Array> {
  const nowMs = options.now ?? Date.now();
  const now = Math.floor(nowMs / 1000);
  const deckName = cleanDeckName(options.deckName, NOTE_TYPE_NAME);
  const did = await deckId(deckName);

  if (!TEMPLATE_IDS.some((id) => options.cardTypes.has(id))) throw new Error("No card type chosen");
  // The note type always has all four templates (one schema, so a later export
  // with other card types still matches); cards are made only for the chosen ones.
  const mid = MODEL_ID;
  const byId = new Map(options.templates.map((t) => [t.id, t]));

  const model = {
    css: CARD_CSS,
    did,
    flds: NOTE_TYPE_FIELDS.map((name, ord) => ({
      name,
      ord,
      font: "Arial",
      media: [],
      rtl: false,
      size: 20,
      sticky: false,
    })),
    id: mid,
    latexPost: "\\end{document}",
    latexPre:
      "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
    latexsvg: false,
    mod: now,
    name: NOTE_TYPE_NAME,
    req: TEMPLATE_IDS.map((id, ord) => [ord, "any", REQUIRED[id].map((f) => NOTE_TYPE_FIELDS.indexOf(f))]),
    sortf: 0,
    tags: [],
    tmpls: TEMPLATE_IDS.map((id, ord) => {
      const tpl = byId.get(id);
      if (!tpl) throw new Error(`Missing template ${id}`);
      return { afmt: tpl.back, bafmt: "", bqfmt: "", did: null, name: options.templateNames[id], ord, qfmt: tpl.front };
    }),
    type: 0,
    usn: -1,
    vers: [],
  };

  const conf = {
    activeDecks: [1],
    addToCur: true,
    collapseTime: 1200,
    curDeck: 1,
    curModel: String(mid),
    dueCounts: true,
    estTimes: true,
    newBury: true,
    newSpread: 0,
    nextPos: rows.length + 1,
    sortBackwards: false,
    sortType: "noteFld",
    timeLim: 0,
  };
  const decks = { 1: deckJson(1, "Default", now), [did]: deckJson(did, deckName, now) };

  const db: Database = new SQL.Database();
  try {
    db.run(SCHEMA);
    db.run("INSERT INTO col VALUES (1, ?, ?, ?, 11, 0, 0, 0, ?, ?, ?, ?, '{}')", [
      // crt: the collection's creation day (seconds).
      Math.floor(now / 86400) * 86400,
      nowMs,
      nowMs,
      JSON.stringify(conf),
      JSON.stringify({ [mid]: model }),
      JSON.stringify(decks),
      JSON.stringify({ 1: DECK_CONFIG }),
    ]);

    const kept = new Set(options.columns);
    const insertNote = db.prepare("INSERT INTO notes VALUES (?, ?, ?, ?, -1, ?, ?, ?, ?, 0, '')");
    const insertCard = db.prepare("INSERT INTO cards VALUES (?, ?, ?, ?, ?, -1, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, '')");
    let cardId = nowMs;
    for (const [i, row] of rows.entries()) {
      const fields = NOTE_TYPE_FIELDS.map((c) => (kept.has(c) ? fieldHtml(row[c]) : ""));
      const nid = nowMs + i;
      const tags = ["HanNguStudio", ...(kept.has("hsk_level") && row.hsk_level ? [levelTag(row.hsk_level)] : [])];
      insertNote.run([
        nid,
        await noteGuid(row.word),
        mid,
        now,
        ` ${tags.join(" ")} `,
        fields.join("\x1f"),
        stripHtml(fields[0]),
        await fieldChecksum(fields[0]),
      ]);
      for (const [ord, id] of TEMPLATE_IDS.entries()) {
        if (!options.cardTypes.has(id)) continue;
        const shows = REQUIRED[id].some((c) => fields[NOTE_TYPE_FIELDS.indexOf(c)] !== "");
        // due = position: new cards are learned in the list's order.
        if (shows) insertCard.run([cardId++, nid, did, ord, now, i + 1]);
      }
    }
    insertNote.free();
    insertCard.free();

    return zipSync({ "collection.anki2": db.export(), media: strToU8("{}") });
  } finally {
    db.close();
  }
}
