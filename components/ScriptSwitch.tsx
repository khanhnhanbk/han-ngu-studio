"use client";

import { getDictionary } from "@/lib/i18n";
import { SCRIPTS, saveScript } from "@/lib/script/preference";
import { useScript } from "@/lib/script/useScript";

const dict = getDictionary("vi");

const GLYPH = { simp: "简", trad: "繁" } as const;

/** Giản thể / Phồn thể segmented control; the choice applies to every tool. */
export function ScriptSwitch({ inline = false }: { inline?: boolean }) {
  const script = useScript();

  return (
    <div
      role="group"
      aria-label={dict.script.label}
      className="inline-flex gap-1 rounded-lg bg-ink-50 p-1 text-sm"
    >
      {SCRIPTS.map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={script === s}
          title={s === "simp" ? dict.script.simpHint : dict.script.tradHint}
          onClick={() => saveScript(s)}
          className={`flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 font-medium transition ${
            script === s ? "bg-surface text-ink-900 shadow-sm" : "text-ink-700 hover:text-ink-900"
          }`}
        >
          <span className="hanzi" aria-hidden>
            {GLYPH[s]}
          </span>
          {/* The navbar has little room: glyph only, name for screen readers. */}
          <span className={inline ? "" : "sr-only"}>{dict.script[s]}</span>
        </button>
      ))}
    </div>
  );
}
