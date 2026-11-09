import { describe, expect, it } from "vitest";

import type { AudioIndex } from "@/lib/speech/resolve";

import { audioFileName, joinRecordings, recordingsFor, shardPath } from "./audio";
import { wordMnemonic } from "./mnemonic";

const index: AudioIndex = {
  words: { 学习: [3, 10, 4] },
  syllables: { he2: [0, 0, 2], nei4: [1, 2, 3], hao3: [0, 2, 2] },
};

describe("recordingsFor", () => {
  it("prefers the word's own recording", () => {
    expect(recordingsFor(index, "学习", ["xue2", "xi2"])).toEqual([{ set: "words", key: "学习", entry: [3, 10, 4] }]);
  });

  it("uses the syllable for a single character", () => {
    expect(recordingsFor(index, "好", ["hao3"])).toEqual([{ set: "syllables", key: "hao3", entry: [0, 2, 2] }]);
  });

  it("chains syllables for a word with no recording", () => {
    expect(recordingsFor(index, "河内", ["he2", "nei4"])?.map((r) => r.key)).toEqual(["he2", "nei4"]);
  });

  it("gives nothing when a syllable is missing or neutral", () => {
    expect(recordingsFor(index, "河了", ["he2", "le5"])).toBeNull();
  });
});

describe("joinRecordings", () => {
  const shards = new Map([
    ["/data/audio/s-0.bin", new Uint8Array([1, 2, 3, 4])],
    ["/data/audio/s-1.bin", new Uint8Array([5, 6, 7, 8, 9])],
  ]);

  it("cuts and joins the MP3 bytes in order", () => {
    const recs = recordingsFor(index, "河内", ["he2", "nei4"])!;
    expect(recs.map(shardPath)).toEqual(["/data/audio/s-0.bin", "/data/audio/s-1.bin"]);
    expect(joinRecordings(recs, shards)).toEqual(new Uint8Array([1, 2, 7, 8, 9]));
  });

  it("gives null when a shard did not load", () => {
    expect(joinRecordings(recordingsFor(index, "学习", ["xue2", "xi2"])!, shards)).toBeNull();
  });
});

describe("audioFileName", () => {
  it("is stable, ASCII and different per word", async () => {
    const a = await audioFileName("学习");
    expect(a).toMatch(/^hns-[0-9a-f]{16}\.mp3$/);
    expect(await audioFileName("学习")).toBe(a);
    expect(await audioFileName("學習")).not.toBe(a);
  });
});

describe("wordMnemonic", () => {
  const data = { 学: ["Mẹo học", 0] as [string, 0], 习: ["Gốc tập", 1, "Thuyết văn"] as [string, 1, string] };
  const labels = { goc: "Theo nguồn gốc", draft: "chưa kiểm duyệt" };

  it("lists each character's story, marked by kind and review", () => {
    expect(wordMnemonic(data, "学习", labels)).toBe("学: Mẹo học (chưa kiểm duyệt)<br>习: Gốc tập (Theo nguồn gốc)");
  });

  it("is empty without stories", () => {
    expect(wordMnemonic(data, "朋友", labels)).toBe("");
    expect(wordMnemonic(null, "学", labels)).toBe("");
  });
});
