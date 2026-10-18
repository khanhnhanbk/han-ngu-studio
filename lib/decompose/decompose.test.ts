import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { shardKey } from "../strokes/load";
import type { StrokeData, StrokeShard } from "../strokes/types";
import { buildReverseIndex, familyOf } from "./family";
import { etymologyOf, parseIds, splitOf } from "./ids";
import { notesToTsv, parseNotesTsv, withNote } from "./notes";
import { buildTree, strokeColors, treeGlyphs } from "./tree";
import type { DecomposeData, PartNode } from "./types";

const root = join(__dirname, "../..");
const data = JSON.parse(readFileSync(join(root, "public/data/decompose.json"), "utf-8")) as DecomposeData;

function strokesOf(char: string): StrokeData | undefined {
  const shard = JSON.parse(
    readFileSync(join(root, "public/data/strokes", `${shardKey(char)}.json`), "utf-8"),
  ) as StrokeShard;
  return shard[char];
}

const matchesOf = (char: string) => strokesOf(char)?.matches;

/** The child part nodes of a char node (its IDS operator's children). */
function partsOf(node: PartNode): PartNode[] {
  if (node.kind !== "char" || !node.parts) return [];
  return node.parts.kind === "op" ? node.parts.children : [node.parts];
}

describe("parseIds", () => {
  it("parses a left–right split", () => {
    expect(parseIds("⿰氵青")).toEqual({
      kind: "op",
      op: "⿰",
      children: [
        { kind: "char", char: "氵" },
        { kind: "char", char: "青" },
      ],
    });
  });

  it("takes three parts for ⿲ and ⿳", () => {
    const node = parseIds("⿲彳𠂉亍");
    expect(node.kind === "op" && node.children.length).toBe(3);
  });

  it("parses nested operators and unknown parts", () => {
    expect(parseIds("⿱⿰木？一")).toEqual({
      kind: "op",
      op: "⿱",
      children: [
        { kind: "op", op: "⿰", children: [{ kind: "char", char: "木" }, { kind: "unknown" }] },
        { kind: "char", char: "一" },
      ],
    });
  });

  it("keeps a part outside the BMP whole", () => {
    const node = parseIds("⿰𠂉亍");
    expect(node.kind === "op" && node.children[0]).toEqual({ kind: "char", char: "𠂉" });
  });

  it("rejects malformed sequences", () => {
    expect(() => parseIds("⿰氵")).toThrow();
    expect(() => parseIds("⿰氵青口")).toThrow();
    expect(() => parseIds("")).toThrow();
  });
});

describe("shipped decomposition data", () => {
  it("parses every entry", () => {
    for (const [char, entry] of Object.entries(data)) {
      expect(() => splitOf(char, entry), char).not.toThrow();
    }
  });

  it("knows 清 is pictophonetic: 氵 for meaning, 青 for sound", () => {
    expect(data["清"][0]).toBe("⿰氵青");
    expect(etymologyOf(data["清"])).toMatchObject({ type: "p", semantic: "氵", phonetic: "青" });
  });

  it("treats a part with only unknown sub-parts as basic", () => {
    expect(data["氵"][0]).toBe("⿱？？");
    expect(splitOf("氵", data["氵"])).toBeNull();
  });

  it("has no cycles (a character never contains itself)", () => {
    const state = new Map<string, "open" | "done">();
    const cycles: string[] = [];
    const visit = (char: string) => {
      if (state.get(char) === "done") return;
      if (state.get(char) === "open") {
        cycles.push(char);
        return;
      }
      state.set(char, "open");
      const ids = splitOf(char, data[char]);
      const walk = (n: ReturnType<typeof parseIds>) => {
        if (n.kind === "op") n.children.forEach(walk);
        else if (n.kind === "char") visit(n.char);
      };
      if (ids) walk(ids);
      state.set(char, "done");
    };
    Object.keys(data).forEach(visit);
    expect(cycles).toEqual([]);
  });

  it("lists frequent characters first", () => {
    const keys = Object.keys(data);
    expect(keys.indexOf("的")).toBeLessThan(keys.indexOf("清"));
  });
});

describe("buildTree", () => {
  it("colours 清's two parts and covers every stroke", () => {
    const tree = buildTree("清", data, matchesOf);
    const [water, blue] = partsOf(tree);
    expect(water).toMatchObject({ kind: "char", char: "氵", color: 0, strokes: [0, 1, 2] });
    expect(blue).toMatchObject({ kind: "char", char: "青", color: 1 });
    const colors = strokeColors(tree, strokesOf("清")!.strokes.length);
    expect(colors).toEqual([0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1]);
  });

  it("maps a nested part onto the root's strokes", () => {
    const tree = buildTree("清", data, matchesOf);
    const blue = partsOf(tree)[1];
    // 青 = ⿱龶月: 龶 is strokes 3–6 of 清 and 月 strokes 7–10.
    const [top, moon] = partsOf(blue);
    expect(top).toMatchObject({ char: "龶", strokes: [3, 4, 5, 6], color: null });
    expect(moon).toMatchObject({ char: "月", strokes: [7, 8, 9, 10] });
  });

  it("lists all component glyphs once", () => {
    const glyphs = treeGlyphs(buildTree("意", data, matchesOf));
    expect(glyphs.slice(0, 2)).toEqual(["音", "立"]);
    expect(glyphs).toContain("心");
    expect(new Set(glyphs).size).toBe(glyphs.length);
  });

  it("leaves strokes unknown without stroke data", () => {
    const tree = buildTree("清", data, () => undefined);
    expect(tree.kind === "char" && tree.strokes).toBeNull();
    expect(partsOf(tree)[0]).toMatchObject({ char: "氵", strokes: null, color: 0 });
  });
});

describe("families", () => {
  const index = buildReverseIndex(data);

  it("finds 青's phonetic family, most frequent first, without 青", () => {
    const family = familyOf("青", index, data);
    const chars = family.map((m) => m.char);
    expect(chars).toEqual(expect.arrayContaining(["清", "晴", "请", "情", "睛"]));
    expect(chars).not.toContain("青");
    expect(chars.indexOf("请")).toBeLessThan(chars.indexOf("睛"));
    expect(family.find((m) => m.char === "清")).toMatchObject({ phonetic: true, semantic: false });
  });

  it("finds parts nested deeper than one level", () => {
    // 清 → 青 → 月
    expect(index.get("月")).toContain("清");
  });
});

describe("notes TSV", () => {
  it("round-trips tabs, newlines and backslashes", () => {
    const notes = withNote(withNote({}, "清", "Nước\txanh\nthì trong \\ sạch"), "意", "Âm thanh từ tim");
    expect(parseNotesTsv(notesToTsv(notes))).toEqual(notes);
  });

  it("clears a note with empty text and skips bad lines", () => {
    expect(withNote({ 清: "x" }, "清", "  ")).toEqual({});
    expect(parseNotesTsv("char\tnote\nhello\tworld\n清\t\n意\tý\n")).toEqual({ 意: "ý" });
  });
});
