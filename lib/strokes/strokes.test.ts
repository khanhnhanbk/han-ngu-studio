import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { shardKey } from "./load";
import { strokeSteps, strokeTransform } from "./render";
import type { StrokeData, StrokeShard } from "./types";

const root = join(__dirname, "../..");

function fromShard(char: string): StrokeData | undefined {
  const shard = JSON.parse(
    readFileSync(join(root, "public/data/strokes", `${shardKey(char)}.json`), "utf-8"),
  ) as StrokeShard;
  return shard[char];
}

describe("shardKey", () => {
  it("groups 64 code points per shard", () => {
    expect(shardKey("一")).toBe((0x4e00 >> 6).toString(16));
    expect(shardKey("字")).toBe((0x5b57 >> 6).toString(16));
  });

  it("uses the full code point outside the BMP", () => {
    expect(shardKey("𠀀")).toBe((0x20000 >> 6).toString(16));
  });
});

describe("shipped stroke data", () => {
  it.each([
    ["字", 6],
    ["永", 5],
    ["一", 1],
    ["學", 16],
    ["学", 8],
  ])("%s has %i strokes", (char, count) => {
    const data = fromShard(char);
    expect(data?.strokes).toHaveLength(count);
    expect(data?.medians).toHaveLength(count);
  });
});

describe("strokeSteps", () => {
  it("adds one stroke per step", () => {
    const data = fromShard("字")!;
    const steps = strokeSteps(data);
    expect(steps).toHaveLength(6);
    steps.forEach((step, i) => {
      expect(step.done).toEqual(data.strokes.slice(0, i));
      expect(step.current).toBe(data.strokes[i]);
    });
  });
});

describe("strokeTransform", () => {
  it("maps the data box (y up, 900..-124) onto the cell (y down)", () => {
    expect(strokeTransform(10, 20, 1024)).toBe("translate(10 920) scale(1 -1)");
    expect(strokeTransform(0, 0, 512)).toBe("translate(0 450) scale(0.5 -0.5)");
  });
});
