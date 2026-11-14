import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { Meanings } from "@/lib/anki/load";
import { cvdictShard, type CvdictShard } from "@/lib/cvdict/lookup";
import { bankFrom } from "@/lib/examples/load";
import type { ExampleManifest, ExampleShard } from "@/lib/examples/types";
import type { HanvietData } from "@/lib/hanviet/lookup";
import { createTokenizer } from "@/lib/segment/tokenizer";
import type { VocabData } from "@/lib/vocab/lookup";

import { buildLookupCard } from "./card";
import { SAMPLE_CARD, SAMPLE_WORD } from "./sample";

const dataDir = join(__dirname, "../../public/data");
const json = <T,>(name: string) => JSON.parse(readFileSync(join(dataDir, name), "utf-8")) as T;

describe("the sample lookup card", () => {
  it("is exactly what the pipeline builds from public/data", () => {
    const manifest = json<ExampleManifest>("examples/manifest.json");
    const shards = new Map(Object.keys(manifest.shards).map((n) => [n, json<ExampleShard>(`examples/${n}.json`)]));
    const card = buildLookupCard(
      {
        tokenizer: createTokenizer(readFileSync(join(dataDir, "word_list.txt"), "utf-8").split("\n")),
        hanviet: json<HanvietData>("hanviet.json"),
        meanings: json<Meanings>("meanings.json"),
        vocab: json<VocabData>("vocab.json"),
        cvdict: json<CvdictShard>(`cvdict/${cvdictShard(SAMPLE_WORD)}.json`),
        examples: bankFrom(manifest, shards, [SAMPLE_WORD]),
      },
      SAMPLE_WORD,
    );
    if (process.env.UPDATE_SAMPLES) writeFileSync(join(__dirname, "sample.json"), `${JSON.stringify(card, null, 1)}\n`);
    expect(SAMPLE_CARD).toEqual(card);
  });
});
