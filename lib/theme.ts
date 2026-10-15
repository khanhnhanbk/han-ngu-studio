export type Mode = "light" | "dark" | "system";
export type Accent = "orange" | "red" | "teal" | "blue";
export type Theme = { mode: Mode; accent: Accent };

export const MODES: readonly Mode[] = ["light", "dark", "system"];
export const ACCENTS: readonly Accent[] = ["orange", "red", "teal", "blue"];
export const DEFAULT_THEME: Theme = { mode: "system", accent: "orange" };

/** Swatch colours for the picker (the accent's 600 shade, as in globals.css). */
export const ACCENT_SWATCH: Record<Accent, string> = {
  orange: "#ea580c",
  red: "#dc2626",
  teal: "#0d9488",
  blue: "#2563eb",
};

const STORAGE_KEY = "theme";

/** Parse a stored value; anything unknown falls back to the default. */
export function parseTheme(raw: string | null): Theme {
  try {
    const value = JSON.parse(raw ?? "") as Partial<Theme>;
    return {
      mode: MODES.includes(value.mode as Mode) ? (value.mode as Mode) : DEFAULT_THEME.mode,
      accent: ACCENTS.includes(value.accent as Accent)
        ? (value.accent as Accent)
        : DEFAULT_THEME.accent,
    };
  } catch {
    return DEFAULT_THEME;
  }
}

export function resolveDark(mode: Mode, prefersDark: boolean): boolean {
  return mode === "dark" || (mode === "system" && prefersDark);
}

export function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function readTheme(): Theme {
  try {
    return parseTheme(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Storage can be blocked (private mode, site data disabled).
    return DEFAULT_THEME;
  }
}

export function saveTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  } catch {
    // Not persisted; the theme still applies for this visit.
  }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", resolveDark(theme.mode, prefersDark()));
  if (theme.accent === "orange") root.removeAttribute("data-accent");
  else root.setAttribute("data-accent", theme.accent);
}

/**
 * Inline <head> script: applies the saved theme before first paint so the
 * page never flashes the wrong colours. Same rules as parseTheme/applyTheme.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var t={};try{t=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"{}")||{}}catch(e){}
var m=["light","dark","system"].indexOf(t.mode)>=0?t.mode:"system";
var a=["red","teal","blue"].indexOf(t.accent)>=0?t.accent:null;
var r=document.documentElement;
if(m==="dark"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))r.classList.add("dark");
if(a)r.setAttribute("data-accent",a);
}catch(e){}})();`;
