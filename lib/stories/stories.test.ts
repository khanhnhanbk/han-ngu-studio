import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { Meanings } from "@/lib/anki/load";
import type { HanvietData } from "@/lib/hanviet/lookup";
import { analyzeText, levelRank, type HskLevel, type ReaderData, type ReaderWord } from "@/lib/reader/analyze";
import { createTokenizer } from "@/lib/segment/tokenizer";
import type { VocabData } from "@/lib/vocab/lookup";

// Shared with pnpm build:data (plain Node).
// @ts-expect-error -- untyped .mjs helper
import { checkStory } from "../../scripts/lib/stories.mjs";

import { storyIdFromHash, storyText, type Story, type StoryEntry } from "./load";

const check = checkStory as (story: unknown, known: (w: string) => boolean) => string[];

const dataDir = join(__dirname, "../../public/data");
const json = <T,>(name: string) => JSON.parse(readFileSync(join(dataDir, name), "utf-8")) as T;
const data: ReaderData = {
  tokenizer: createTokenizer(readFileSync(join(dataDir, "word_list.txt"), "utf-8").split("\n")),
  hanviet: json<HanvietData>("hanviet.json"),
  vocab: json<VocabData>("vocab.json"),
  meanings: json<Meanings>("meanings.json"),
};
const stories = readdirSync(join(dataDir, "stories"))
  .filter((n) => n !== "index.json")
  .map((n) => json<Story>(`stories/${n}`));

const sample: Story = {
  id: "mau",
  level: "1",
  title: "我",
  titleVi: "Tôi",
  topic: "Mẫu",
  status: "draft",
  sentences: [
    ["我是学生。", "Tôi là học sinh."],
    ["我喜欢学习。", "Tôi thích học."],
    ["我有一个朋友。", "Tôi có một người bạn."],
    ["我们一起去学校。", "Chúng tôi cùng đến trường."],
  ],
  newWords: ["学生", "喜欢", "朋友"],
  culture: "Ghi chú văn hóa.",
};
const known = () => true;

describe("checkStory", () => {
  it("accepts a well-formed story", () => {
    expect(check(sample, known)).toEqual([]);
  });

  it("reports bad ids, missing translations, unknown or absent new words", () => {
    expect(check({ ...sample, id: "Bad Id" }, known)[0]).toMatch(/slug/);
    const noVi = { ...sample, sentences: [...sample.sentences.slice(1), ["你好。", ""]] };
    expect(check(noVi, known)[0]).toMatch(/sentence 4/);
    expect(check({ ...sample, newWords: ["学生", "喜欢", "电脑"] }, known)).toContain("stories/mau: new word 电脑 is not in the text");
    expect(check(sample, (w) => w !== "朋友")).toContain("stories/mau: new word 朋友 is not in the dictionary");
    expect(check({ ...sample, sentences: sample.sentences.slice(0, 2) }, known)[0]).toMatch(/4–20 sentences/);
  });
});

describe("shipped stories", () => {
  it("are listed in index.json without their text", () => {
    const index = json<StoryEntry[]>("stories/index.json");
    expect(index.map((s) => s.id).sort()).toEqual(stories.map((s) => s.id).sort());
    expect(index.every((s) => !("sentences" in s))).toBe(true);
  });

  // The 95 % rule, loosely: besides the new words, words with a known HSK
  // level above the story's level stay at 10 % or less of the words.
  it.each(stories.map((s) => [s.id, s] as const))("%s fits its HSK level", (_, story) => {
    const words = analyzeText(data, storyText(story))
      .flat()
      .filter((t): t is ReaderWord => t.kind === "word");
    const above = words.filter(
      (w) => w.level !== null && levelRank(w.level) > levelRank(story.level as HskLevel) && !story.newWords.includes(w.text),
    );
    expect(above.length / words.length).toBeLessThanOrEqual(0.1);
    // Every sentence is one reader line, so translations line up.
    expect(analyzeText(data, storyText(story))).toHaveLength(story.sentences.length);
  });
});

describe("storyIdFromHash", () => {
  it("reads only slug ids", () => {
    expect(storyIdFromHash("#story=ca-phe")).toBe("ca-phe");
    expect(storyIdFromHash("#story=../x")).toBe("");
    expect(storyIdFromHash("#words=学")).toBe("");
  });
});
