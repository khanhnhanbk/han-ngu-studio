import { strFromU8, unzipSync } from "fflate";
import initSqlJs, { type SqlJsStatic } from "sql.js";
import { beforeAll, describe, expect, it } from "vitest";

import { buildApkg, cleanDeckName, deckId, fieldChecksum, noteGuid, stripHtml, type ApkgOptions } from "./apkg";
import { COLUMNS, type DeckRow } from "./buildDeck";
import { CARD_TEMPLATES, NOTE_TYPE_FIELDS, NOTE_TYPE_NAME, SAMPLE_ROW, type CardTemplateId } from "./templates";

const NAMES: Record<CardTemplateId, string> = {
  recognize: "Nhận diện",
  recall: "Nhớ chữ",
  sentence: "Câu ví dụ",
  type: "Gõ chữ",
};

const rows: DeckRow[] = [
  { ...SAMPLE_ROW, machineTranslated: false },
  {
    word: "朋友",
    pinyin: "péng you",
    meaning: "friend",
    sentence: "他是我的朋友。<br>我有很多朋友。",
    sentence_pinyin: "tā shì wǒ de péngyou.<br>wǒ yǒu hěn duō péngyou.",
    sentence_meaning: "Anh ấy là bạn tôi.<br>Tôi có nhiều bạn & bè.",
    wubi: "eeee dcu",
    hanviet: "bằng hữu",
    hsk_level: "HSK 1",
    meaning_vi: "bạn bè",
    pos: "Danh từ",
    machineTranslated: true,
  },
  // No example sentence and no Vietnamese meaning: no "Câu ví dụ" card.
  { ...SAMPLE_ROW, word: "龘", sentence: "", sentence_pinyin: "", sentence_meaning: "", hsk_level: "", machineTranslated: false },
];

const options = (over: Partial<ApkgOptions> = {}): ApkgOptions => ({
  deckName: "Tiếng Trung::HSK 1",
  templates: CARD_TEMPLATES,
  cardTypes: new Set<CardTemplateId>(["recognize", "recall", "sentence", "type"]),
  templateNames: NAMES,
  columns: COLUMNS,
  now: 1_760_000_000_000,
  ...over,
});

let SQL: SqlJsStatic;
beforeAll(async () => {
  SQL = await initSqlJs();
});

async function open(bytes: Uint8Array) {
  const files = unzipSync(bytes);
  expect(Object.keys(files).sort()).toEqual(["collection.anki2", "media"]);
  expect(strFromU8(files.media)).toBe("{}");
  return new SQL.Database(files["collection.anki2"]);
}

const all = (db: InstanceType<SqlJsStatic["Database"]>, sql: string) => db.exec(sql)[0]?.values ?? [];

describe("apkg helpers", () => {
  it("computes Anki's checksum (same as Python: int(sha1(field)[:8], 16))", async () => {
    expect(await fieldChecksum("学习")).toBe(2861161827);
    expect(await fieldChecksum("<b>学习</b>")).toBe(2861161827);
  });

  it("gives each word a stable guid and each deck name a stable id", async () => {
    expect(await noteGuid("学习")).toBe(await noteGuid("学习"));
    expect(await noteGuid("学习")).not.toBe(await noteGuid("學習"));
    expect(await noteGuid("学习")).toMatch(/^[\x21-\x7e]{1,11}$/);
    expect(await deckId("A")).toBe(await deckId("A"));
    expect(await deckId("A")).not.toBe(1);
  });

  it("cleans deck names", () => {
    expect(cleanDeckName("  Tiếng Trung :: HSK 1 ", "x")).toBe("Tiếng Trung::HSK 1");
    expect(cleanDeckName(" :: ", "fallback")).toBe("fallback");
    expect(cleanDeckName("a\tb", "x")).toBe("a b");
  });

  it("strips HTML", () => {
    expect(stripHtml("a<br>b &amp; &lt;c&gt;")).toBe("ab & <c>");
  });
});

