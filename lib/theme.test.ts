import { describe, expect, it } from "vitest";

import { DEFAULT_THEME, parseTheme, resolveDark, THEME_INIT_SCRIPT } from "./theme";

describe("parseTheme", () => {
  it("reads a saved theme", () => {
    expect(parseTheme('{"mode":"dark","accent":"tho"}')).toEqual({ mode: "dark", accent: "tho" });
  });

  it("falls back to the default for missing or invalid values", () => {
    expect(parseTheme(null)).toEqual(DEFAULT_THEME);
    expect(parseTheme("not json")).toEqual(DEFAULT_THEME);
    expect(parseTheme('{"mode":"neon","accent":"pink"}')).toEqual(DEFAULT_THEME);
    expect(parseTheme('{"accent":"kim"}')).toEqual({ mode: "system", accent: "kim" });
  });

  it("maps accents saved by the first release to the closest Ngũ hành colour", () => {
    expect(parseTheme('{"mode":"light","accent":"orange"}').accent).toBe("default");
    expect(parseTheme('{"accent":"red"}').accent).toBe("hoa");
    expect(parseTheme('{"accent":"teal"}').accent).toBe("moc");
    expect(parseTheme('{"accent":"blue"}').accent).toBe("thuy");
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

  it("applies saved and legacy accents like applyTheme", () => {
    const run = (saved: string) => {
      const attrs: Record<string, string> = {};
      const classes = new Set<string>();
      const documentElement = {
        classList: { add: (c: string) => classes.add(c) },
        setAttribute: (k: string, v: string) => (attrs[k] = v),
      };
      new Function("localStorage", "document", "matchMedia", THEME_INIT_SCRIPT)(
        { getItem: () => saved },
        { documentElement },
        () => ({ matches: false }),
      );
      return { accent: attrs["data-accent"], dark: classes.has("dark") };
    };
    expect(run('{"mode":"dark","accent":"tho"}')).toEqual({ accent: "tho", dark: true });
    expect(run('{"accent":"teal"}')).toEqual({ accent: "moc", dark: false });
    expect(run('{"accent":"default"}')).toEqual({ accent: undefined, dark: false });
    expect(run('{"accent":"pink"}')).toEqual({ accent: undefined, dark: false });
  });
});
