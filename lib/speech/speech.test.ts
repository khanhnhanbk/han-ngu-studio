import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DEFAULT_SPEECH_PREFS, parseSpeechPrefs } from "./prefs";
import { resolveSound, syllableKey, syllableSequence, WORD_PARTS, wordPart, type AudioEntry, type AudioIndex } from "./resolve";
import { mandarinRank, pickVoice, rankVoices, type VoiceLike } from "./voices";

const audioDir = join(__dirname, "../../public/data/audio");
const readJson = (name: string) => JSON.parse(readFileSync(join(audioDir, name), "utf-8")) as Record<string, AudioEntry>;
const parts = Array.from({ length: WORD_PARTS }, (_, p) => readJson(`index-w-${p}.json`));
// The whole index, as the browser would see it word by word.
const index: AudioIndex = { words: Object.assign({}, ...parts), syllables: readJson("index-s.json") };

const key = (s: ReturnType<typeof resolveSound>) =>
  s.kind === "recording" ? `${s.recording.set}:${s.recording.key}` : `voice:${s.text}`;

describe("syllableKey", () => {
  it("maps TONE3 to audio-cmn names", () => {
    expect(syllableKey("hang2")).toBe("hang2");
    expect(syllableKey("nu:3")).toBe("nv3");
    expect(syllableKey("lu:e4")).toBe("lve4");
    expect(syllableKey("le5")).toBeNull(); // no neutral-tone recordings
    expect(syllableKey("")).toBeNull();
  });
});

describe("resolveSound", () => {
  it("reads a character in context with the syllable for that reading", () => {
    expect(key(resolveSound(index, { word: "行", tone3: ["hang2"], contextual: true }))).toBe("syllables:hang2");
    expect(key(resolveSound(index, { word: "行", tone3: ["xing2"], contextual: true }))).toBe("syllables:xing2");
    expect(key(resolveSound(index, { word: "女", tone3: ["nu:3"], contextual: true }))).toBe("syllables:nv3");
  });

  it("uses the character's own recording for a neutral tone or without context", () => {
    expect(key(resolveSound(index, { word: "了", tone3: ["le5"], contextual: true }))).toBe("words:了");
    expect(key(resolveSound(index, { word: "行", tone3: ["xing2"] }))).toBe("words:行");
  });

  it("uses word recordings, then the device voice", () => {
    expect(key(resolveSound(index, { word: "学习", tone3: ["xue2", "xi2"], contextual: true }))).toBe("words:学习");
    expect(key(resolveSound(index, { word: "你好" }))).toBe("voice:你好");
    expect(key(resolveSound(null, { word: "学习" }))).toBe("voice:学习");
  });
});

describe("syllableSequence", () => {
  it("chains syllable recordings only when every character has one", () => {
    expect(syllableSequence(index, { word: "河内", tone3: ["he2", "nei4"] })?.map((r) => r.key)).toEqual(["he2", "nei4"]);
    expect(syllableSequence(index, { word: "走吧", tone3: ["zou3", "ba5"] })).toBeNull(); // neutral tone
    expect(syllableSequence(index, { word: "河", tone3: ["he2"] })).toBeNull(); // single characters use resolveSound
    expect(syllableSequence(index, { word: "河内" })).toBeNull();
  });
});

describe("split word index", () => {
  it("puts every word in the part the browser computes for it", () => {
    parts.forEach((part, p) => {
      for (const word of Object.keys(part)) expect(wordPart(word)).toBe(p);
    });
  });
});

describe("packed recordings", () => {
  it("point inside their shards, at MP3 frames", () => {
    for (const [set, prefix] of [["words", "w"], ["syllables", "s"]] as const) {
      const sizes = new Map<number, number>();
      for (const [shard, offset, length] of Object.values(index[set])) {
        if (!sizes.has(shard)) sizes.set(shard, statSync(join(audioDir, `${prefix}-${shard}.bin`)).size);
        expect(offset + length).toBeLessThanOrEqual(sizes.get(shard)!);
        expect(length).toBeGreaterThan(500);
      }
    }
    for (const word of ["学习", "银行", "行"]) {
      const [shard, offset] = index.words[word];
      const bytes = readFileSync(join(audioDir, `w-${shard}.bin`)).subarray(offset, offset + 3);
      // MPEG frame sync (11 set bits) or an ID3 tag.
      expect(bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0 || bytes.toString("latin1") === "ID3").toBe(true);
    }
    expect(Object.keys(index.words).length).toBeGreaterThan(8000);
    expect(Object.keys(index.syllables).length).toBeGreaterThan(1600);
  });
});

describe("voices", () => {
  const v = (name: string, lang: string, local = true): VoiceLike => ({ name, lang, localService: local, voiceURI: name });
  const list = [
    v("Microsoft Hanhan", "zh-TW"),
    v("Microsoft Huihui", "zh-CN"),
    v("Google 普通话（中国大陆）", "zh-CN", false),
    v("Sin-ji", "zh-HK"),
    v("Tingting", "zh_CN"),
    v("Samantha", "en-US"),
  ];

  it("keeps Mandarin only, never Cantonese", () => {
    expect(mandarinRank("zh-HK")).toBeNull();
    expect(mandarinRank("yue-HK")).toBeNull();
    expect(mandarinRank("en-US")).toBeNull();
    expect(mandarinRank("zh_CN")).toBe(0);
  });

  it("hides online voices unless allowed, and ranks mainland natural voices first", () => {
    expect(rankVoices(list, false).map((x) => x.name)).toEqual(["Tingting", "Microsoft Huihui", "Microsoft Hanhan"]);
    expect(rankVoices(list, true)[0].name).toBe("Tingting");
    expect(rankVoices(list, true).map((x) => x.name)).toContain("Google 普通话（中国大陆）");
  });

  it("keeps the user's choice while it is usable", () => {
    expect(pickVoice(list, false, "Microsoft Hanhan")?.name).toBe("Microsoft Hanhan");
    expect(pickVoice(list, false, "Google 普通话（中国大陆）")?.name).toBe("Tingting"); // online, not allowed
    expect(pickVoice([v("Samantha", "en-US")], true, null)).toBeNull();
  });
});

describe("speech prefs", () => {
  it("parses with safe defaults", () => {
    expect(parseSpeechPrefs(null)).toEqual(DEFAULT_SPEECH_PREFS);
    expect(parseSpeechPrefs('{"voiceURI":"x","allowOnline":true,"rate":0.7}')).toEqual({ enabled: false, voiceURI: "x", allowOnline: true, rate: 0.7 });
    expect(parseSpeechPrefs('{"enabled":true}').enabled).toBe(true);
    expect(DEFAULT_SPEECH_PREFS.enabled).toBe(false); // off until the user turns it on
    expect(parseSpeechPrefs('{"rate":3,"allowOnline":"yes"}')).toEqual(DEFAULT_SPEECH_PREFS);
  });
});
