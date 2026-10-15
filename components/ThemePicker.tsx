"use client";

import { useEffect, useRef, useState } from "react";

import { getDictionary } from "@/lib/i18n";
import {
  ACCENT_SWATCH,
  ACCENTS,
  applyTheme,
  DEFAULT_THEME,
  MODES,
  readTheme,
  saveTheme,
  type Theme,
} from "@/lib/theme";

const dict = getDictionary("vi");

function PaletteIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.9 1.4-1.9-.3-1 .4-2.1 1.5-2.1H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10Z" />
      <circle cx="7.5" cy="11" r="1.2" fill="currentColor" />
      <circle cx="10.5" cy="7" r="1.2" fill="currentColor" />
      <circle cx="15" cy="7.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

/** Theme settings (mode + accent); `inline` renders the panel without a toggle button. */
export function ThemePicker({ inline = false }: { inline?: boolean }) {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // The init script already applied the saved theme; sync state with it.
  useEffect(() => setTheme(readTheme()), []);

  // In "system" mode, follow OS changes while the page is open.
  useEffect(() => {
    if (theme.mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme(theme);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function update(next: Partial<Theme>) {
    const value = { ...theme, ...next };
    setTheme(value);
    applyTheme(value);
    saveTheme(value);
  }

  const panel = (
    <div className="space-y-4 text-sm">
      <div>
        <p className="mb-2 font-medium text-ink-700">{dict.theme.mode}</p>
        <div role="radiogroup" aria-label={dict.theme.mode} className="grid grid-cols-3 gap-1 rounded-lg bg-ink-50 p-1">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={theme.mode === m}
              onClick={() => update({ mode: m })}
              className={`rounded-md px-2 py-1.5 font-medium transition ${
                theme.mode === m ? "bg-surface text-ink-900 shadow-sm" : "text-ink-700 hover:text-ink-900"
              }`}
            >
              {dict.theme.modes[m]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 font-medium text-ink-700">{dict.theme.accent}</p>
        <div role="radiogroup" aria-label={dict.theme.accent} className="grid grid-cols-6 gap-1">
          {ACCENTS.map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={theme.accent === a}
              aria-label={dict.theme.accentHints[a]}
              title={dict.theme.accentHints[a]}
              onClick={() => update({ accent: a })}
              className="group flex flex-col items-center gap-1"
            >
              <span
                className={`h-8 w-8 rounded-full ring-offset-2 ring-offset-surface transition ${
                  theme.accent === a ? "ring-2 ring-ink-900" : "group-hover:scale-110"
                }`}
                style={{ backgroundColor: ACCENT_SWATCH[a] }}
              />
              <span
                className={`whitespace-nowrap text-[11px] leading-tight ${
                  theme.accent === a ? "font-semibold text-ink-900" : "text-ink-700"
                }`}
              >
                {dict.theme.accents[a]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (inline) return panel;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium text-ink-700 transition hover:text-brand-600"
      >
        <PaletteIcon />
        <span>{dict.theme.button}</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={dict.theme.button}
          className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-ink-900/10 bg-surface p-4 shadow-lg"
        >
          {panel}
        </div>
      )}
    </div>
  );
}
