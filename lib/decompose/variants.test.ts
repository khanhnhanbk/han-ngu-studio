import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { indexVariants, variantsOf, type VariantRow } from "./variants";

const rows: VariantRow[] = [
  ["发", "發", "発"],
  ["发", "髮", "髪"],
  ["国", "國", "国"],
  ["广", "廣", "広"],
  ["黑", "黑", "黒"],
];
const index = indexVariants(rows);

describe("variantsOf", () => {
  it("gives all rows for a Simplified character", () => {
    expect(variantsOf(index, "发")).toEqual([rows[0], rows[1]]);
  });

  it("gives only the typed Traditional form's row", () => {
    expect(variantsOf(index, "髮")).toEqual([rows[1]]);
    expect(variantsOf(index, "發")).toEqual([rows[0]]);
  });

  it("finds a Japanese form", () => {
    expect(variantsOf(index, "広")).toEqual([rows[3]]);
    expect(variantsOf(index, "黒")).toEqual([rows[4]]);
  });

  it("finds a character that is both Simplified and Japanese once", () => {
    expect(variantsOf(index, "国")).toEqual([rows[2]]);
  });

  it("is empty for characters with one form, or without data", () => {
    expect(variantsOf(index, "人")).toEqual([]);
    expect(variantsOf(null, "发")).toEqual([]);
  });
});

describe("variants.json", () => {
  const data = JSON.parse(readFileSync(join(__dirname, "../../public/data/variants.json"), "utf-8")) as VariantRow[];
  const built = indexVariants(data);

  it("has rows of three single characters that are not all the same", () => {
    for (const row of data) {
      expect(row).toHaveLength(3);
      for (const c of row) expect(Array.from(c)).toHaveLength(1);
      expect(row[0] === row[1] && row[1] === row[2]).toBe(false);
    }
  });

  it("matches known forms", () => {
    expect(variantsOf(built, "国")).toContainEqual(["国", "國", "国"]);
    expect(variantsOf(built, "广")).toContainEqual(["广", "廣", "広"]);
    expect(variantsOf(built, "发")).toEqual(expect.arrayContaining([["发", "發", "発"], ["发", "髮", "髪"]]));
    expect(variantsOf(built, "学")).toContainEqual(["学", "學", "学"]);
    expect(variantsOf(built, "黑")).toContainEqual(["黑", "黑", "黒"]);
  });
});
