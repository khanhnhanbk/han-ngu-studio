import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

// Shared with pnpm build:data (plain Node).
// @ts-expect-error -- untyped .mjs helper
import { checkMnemonics, topLevelParts } from "../../scripts/lib/mnemonics.mjs";
// @ts-expect-error -- untyped .mjs helper
import { readCsvFrom } from "../../scripts/lib/csv.mjs";

import { suggestionFor, type Mnemonics } from "./mnemonics";
import type { DecomposeData } from "./types";

type Row = { char: string; story: string; status: string; kind: string; source?: string };
const check = checkMnemonics as (rows: Row[], decompose: Record<string, string[]>) => string[];

const ROOT = join(__dirname, "../..");
const decompose = JSON.parse(readFileSync(join(ROOT, "public/data/decompose.json"), "utf-8")) as DecomposeData;
const built = JSON.parse(readFileSync(join(ROOT, "public/data/mnemonics.json"), "utf-8")) as Mnemonics;

describe("topLevelParts", () => {
  it("returns the single-character parts, skipping nested groups and ？", () => {
    expect(topLevelParts("⿰氵青")).toEqual(["氵", "青"]);
    expect(topLevelParts("⿱⿱爫冖友")).toEqual(["友"]);
    expect(topLevelParts("⿲王刂王")).toEqual(["王", "刂", "王"]);
    expect(topLevelParts("⿻？日")).toEqual(["日"]);
    expect(topLevelParts("？")).toEqual([]);
  });
});

describe("checkMnemonics", () => {
  const ok: Row = { char: "休", story: "Người (亻) tựa vào cây (木) → 休 nghỉ.", status: "draft", kind: "meo" };

  it("accepts a story that shows the character and all its parts", () => {
    expect(check([ok], decompose)).toEqual([]);
  });

  it("reports missing parts, the missing character, length, status and duplicates", () => {
    expect(check([{ ...ok, story: "Người (亻) nghỉ → 休." }], decompose)).toEqual([
      "mnemonics.tsv 休: story does not mention part 木",
    ]);
    expect(check([{ ...ok, story: "Người (亻) tựa cây (木)." }], decompose)[0]).toMatch(/character itself/);
    expect(check([{ ...ok, story: `${ok.story}${"x".repeat(200)}` }], decompose)[0]).toMatch(/longer than/);
    expect(check([{ ...ok, status: "ok" }], decompose)[0]).toMatch(/status/);
    expect(check([ok, ok], decompose)).toContain("mnemonics.tsv 休: duplicate");
    expect(check([{ ...ok, char: "𠀀" }], decompose)[0]).toMatch(/not in decompose/);
  });

  it("allows an empty story (no suggestion)", () => {
    expect(check([{ char: "一", story: "", status: "draft", kind: "meo" }], decompose)).toEqual([]);
  });

  it("needs a kind, and a source for an origin-based story", () => {
    expect(check([{ ...ok, kind: "x" }], decompose)[0]).toMatch(/kind must be/);
    expect(check([{ ...ok, kind: "goc" }], decompose)).toEqual(["mnemonics.tsv 休: kind goc needs a source"]);
    expect(check([{ ...ok, kind: "goc", source: "Thuyết văn giải tự" }], decompose)).toEqual([]);
  });

  it("passes on the real data, and mnemonics.json matches the TSV", () => {
    const rows = (readCsvFrom as (dir: string, name: string, d: string) => Row[])(
      join(ROOT, "assets/dictionary"),
      "mnemonics.tsv",
      "\t",
    );
    expect(check(rows, decompose)).toEqual([]);
    const withStory = rows.filter((r) => r.story);
    expect(Object.keys(built)).toHaveLength(withStory.length);
    for (const r of withStory) {
      const reviewed = r.status === "reviewed" ? 1 : 0;
      expect(built[r.char]).toEqual(r.kind === "goc" ? [r.story, reviewed, r.source] : [r.story, reviewed]);
    }
  });
});

describe("suggestionFor", () => {
  it("finds the story by the Simplified character (學 is looked up as 学)", () => {
    expect(suggestionFor(built, "学")?.story).toContain("学");
    expect(suggestionFor(built, "学")?.kind).toBe("meo");
    expect(suggestionFor({ 休: ["…", 1, "Thuyết văn giải tự"] }, "休")).toEqual({
      story: "…",
      reviewed: true,
      kind: "goc",
      source: "Thuyết văn giải tự",
    });
    expect(suggestionFor(built, "學")).toBeNull();
    expect(suggestionFor(null, "学")).toBeNull();
    expect(suggestionFor(built, "constructor")).toBeNull();
  });
});
