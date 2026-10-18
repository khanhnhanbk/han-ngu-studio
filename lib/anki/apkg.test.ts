import { unzipSync } from "fflate";
import initSqlJs from "sql.js";
import { describe, expect, it } from "vitest";

import { APKG_FIELDS, buildApkg, deckId, MODEL_ID, rowToNote } from "./apkg";
import { COLUMNS, type DeckRow } from "./buildDeck";

const row = (word: string, extra: Partial<DeckRow> = {}): DeckRow => ({
  word,
  pinyin: "xué xí",
  meaning: "to learn",
  sentence: "我学习<中文>。<br>他也学习。",
  sentence_pinyin: "wǒ xuéxí.<br>tā yě xuéxí.",
  sentence_meaning: "Tôi học.<br>Anh ấy cũng học.",
  wubi: "ipbf nud",
  hanviet: "học tập",
  hsk_level: "HSK 1",
  meaning_vi: "học & tập",
  machineTranslated: false,
  ...extra,
});

async function open(bytes: Uint8Array) {
  const files = unzipSync(bytes);
  const SQL = await initSqlJs();
  const db = new SQL.Database(files["collection.anki2"]);
  const all = (sql: string) => {
    const [res] = db.exec(sql);
    return res ? res.values : [];
  };
  return { files, db, all };
}

describe("rowToNote", () => {
  it("escapes text, keeps one example per line and leaves unticked columns empty", () => {
    const note = rowToNote(row("学习"), ["word", "sentence", "meaning_vi"], "hns-1.jpg");
    expect(note.fields.Hanzi).toBe("学习");
    expect(note.fields.Sentence).toBe("我学习&lt;中文&gt;。<br>他也学习。");
    expect(note.fields.MeaningVi).toBe("học &amp; tập");
    expect(note.fields.Pinyin).toBe("");
    expect(note.fields.Image).toBe('<img src="hns-1.jpg">');
    expect(note.fields.Audio).toBe("");
  });
});

describe("buildApkg", () => {
  it("writes a collection Anki can import, with media", async () => {
    const SQL = await initSqlJs();
    const image = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const bytes = await buildApkg(SQL, {
      deckName: "HSK 1",
      notes: [rowToNote(row("学习"), COLUMNS, "hns-a.jpg"), rowToNote(row("朋友"), COLUMNS)],
      media: [{ name: "hns-a.jpg", data: image }],
      now: 1_760_000_000_000,
    });
    const { files, all, db } = await open(bytes);

    expect(Object.keys(files).sort()).toEqual(["0", "collection.anki2", "media"]);
    expect(JSON.parse(new TextDecoder().decode(files.media))).toEqual({ 0: "hns-a.jpg" });
    expect(files["0"]).toEqual(image);

    const notes = all("SELECT flds, sfld, mid, tags FROM notes ORDER BY id");
    expect(notes).toHaveLength(2);
    const flds = String(notes[0][0]).split("\x1f");
    expect(flds).toHaveLength(APKG_FIELDS.length);
    expect(flds[0]).toBe("学习");
    expect(flds[APKG_FIELDS.indexOf("Image")]).toBe('<img src="hns-a.jpg">');
    expect(notes[0][1]).toBe("学习");
    expect(notes[0][2]).toBe(MODEL_ID);
    expect(notes[0][3]).toBe(" HanNguStudio ");

    const did = await deckId("HSK 1");
    expect(all("SELECT did, ord, due FROM cards ORDER BY id")).toEqual([
      [did, 0, 1],
      [did, 0, 2],
    ]);

    const [[models, decks, ver]] = all("SELECT models, decks, ver FROM col");
    expect(ver).toBe(11);
    const model = JSON.parse(String(models))[MODEL_ID];
    expect(model.flds.map((f: { name: string }) => f.name)).toEqual([...APKG_FIELDS]);
    expect(model.tmpls[0].qfmt).toContain("{{Hanzi}}");
    expect(JSON.parse(String(decks))[did].name).toBe("HSK 1");
    db.close();
  });

  it("gives the same word the same GUID in every export, so re-importing updates it", async () => {
    const SQL = await initSqlJs();
    const guid = async (now: number) => {
      const bytes = await buildApkg(SQL, { deckName: "A", notes: [rowToNote(row("学习"), COLUMNS)], media: [], now });
      const { all, db } = await open(bytes);
      const value = all("SELECT guid FROM notes")[0][0];
      db.close();
      return value;
    };
    expect(await guid(1)).toBe(await guid(999_999));
    expect(await deckId("A")).toBe(await deckId("A"));
    expect(await deckId("A")).not.toBe(await deckId("B"));
  });
});
