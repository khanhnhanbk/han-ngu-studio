import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { strokeFiles } from "@/lib/strokes/load";

import { formatBytes, parsePromptsOff, pendingBytes, THRESHOLD, type Sizes } from "./budget";

const root = join(__dirname, "../..");
const sizes = JSON.parse(readFileSync(join(root, "public/data/sizes.json"), "utf-8")) as Sizes;

describe("pendingBytes", () => {
  const table: Sizes = { "/a": 100, "/b": 50, "/c": 7 };

  it("sums each distinct key that is not available yet", () => {
    expect(pendingBytes(table, ["/a", "/b", "/a"], () => false)).toBe(150);
    expect(pendingBytes(table, ["/a", "/b", "/c"], (k) => k === "/b")).toBe(107);
  });

  it("counts unknown keys as nothing", () => {
    expect(pendingBytes(table, ["/missing"], () => false)).toBe(0);
  });
});

describe("formatBytes", () => {
  it("writes MB the Vietnamese way", () => {
    expect(formatBytes(THRESHOLD)).toBe("2,0 MB");
    expect(formatBytes(2.44 * 1024 * 1024)).toBe("2,4 MB");
    expect(formatBytes(15.6 * 1024 * 1024)).toBe("15,6 MB");
  });
});

describe("parsePromptsOff", () => {
  it("is off only after 'Không hỏi lại'", () => {
    expect(parsePromptsOff("off")).toBe(true);
    expect(parsePromptsOff(null)).toBe(false);
    expect(parsePromptsOff("on")).toBe(false);
  });
});

describe("sizes.json", () => {
  it("lists every data file and the OpenCC chunks", () => {
    const files: string[] = [];
    const walk = (dir: string, prefix: string) => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (`${prefix}${name}` === "/data/audio") continue; // not gated (see build-data.mjs)
        if (statSync(path).isDirectory()) walk(path, `${prefix}${name}/`);
        else if (`${prefix}${name}` !== "/data/sizes.json") files.push(`${prefix}${name}`);
      }
    };
    walk(join(root, "public/data"), "/data/");
    expect(Object.keys(sizes).filter((k) => k.startsWith("/data/")).sort()).toEqual(files.sort());
    expect(sizes["opencc:cn2t"]).toBeGreaterThan(0);
  });

  it("keeps ordinary practice sheets under the prompt threshold", () => {
    // 100 common characters with stroke order: no prompt.
    const common = Object.keys(JSON.parse(readFileSync(join(root, "public/data/decompose.json"), "utf-8"))).slice(0, 100);
    expect(pendingBytes(sizes, strokeFiles(common), () => false)).toBeLessThan(THRESHOLD);
  });
});
