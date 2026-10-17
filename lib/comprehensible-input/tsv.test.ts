import { describe, expect, it } from "vitest";

import { toTsv, TSV_FILENAME } from "./tsv";

const row = (sentence: string, newWords: string[] | string = "", unknownCount = 0) => ({
  sentence,
  newWords,
  unknownCount,
});

describe("toTsv", () => {
  it("has BOM and header", () => {
    const out = toTsv([]);
    expect(out.startsWith("﻿")).toBe(true);
    expect(out).toBe("﻿idx\tsentence\tnew_words\tunknown_count\n");
  });

  it("leaves normal fields unquoted with \\n endings", () => {
    const out = toTsv([row("我爱你", ["爱", "你"], 2), row("你好")]);
    expect(out).toContain("\n0\t我爱你\t爱 你\t2\n");
    expect(out).not.toContain("\r");
    expect(out.endsWith("\n")).toBe(true);
  });

  it("quotes tabs", () => {
    expect(toTsv([row("a\tb")])).toContain('0\t"a\tb"\t\t0');
  });

  it("quotes and doubles quotes", () => {
    expect(toTsv([row('a"b')])).toContain('"a""b"');
  });

  it("quotes line breaks and preserves them", () => {
    const out = toTsv([row("a\nb"), row("c\rd")]);
    expect(out).toContain('"a\nb"');
    expect(out).toContain('"c\rd"');
  });

  it("empty new_words is empty and unquoted", () => {
    expect(toTsv([row("句子", [])])).toContain("\n0\t句子\t\t0\n");
  });

  it("exposes filename", () => {
    expect(TSV_FILENAME).toBe("sentence_sorted.tsv");
  });
});
