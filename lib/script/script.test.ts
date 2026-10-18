import { readFileSync } from "node:fs";

import * as cn2t from "opencc-js/cn2t";
import * as t2cn from "opencc-js/t2cn";
import { describe, expect, it } from "vitest";

import { convertText } from "@/lib/pinyin/convert";
import { createTokenizer } from "@/lib/segment/tokenizer";

import {
  aligned,
  createAligner,
  hasTraditional,
  IDENTITY,
  makeConverter,
  SHARED_CHARS,
} from "./convert";
import { parseScript, SCRIPT_INIT_SCRIPT } from "./preference";

const toCn = t2cn.Converter({ from: "tw", to: "cn" });
const toTw = cn2t.Converter({ from: "cn", to: "tw" });
const conv = makeConverter(toCn, toTw);

describe("parseScript", () => {
  it("defaults to Simplified", () => {
    expect(parseScript(null)).toBe("simp");
    expect(parseScript("junk")).toBe("simp");
    expect(parseScript("trad")).toBe("trad");
    expect(SCRIPT_INIT_SCRIPT).toContain('"script"');
  });
});

describe("Simplified mode", () => {
  it("never changes any text", () => {
    for (const text of ["著名", "什么", "我們去銀行", "乾隆"]) {
      expect(IDENTITY.toSimp(text)).toBe(text);
      expect(IDENTITY.toShown(text)).toBe(text);
    }
  });
});

describe("Traditional mode", () => {
  it("shows Taiwan characters without swapping vocabulary", () => {
    expect(conv.toShown("学习")).toBe("學習");
    expect(conv.toShown("头发")).toBe("頭髮");
    expect(conv.toShown("软件")).toBe("軟件");
    expect(conv.toShown("什么")).toBe("什麼");
  });

  it("converts Traditional input to Simplified for the pipelines", () => {
    expect(conv.toSimp("我們")).toBe("我们");
    expect(conv.toSimp("學習中文")).toBe("学习中文");
  });

  it("leaves Simplified input untouched, even with shared characters", () => {
    for (const text of ["什么", "显著", "著名的乾隆", "我们去银行"]) {
      expect(hasTraditional(toCn, text)).toBe(false);
      expect(conv.toSimp(text)).toBe(text);
    }
  });

  it("keeps the code-point count on mixed text", () => {
    const text = "這裡有𠀾個，好！abc 123\n头发很长……";
    for (const out of [conv.toSimp(text), conv.toShown(text)]) {
      expect(Array.from(out)).toHaveLength(Array.from(text).length);
    }
  });

  it("gives the same Pinyin as the Simplified text", () => {
    const tokenizer = createTokenizer(["我们", "银行"]);
    const opts = { toneStyle: "mark", spacing: "syllable" } as const;
    const [line] = convertText(tokenizer, conv.toSimp("我們去銀行"), opts);
    expect(line.text).toBe("wǒ men qù yín háng");
  });
});

describe("SHARED_CHARS", () => {
  it("lists every Simplified-list character that t2cn changes", () => {
    const words = readFileSync("public/data/word_list.txt", "utf8").split("\n");
    const changed = new Set<string>();
    for (const line of words) {
      for (const ch of line.split(/\s/)[0] ?? "") if (toCn(ch) !== ch) changed.add(ch);
    }
    expect([...changed].sort()).toEqual([...SHARED_CHARS].sort());
  });
});

describe("aligned", () => {
  it("falls back to one code point at a time on a length change", () => {
    const grow = (s: string) => s.replace(/a/g, "ab");
    expect(aligned(grow, "xa")).toBe("xa");
    expect(aligned((s) => s.replace(/a/g, "b"), "aa")).toBe("bb");
  });
});

describe("createAligner", () => {
  it("maps Simplified tokens onto the shown text, skipping dropped spaces", () => {
    const take = createAligner("我们 去银行", "我們 去銀行");
    expect(["我们", "去", "银行"].map(take)).toEqual(["我們", "去", "銀行"]);
  });

  it("returns an unknown token as is", () => {
    expect(createAligner("ab", "AB")("z")).toBe("z");
  });
});
