import { describe, expect, it } from "vitest";

import { DEFAULT_THEME, parseTheme, resolveDark, THEME_INIT_SCRIPT } from "./theme";

describe("parseTheme", () => {
  it("reads a saved theme", () => {
    expect(parseTheme('{"mode":"dark","accent":"teal"}')).toEqual({ mode: "dark", accent: "teal" });
  });

  it("falls back to the default for missing or invalid values", () => {
    expect(parseTheme(null)).toEqual(DEFAULT_THEME);
    expect(parseTheme("not json")).toEqual(DEFAULT_THEME);
    expect(parseTheme('{"mode":"neon","accent":"pink"}')).toEqual(DEFAULT_THEME);
    expect(parseTheme('{"accent":"blue"}')).toEqual({ mode: "system", accent: "blue" });
  });
});

describe("resolveDark", () => {
  it("follows the mode, or the OS in system mode", () => {
    expect(resolveDark("dark", false)).toBe(true);
    expect(resolveDark("light", true)).toBe(false);
    expect(resolveDark("system", true)).toBe(true);
    expect(resolveDark("system", false)).toBe(false);
  });
});

describe("THEME_INIT_SCRIPT", () => {
  it("is valid JavaScript", () => {
    expect(() => new Function(THEME_INIT_SCRIPT)).not.toThrow();
  });
});
