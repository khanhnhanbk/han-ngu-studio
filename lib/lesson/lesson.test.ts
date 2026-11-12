import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createTokenizer } from "@/lib/segment/tokenizer";

import { appendWords, extractWords } from "./extract";
import {
  cleanLessons,
  lessonsFile,
  mergeLessons,
  newLesson,
  parseLessonsFile,
  type Lesson,
} from "./store";
import {
  briefMeaning,
  tableCsv,
  tableHtml,
  tableQuizlet,
  tableText,
  tableTsv,
  type TableHeaders,
  type TableRow,
} from "./table";

const tokenizer = createTokenizer(
  readFileSync(
    join(__dirname, "../../public/data/word_list.txt"),
    "utf-8",
  ).split("\n"),
);

const lesson = (id: string, updatedAt: number, name = id): Lesson => ({
  id,
  name,
  words: "学习",
  text: "",
  updatedAt,
});

describe("lesson store", () => {
  it("keeps valid lessons, newest first, first of each id", () => {
    const list = cleanLessons([
      lesson("a", 1),
      { id: "x" },
      lesson("b", 3),
      lesson("a", 9, "dup"),
      null,
      "s",
    ]);
    expect(list.map((l) => l.id)).toEqual(["b", "a"]);
    expect(list[1].name).toBe("a");
  });

  it("round-trips the backup file and refuses other JSON", () => {
    const lessons = [lesson("a", 2), lesson("b", 1)];
    expect(parseLessonsFile(lessonsFile(lessons))).toEqual(lessons);
    expect(parseLessonsFile('{"lessons":[]}')).toBeNull();
    expect(parseLessonsFile("not json")).toBeNull();
  });

  it("merges an import, replacing lessons with the same id", () => {
    const merged = mergeLessons(
      [lesson("a", 1, "old"), lesson("b", 2)],
      [lesson("a", 5, "new")],
    );
    expect(merged.map((l) => [l.id, l.name])).toEqual([
      ["a", "new"],
      ["b", "b"],
    ]);
  });

  it("makes an empty lesson with a unique id", () => {
    const a = newLesson("Bài 1", 1000);
    const b = newLesson("Bài 1", 1000);
    expect(a).toMatchObject({
      name: "Bài 1",
      words: "",
      text: "",
      updatedAt: 1000,
    });
    expect(a.id).not.toBe(b.id);
  });
});

describe("extractWords", () => {
  it("lists the Chinese words once, in order, without punctuation or Latin", () => {
    const words = extractWords(
      tokenizer,
      "我喜欢学习汉语。\n你也喜欢学习吗？ABC 123",
    );
    expect(words).toEqual(["我", "喜欢", "学习", "汉语", "你", "也", "吗"]);
  });

  it("appends only new words", () => {
    expect(appendWords(["学习", "朋友"], ["朋友", "喜欢", "喜欢"])).toEqual([
      "学习",
      "朋友",
      "喜欢",
    ]);
  });
});

describe("word table exports", () => {
  const h: TableHeaders = {
    no: "STT",
    word: "Từ",
    pinyin: "Pinyin",
    hanviet: "Hán Việt",
    meaning: "Nghĩa",
    hsk: "HSK",
  };
  const rows: TableRow[] = [
    {
      word: "学习",
      pinyin: "xué xí",
      hanviet: "học tập",
      meaning: "học, học tập",
      hsk: "1",
    },
    { word: "<b>", pinyin: "", hanviet: "", meaning: 'a "b"\nc', hsk: "" },
  ];

  it("tab-separated with a header", () => {
    expect(tableTsv(rows, h).split("\n")[0]).toBe(
      "STT\tTừ\tPinyin\tHán Việt\tNghĩa\tHSK",
    );
    expect(tableTsv(rows, h).split("\n")[1]).toBe(
      "1\t学习\txué xí\thọc tập\thọc, học tập\t1",
    );
  });

  it("HTML table escapes text", () => {
    const html = tableHtml(rows, h, "Bài 1");
    expect(html).toContain("<p><b>Bài 1</b></p><table");
    expect(html).toContain("&lt;b&gt;");
    expect(html).not.toContain("<b></td>");
  });

  it("numbered text for chat", () => {
    expect(tableText(rows, "Bài 1")).toBe(
      'Bài 1\n1. 学习 (xué xí) – học, học tập\n2. <b> – a "b" c\n',
    );
  });

  it("Quizlet lines", () => {
    expect(tableQuizlet(rows)).toBe(
      '学习\txué xí – học, học tập\n<b>\ta "b" c\n',
    );
  });

  it("CSV quotes and starts with a BOM", () => {
    const csv = tableCsv(rows, h);
    expect(csv.startsWith("﻿STT,Từ,")).toBe(true);
    expect(csv).toContain('1,学习,xué xí,học tập,"học, học tập",1\r\n');
    expect(csv).toContain('2,<b>,,,"a ""b"" c",\r\n');
  });
});

describe("briefMeaning", () => {
  it("keeps whole senses while they fit", () => {
    expect(
      briefMeaning(
        "làm; sản xuất; viết; sáng tác; làm; tham gia; tổ chức (một bữa tiệc, v.v.)",
        30,
      ),
    ).toBe("làm; sản xuất; viết; sáng tác");
    expect(briefMeaning("học; tìm hiểu")).toBe("học; tìm hiểu");
  });

  it("splits CC-CEDICT senses on slashes and cuts a long first sense", () => {
    expect(
      briefMeaning("Ming Dynasty (1368-1644)/surname Ming/bright", 30),
    ).toBe("Ming Dynasty (1368-1644)");
    expect(briefMeaning("a".repeat(80), 10)).toBe("aaaaaaaaa…");
    expect(briefMeaning("")).toBe("");
  });
});

describe("briefMeaning cleanup", () => {
  it("drops CC-CEDICT reading tags", () => {
    expect(briefMeaning("bạn (khác với kính trọng 您[nin2])")).toBe("bạn (khác với kính trọng 您)");
  });
});
