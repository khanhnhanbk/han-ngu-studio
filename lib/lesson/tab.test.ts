import { describe, expect, it } from "vitest";

import { lessonTabHref, tabFromHash } from "./tab";

describe("tabFromHash", () => {
  it("reads a known tab", () => {
    expect(tabFromHash("#tab=slides")).toBe("slides");
    expect(tabFromHash("#tab=practiceSheet")).toBe("practiceSheet");
    expect(tabFromHash("tab=quiz")).toBe("quiz");
  });
  it("ignores anything else", () => {
    expect(tabFromHash("")).toBeNull();
    expect(tabFromHash("#tab=")).toBeNull();
    expect(tabFromHash("#tab=Slides")).toBeNull();
    expect(tabFromHash("#tab=toString")).toBeNull();
    expect(tabFromHash("#words=你好")).toBeNull();
  });
  it("round-trips the links it makes", () => {
    expect(lessonTabHref("table")).toBe("/lesson");
    expect(tabFromHash(lessonTabHref("anki").split("#")[1])).toBe("anki");
  });
});
