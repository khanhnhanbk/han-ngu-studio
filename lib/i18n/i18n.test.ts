import { describe, expect, it } from "vitest";

import { en } from "./en";
import { getDictionary } from "./index";
import { localeFromPath, localizeHref, stripLocale, switchLocalePath } from "./locale";
import { vi } from "./vi";

/** Every leaf of a dictionary as [path, value]. */
function leaves(value: unknown, path = ""): Array<[string, unknown]> {
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  }
  return [[path, value]];
}

// Vietnamese words that belong in the English text: names, and the
// Sino-Vietnamese terms the English UI keeps on purpose.
const ALLOWED = [
  "Hán Ngữ Studio",
  "đương/đang",
  "Hán Việt",
  "Tiếng Việt",
  "thủy",
  "Kim",
  "Mộc",
  "Thủy",
  "Hỏa",
  "Thổ",
];
const VIETNAMESE = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

describe("English dictionary", () => {
  it("has exactly the keys of the Vietnamese one", () => {
    expect(leaves(en).map(([p]) => p)).toEqual(leaves(vi).map(([p]) => p));
    expect(getDictionary("en")).toBe(en);
    expect(getDictionary("vi")).toBe(vi);
  });

  it("has no empty or Vietnamese text (apart from names)", () => {
    for (const [path, value] of leaves(en)) {
      if (typeof value === "function") continue;
      expect(String(value).trim(), path).not.toBe("");
      const rest = ALLOWED.reduce((s, word) => s.split(word).join(""), String(value));
      expect(VIETNAMESE.test(rest), `${path}: ${String(value)}`).toBe(false);
    }
  });

  it("formats the same plural helpers", () => {
    expect(en.comprehensibleInput.count(1)).toBe("1 new word");
    expect(en.comprehensibleInput.count(3)).toBe("3 new words");
  });
});

describe("locale from the URL", () => {
  it("reads /en paths as English", () => {
    expect(localeFromPath("/en")).toBe("en");
    expect(localeFromPath("/en/tools/pinyin")).toBe("en");
    expect(localeFromPath("/")).toBe("vi");
    expect(localeFromPath("/english")).toBe("vi");
    expect(localeFromPath(null)).toBe("vi");
  });

  it("prefixes page links only", () => {
    expect(localizeHref("en", "/")).toBe("/en");
    expect(localizeHref("en", "/#faq")).toBe("/en#faq");
    expect(localizeHref("en", "/tools/stroke-order#c=%E5%AD%A6")).toBe("/en/tools/stroke-order#c=%E5%AD%A6");
    expect(localizeHref("en", "#features")).toBe("#features");
    expect(localizeHref("en", "https://github.com/x")).toBe("https://github.com/x");
    expect(localizeHref("en", "/data/hanviet.json")).toBe("/data/hanviet.json");
    expect(localizeHref("en", "/en/tools/quiz")).toBe("/en/tools/quiz");
    expect(localizeHref("vi", "/tools/quiz")).toBe("/tools/quiz");
  });

  it("switches between the two versions of a page", () => {
    expect(switchLocalePath("/tools/pinyin", "en")).toBe("/en/tools/pinyin");
    expect(switchLocalePath("/en/tools/pinyin", "vi")).toBe("/tools/pinyin");
    expect(switchLocalePath("/", "en")).toBe("/en");
    expect(switchLocalePath("/en", "vi")).toBe("/");
    expect(stripLocale("/tools/anki/huong-dan")).toBe("/tools/anki/huong-dan");
  });
});
