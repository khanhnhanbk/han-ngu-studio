import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { fold, forScript, groupByStrokes, searchRadicals } from "./search";
import type { Radical } from "./types";

const radicals = JSON.parse(
  readFileSync(join(__dirname, "../../public/data/radicals.json"), "utf-8"),
) as Radical[];

describe("radicals.json", () => {
  it("has the 214 Kangxi radicals in order", () => {
    expect(radicals).toHaveLength(214);
    radicals.forEach((r, i) => {
      expect(r.no).toBe(i + 1);
      // The Kangxi Radicals block (U+2F00…) folds to the unified ideograph.
      expect(r.radical).toBe(String.fromCodePoint(0x2f00 + i).normalize("NFKC"));
    });
  });

  it("never decreases in stroke count, from 1 to 17", () => {
    for (let i = 1; i < radicals.length; i++) {
      expect(radicals[i].strokes).toBeGreaterThanOrEqual(radicals[i - 1].strokes);
    }
    expect(radicals[0].strokes).toBe(1);
    expect(radicals[213].strokes).toBe(17);
  });

  it("has a name, meaning and Pinyin for every radical", () => {
    for (const r of radicals) {
      expect(r.name, `#${r.no}`).not.toBe("");
      expect(r.meaning, `#${r.no}`).not.toBe("");
      expect(r.pinyin, `#${r.no}`).toMatch(/^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+$/);
    }
  });

  it("keeps fixed entries from the source list", () => {
    const at = (no: number) => radicals[no - 1];
    expect([at(85).name, at(85).pinyin, at(85).variants]).toEqual(["Thủy", "shuǐ", ["氵"]]);
    expect(at(157).name).toBe("Túc");
    expect(at(118).variants).toEqual(["⺮"]);
    expect(at(188).radical).toBe("骨");
  });

  it("files characters under their Unihan radical, simplified forms included", () => {
    const chars = (no: number) => radicals[no - 1].chars.map(([c]) => c);
    expect(chars(85)).toContain("没");
    expect(chars(149)).toContain("说");
    expect(radicals[148].chars.find(([c]) => c === "说")?.[1]).toBe("thuyết");
  });
});

describe("fold", () => {
  it("drops Vietnamese and Pinyin tone marks", () => {
    expect(fold("Thủy")).toBe("thuy");
    expect(fold("Đao")).toBe("dao");
    expect(fold("shuǐ")).toBe("shui");
  });
});

describe("searchRadicals", () => {
  const nos = (q: string) => searchRadicals(radicals, q).map((r) => r.no);

  it("finds a radical by its Hán Việt name, with or without accents", () => {
    expect(nos("thủy")).toContain(85);
    expect(nos("thuy")).toContain(85);
  });

  it("finds a radical from a variant or a character filed under it", () => {
    expect(nos("氵")).toEqual([85]);
    expect(nos("说")).toEqual([149]);
    // A rare character, not among the 12 examples.
    expect(nos("誓")).toEqual([149]);
  });

  it("finds by Kangxi number and by meaning", () => {
    expect(nos("140")).toEqual([140]);
    expect(nos("nước")).toContain(85);
  });

  it("returns everything for an empty query", () => {
    expect(searchRadicals(radicals, "  ")).toHaveLength(214);
  });
});

describe("groupByStrokes", () => {
  it("makes 17 groups covering all radicals", () => {
    const groups = groupByStrokes(radicals);
    expect(groups.map(([n]) => n)).toEqual(Array.from({ length: 17 }, (_, i) => i + 1));
    expect(groups.reduce((n, [, list]) => n + list.length, 0)).toBe(214);
  });
});

describe("Phồn thể lists", () => {
  const trad = forScript(radicals, "trad");

  it("file Traditional characters under their own radical", () => {
    expect(searchRadicals(trad, "頭").map((r) => r.no)).toEqual([181]);
    expect(searchRadicals(forScript(radicals, "simp"), "头").map((r) => r.no)).toEqual([37]);
    expect(trad[189].members).toContain("髮");
    expect(trad[8].chars.map(([c]) => c)).toEqual(expect.arrayContaining(["們", "個"]));
  });

  it("keep Taiwan forms only", () => {
    const all = trad.map((r) => r.members).join("");
    expect(all).toContain("后"); // 皇后
    expect(all).not.toContain("从"); // Taiwan writes 從
    expect(all).not.toContain("们");
    expect(all).not.toContain("麽"); // variant of 麼
  });

  it("leave Giản thể mode unchanged", () => {
    expect(forScript(radicals, "simp")).toEqual(radicals);
  });
});
