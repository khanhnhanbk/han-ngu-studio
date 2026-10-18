import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { bankFrom } from "./load";
import type { ExampleManifest, ExampleShard } from "./types";

// Checks the generated public/data/examples/ (pnpm build:data).
const dir = join(__dirname, "../../public/data/examples");
const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf-8")) as ExampleManifest;
const shards = new Map(
  Object.keys(manifest.shards).map((n) => [n, JSON.parse(readFileSync(join(dir, `${n}.json`), "utf-8")) as ExampleShard]),
);

describe("examples data", () => {
  it("keeps every file small enough to lazy-load", () => {
    for (const f of readdirSync(dir)) expect(statSync(join(dir, f)).size, f).toBeLessThan(1.5 * 1024 * 1024);
  });

  it("lists each word in the shard the manifest names, inside its sentences", () => {
    for (const [word, name] of Object.entries(manifest.words)) {
      const shard = shards.get(name)!;
      expect(Object.hasOwn(shard.index, word), word).toBe(true);
      for (const id of shard.index[word]) expect(shard.rows[id][0], word).toContain(word);
    }
  });

  it("uses full-width Chinese punctuation", () => {
    const bank = bankFrom(manifest, shards, ["多"]);
    expect(bank["多"].map((e) => e.hanzi)).toContain("王小明说英语，但英语书不多。");
    for (const shard of shards.values()) {
      for (const [hanzi] of shard.rows) expect(hanzi).not.toMatch(/[一-鿿][,?!;]|[一-鿿]\.$/u);
    }
  });

  it("finds words the HSK list writes with an optional 儿", () => {
    expect(manifest.words["好玩"]).toBe("1");
    expect(bankFrom(manifest, shards, ["好玩"])["好玩"].length).toBeGreaterThan(1);
  });

  it("keeps the hand-checked sheet sentences with their translations", () => {
    const ex = bankFrom(manifest, shards, ["大学"])["大学"][0];
    expect(ex).toMatchObject({ hanzi: "我在大学学习。", vi: "Tôi đang học đại học.", machine: false });
  });
});

describe("examples data guards from the sheet", () => {
  const all = [...shards.values()].flatMap((s) => s.rows);

  it("never ships the AI-refusal rows replaced in sentences.tsv", () => {
    expect(all.some(([h]) => h.includes("上帝这个词"))).toBe(false);
    expect(all.find(([h]) => h === "这笔钱用于买书。")?.[1]).toBe("Khoản tiền này được dùng để mua sách.");
  });

  it("drops a Vietnamese cell that holds Hán Việt, keeping the English", () => {
    // sentences.tsv has "thủ_cơ khả_dĩ phách_chiếu 。"-style text there.
    expect(all.find(([h]) => h === "手机可以拍照。")?.slice(1, 3)).toEqual(["", "Mobile phones can take pictures."]);
  });

  it("drops sheet rows with English words in the sentence", () => {
    expect(all.some(([h]) => h.includes("popular"))).toBe(false);
  });
});
