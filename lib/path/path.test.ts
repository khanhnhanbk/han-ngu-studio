import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildTree, treeGlyphs } from "@/lib/decompose/tree";
import type { DecomposeData } from "@/lib/decompose/types";
import type { VocabData } from "@/lib/vocab/lookup";

import { orderPath, PATH_SIZE, phoneticFamilies, pickChars, toStages } from "./path";
import { parseProgressTsv, progressToTsv, toggled } from "./progress";

describe("pickChars", () => {
  it("keeps every required character, then fills by frequency", () => {
    expect(pickChars(["a", "b", "c", "d", "e"], new Set(["e", "d"]), 3)).toEqual(["a", "d", "e"]);
  });

  it("ignores required characters that are not in the list", () => {
    expect(pickChars(["a", "b"], new Set(["x"]), 2)).toEqual(["a", "b"]);
  });
});

describe("orderPath", () => {
  const parts: Record<string, string[]> = { 你: ["亻", "尔"], 休: ["亻", "木"], 林: ["木"], 森: ["木", "林"], 尔: [] };

  it("puts components on the path before their users, else keeps frequency order", () => {
    // Frequency: 你 森 林 木 尔 人
    const out = orderPath(["你", "森", "林", "木", "尔", "人"], (c) => parts[c] ?? []);
    expect(out.indexOf("尔")).toBeLessThan(out.indexOf("你"));
    expect(out.indexOf("木")).toBeLessThan(out.indexOf("林"));
    expect(out.indexOf("林")).toBeLessThan(out.indexOf("森"));
    expect(out).toEqual(["尔", "你", "木", "林", "森", "人"]);
  });

  it("ignores components that are not on the path", () => {
    expect(orderPath(["休", "人"], (c) => parts[c] ?? [])).toEqual(["休", "人"]);
  });

  it("still returns every character when the data has a cycle", () => {
    const out = orderPath(["a", "b"], (c) => (c === "a" ? ["b"] : ["a"]));
    expect([...out].sort()).toEqual(["a", "b"]);
  });
});

describe("toStages and phoneticFamilies", () => {
  it("splits into stages", () => {
    expect(toStages([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("groups characters that share a phonetic part", () => {
    const phonetic: Record<string, string> = { 清: "青", 晴: "青", 情: "青", 妈: "马", 人: "" };
    expect(phoneticFamilies(["清", "人", "晴", "妈", "情"], (c) => phonetic[c] ?? "")).toEqual([{ phonetic: "青", chars: ["清", "晴", "情"] }]);
  });
});

describe("the real path", () => {
  const data = JSON.parse(readFileSync(join(__dirname, "../../public/data/decompose.json"), "utf-8")) as DecomposeData;
  const vocab = JSON.parse(readFileSync(join(__dirname, "../../public/data/vocab.json"), "utf-8")) as VocabData;
  const hsk13 = new Set<string>();
  for (const [word, entries] of Object.entries(vocab)) {
    if (Math.min(...entries.map((e) => Number.parseInt(e[0], 10))) > 3) continue;
    for (const c of word) if (Object.hasOwn(data, c)) hsk13.add(c);
  }
  const componentsOf = (c: string) => treeGlyphs(buildTree(c, data, () => undefined));
  const path = orderPath(pickChars(Object.keys(data), hsk13), componentsOf);

  it("has 1000 distinct characters including every HSK 1–3 character", () => {
    expect(path).toHaveLength(PATH_SIZE);
    expect(new Set(path).size).toBe(PATH_SIZE);
    for (const c of hsk13) expect(path).toContain(c);
  });

  it("never has a character before one of its components on the path", () => {
    const at = new Map(path.map((c, i) => [c, i]));
    for (const c of path) {
      for (const p of componentsOf(c)) if (at.has(p)) expect(at.get(p)!).toBeLessThan(at.get(c)!);
    }
  });

  it("is the same every time", () => {
    expect(orderPath(pickChars(Object.keys(data), hsk13), componentsOf)).toEqual(path);
  });
});

describe("progress", () => {
  it("ticks and unticks", () => {
    const a = toggled({}, "人", "2026-11-09");
    expect(a).toEqual({ 人: "2026-11-09" });
    expect(toggled(a, "人", "2026-11-10")).toEqual({});
  });

  it("round-trips through TSV, skipping bad lines", () => {
    const p = { 人: "2026-11-09", 口: "2026-11-08" };
    expect(parseProgressTsv(progressToTsv(p), "2026-01-01")).toEqual(p);
    expect(parseProgressTsv("char\tdate\n大\n学习\t2026-11-09\n木\tx", "2026-01-01")).toEqual({ 大: "2026-01-01", 木: "2026-01-01" });
  });
});
