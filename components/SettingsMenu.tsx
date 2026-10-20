"use client";

import { useEffect, useRef, useState } from "react";

import { SpeechNavButton } from "@/components/speech/SpeechNavButton";
import { useDictionary, useLocale } from "@/lib/i18n/useLocale";
import { useScript } from "@/lib/script/useScript";

import { ChevronDownIcon } from "./icons/chevron-down";
import { SettingsIcon } from "./icons/settings";
import { LanguageSwitch } from "./LanguageSwitch";
import { ScriptSwitch } from "./ScriptSwitch";
import { ThemePicker } from "./ThemePicker";

const GLYPH = { simp: "简", trad: "繁" } as const;

/** Language, Giản thể / Phồn thể, pronunciation and theme in one place (Navbar popover and phone menu). */
export function SettingsPanel() {
  const dict = useDictionary();
  const rows = [
    { label: dict.language.label, control: <LanguageSwitch inline /> },
    { label: dict.script.label, control: <ScriptSwitch inline /> },
    { label: dict.speech.navLabel, control: <SpeechNavButton /> },
  ];
  return (
    <div className="space-y-4 text-sm">
      {rows.map((row) => (
        <div key={row.label}>
          <p className="mb-2 font-medium text-ink-700">{row.label}</p>
          {row.control}
        </div>
      ))}
      <div className="border-t border-ink-900/10 pt-4">
        <p className="mb-2 font-semibold text-ink-900">{dict.theme.button}</p>
        <ThemePicker inline />
      </div>
    </div>
  );
}

/** ⚙ VI · 简 ▾ — shows the current language and script; opens SettingsPanel. */
export function SettingsMenu() {
  const dict = useDictionary();
  const locale = useLocale();
  const script = useScript();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={dict.nav.settings}
        title={dict.nav.settings}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-ink-50 px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:text-ink-900"
      >
        <SettingsIcon size={16} aria-hidden />
        <span className="uppercase">{locale}</span>
        <span aria-hidden>·</span>
        <span className="hanzi">{GLYPH[script]}</span>
        <ChevronDownIcon size={14} aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {/* Kept mounted (hidden) so ThemePicker keeps following the OS in "system" mode. */}
      <div
        role="dialog"
        aria-label={dict.nav.settings}
        className={`absolute right-0 top-full mt-2 w-80 rounded-xl border border-ink-900/10 bg-surface p-4 shadow-lg ${
          open ? "" : "hidden"
        }`}
      >
        <SettingsPanel />
      </div>
    </div>
  );
}
