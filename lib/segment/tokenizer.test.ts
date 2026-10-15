import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import golden from "./__golden__/segment.json";
import { createTokenizer, joinTokens, segment } from "./tokenizer";

const wordList = readFileSync(
  join(__dirname, "../../public/data/word_list.txt"),
  "utf-8",
);
const tokenizer = createTokenizer(wordList.split("\n"));

describe("segment (golden, generated from the Python tokenizer)", () => {
  it.each(golden.cases.map((c) => [JSON.stringify(c.input).slice(0, 40), c] as const))(
    "%s",
    (_, c) => {
      const lines = segment(tokenizer, c.input);
      expect(lines).toEqual(c.lines);
      expect(lines.map(joinTokens).join("\n")).toBe(c.segmented);
    },
  );
});

/** Line-by-line transcription of Python's tokenize(), with no length cutoff. */
function referenceTokenize(lines: string[], text: string): string[] {
  const cost = new Map<string, number>();
  lines.forEach((line, idx) => {
    const w = line.trim();
    if (w) cost.set(w, Math.log(idx + 1) - 2.5 * (Array.from(w).length - 1));
  });
  const oov = Math.log(cost.size + 1);
  const t = Array.from(text);
  const n = t.length;
  const route: Array<[number, number]> = [];
  route[n] = [0, 0];
  for (let idx = n - 1; idx >= 0; idx--) {
    let best: [number, number] | null = null;
    for (let x = idx; x < n; x++) {
      const frag = t.slice(idx, x + 1).join("");
      if (!(cost.has(frag) || x === idx)) continue;
      const total = (cost.get(frag) ?? oov) + route[x + 1][0];
      if (best === null || total < best[0]) best = [total, x];
    }
    route[idx] = best!;
  }
  const out: string[] = [];
  for (let x = 0; x < n; ) {
    const y = route[x][1] + 1;
    out.push(t.slice(x, y).join(""));
    x = y;
  }
  return out;
}

describe("length cutoff", () => {
  it("gives the same result as the uncapped Python DAG", () => {
    const lines = wordList.split("\n");
    const runs = golden.cases
      .flatMap((c) => c.input.match(/[\u4e00-\u9fff\u3400-\u4dbf]+/g) ?? [])
      .filter((r) => r.length <= 200);
    expect(runs.length).toBeGreaterThan(40);
    for (const run of runs) {
      expect(tokenizer.tokenize(run)).toEqual(referenceTokenize(lines, run));
    }
  });
});

describe("createTokenizer", () => {
  it("counts empty lines in the rank and lets duplicates take the later rank", () => {
    // "ab" first at rank 1, again at rank 4 (empty line 2 still counts).
    // With rank 4, log(4) - 2.5 = -1.11 still beats a + b split (2 * log(3)).
    const tok = createTokenizer(["ab", "", "a", "ab", "b"]);
    expect(tok.tokenize("ab")).toEqual(["ab"]);
  });

  it("treats astral characters as single code points", () => {
    const tok = createTokenizer(["𠀀𠀀", "我"]);
    expect(tok.tokenize("𠀀𠀀我")).toEqual(["𠀀𠀀", "我"]);
  });

  it("returns [] for empty text", () => {
    expect(tokenizer.tokenize("")).toEqual([]);
  });
});

describe("joinTokens", () => {
  it("handles punctuation spacing", () => {
    expect(joinTokens(["我", "好", "，", "你", "呢", "？"])).toBe("我 好，你 呢？");
    expect(joinTokens(["“", "你", "”", "Hi", "("])).toBe("“你”Hi (");
    expect(joinTokens([])).toBe("");
  });
});
