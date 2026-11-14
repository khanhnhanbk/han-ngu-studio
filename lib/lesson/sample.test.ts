import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { buildDeck } from "@/lib/anki/buildDeck";
import type { Meanings, WubiTable } from "@/lib/anki/load";
import type { HanvietData } from "@/lib/hanviet/lookup";
import { vi } from "@/lib/i18n/vi";
import { createTokenizer } from "@/lib/segment/tokenizer";
import type { VocabData } from "@/lib/vocab/lookup";

import { parseEntries } from "./paste";
import { SAMPLE_ROWS, SAMPLE_WORDS } from "./sample";
import { tableRow } from "./table";

const dataDir = join(__dirname, "../../public/data");
const json = <T,>(name: string) => JSON.parse(readFileSync(join(dataDir, name), "utf-8")) as T;

describe("the sample lesson's word table", () => {
  it("is exactly what the Bảng từ tab builds from public/data", () => {
    // Same steps as components/lesson/WordTable.tsx in Giản thể mode.
    const words = parseEntries(SAMPLE_WORDS).entries.map((e) => e.word);
    const deck = buildDeck(
      {
        tokenizer: createTokenizer(readFileSync(join(dataDir, "word_list.txt"), "utf-8").split("\n")),
        hanviet: json<HanvietData>("hanviet.json"),
        meanings: json<Meanings>("meanings.json"),
        examples: {},
        wubi: json<WubiTable>("wubi.json"),
        vocab: json<VocabData>("vocab.json"),
      },
      [...new Set(words)],
      1,
      vi.vocab.pos,
    );
    const rows = deck.map((d) => tableRow(d));
    if (process.env.UPDATE_SAMPLES) writeFileSync(join(__dirname, "sample.json"), `${JSON.stringify(rows, null, 1)}\n`);
    expect(rows).toHaveLength(8);
    expect(SAMPLE_ROWS).toEqual(rows);
  });
});