describe("buildApkg", () => {
  it("writes a schema-11 collection with the note type, deck, notes and cards", async () => {
    const db = await open(await buildApkg(SQL, rows, options()));
    const [[ver, modelsJson, decksJson]] = all(db, "SELECT ver, models, decks FROM col");
    expect(ver).toBe(11);

    const models = Object.values(JSON.parse(String(modelsJson))) as Array<{
      name: string;
      flds: Array<{ name: string }>;
      tmpls: Array<{ name: string; qfmt: string }>;
      css: string;
    }>;
    expect(models).toHaveLength(1);
    expect(models[0].name).toBe(NOTE_TYPE_NAME);
    expect(models[0].flds.map((f) => f.name)).toEqual(NOTE_TYPE_FIELDS);
    expect(models[0].tmpls.map((t) => t.name)).toEqual(["Nhận diện", "Nhớ chữ", "Câu ví dụ", "Gõ chữ"]);
    expect(models[0].tmpls[0].qfmt).toBe(CARD_TEMPLATES[0].front);

    const deckNames = Object.values(JSON.parse(String(decksJson)) as Record<string, { name: string }>).map((d) => d.name);
    expect(deckNames.sort()).toEqual(["Default", "Tiếng Trung::HSK 1"]);

    const notes = all(db, "SELECT flds, sfld, csum, tags FROM notes ORDER BY id");
    expect(notes).toHaveLength(3);
    const fields = String(notes[0][0]).split("\x1f");
    expect(fields).toEqual(NOTE_TYPE_FIELDS.map((c) => SAMPLE_ROW[c]));
    expect(notes[0][1]).toBe("学习");
    expect(notes[0][2]).toBe(2861161827);
    expect(notes[0][3]).toBe(" HanNguStudio HSK1 ");
    // Several examples stay one per line; other HTML characters are escaped.
    expect(String(notes[1][0]).split("\x1f")[5]).toBe("Anh ấy là bạn tôi.<br>Tôi có nhiều bạn &amp; bè.");
    expect(notes[2][3]).toBe(" HanNguStudio ");

    // 4 + 4 + 3 cards (the third word has no example sentence).
    expect(all(db, "SELECT count(*) FROM cards")[0][0]).toBe(11);
    expect(all(db, "SELECT DISTINCT type, queue FROM cards")).toEqual([[0, 0]]);
    expect(all(db, "SELECT DISTINCT due FROM cards ORDER BY due")).toEqual([[1], [2], [3]]);
    db.close();
  });

  it("makes cards only for the chosen types, with the same note type (later exports still match)", async () => {
    const db = await open(await buildApkg(SQL, rows, options({ cardTypes: new Set(["recognize", "type"]) })));
    const models = JSON.parse(String(all(db, "SELECT models FROM col")[0][0])) as Record<string, { name: string; tmpls: unknown[] }>;
    const full = await open(await buildApkg(SQL, rows, options()));
    expect(Object.keys(models)).toEqual(Object.keys(JSON.parse(String(all(full, "SELECT models FROM col")[0][0]))));
    expect(Object.values(models)[0].name).toBe(NOTE_TYPE_NAME);
    expect(Object.values(models)[0].tmpls).toHaveLength(4);
    expect(all(db, "SELECT DISTINCT ord FROM cards ORDER BY ord")).toEqual([[0], [3]]);
    expect(all(db, "SELECT count(*) FROM cards")[0][0]).toBe(6);
    full.close();
    db.close();
  });

  it("exports unchecked columns as empty fields", async () => {
    const db = await open(await buildApkg(SQL, rows, options({ columns: COLUMNS.filter((c) => c !== "wubi") })));
    expect(String(all(db, "SELECT flds FROM notes ORDER BY id")[0][0]).split("\x1f")[6]).toBe("");
    db.close();
  });

  it("keeps note guids stable across exports (re-import updates, no duplicates)", async () => {
    const a = await open(await buildApkg(SQL, rows, options()));
    const b = await open(await buildApkg(SQL, rows, options({ now: 1_770_000_000_000 })));
    expect(all(a, "SELECT guid FROM notes ORDER BY id")).toEqual(all(b, "SELECT guid FROM notes ORDER BY id"));
    a.close();
    b.close();
  });
});
