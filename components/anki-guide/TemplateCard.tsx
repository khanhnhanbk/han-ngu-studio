"use client";

import { useEffect, useRef, useState } from "react";

import { getDictionary } from "@/lib/i18n";
import { CARD_CSS, renderCard, SAMPLE_ROW, type CardTemplate } from "@/lib/anki/templates";

import { CodeBlock } from "./CopyButton";

const t = getDictionary("vi").ankiGuide;

// Preview only: the site's own fonts as the last fallbacks, so Chinese shows
// in a Kai style even without KaiTi installed (in Anki the card uses the
// fonts installed on the device).
const PREVIEW_CSS = `:host { display: block; }
.card { padding: 16px; min-height: 100%; box-sizing: border-box; }
.hanzi, .sentence, #typeans { font-family: "LXGW WenKai TC", "KaiTi", "STKaiti", var(--font-kai), var(--font-hanzi), serif; }
#typeans { width: 90%; padding: 6px; margin-top: 12px; font-size: 20px; }
hr { border: 0; border-top: 1px solid #d6d3d1; margin: 16px 0; }`;

/**
 * One suggested card type: what it is for, a preview rendered the way Anki
 * renders it (in a shadow root, so the card CSS stays inside it while the
 * site's fonts still apply), and the front and back templates to copy.
 */
export function TemplateCard({ template }: { template: CardTemplate }) {
  const [side, setSide] = useState<"front" | "back">("front");
  const [night, setNight] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const html = renderCard(template, SAMPLE_ROW)[side];
  const info = t.templates[template.id];

  // The HTML is our own template with escaped sample data; innerHTML never
  // runs scripts.
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const root = el.shadowRoot ?? el.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${CARD_CSS}\n${PREVIEW_CSS}</style><div class="card${night ? " nightMode" : ""}">${html}</div>`;
  }, [html, night]);

  const toggle = (active: boolean) =>
    `rounded-md px-3 py-1 text-xs font-medium transition ${
      active ? "bg-surface text-ink-900 shadow-sm" : "text-ink-700 hover:text-ink-900"
    }`;

  return (
    <article className="card">
      <h3 className="text-xl font-semibold text-ink-900">{info.name}</h3>
      <p className="mt-1 text-sm text-ink-700">{info.purpose}</p>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-ink-900">{t.preview}</p>
            <div className="flex flex-wrap gap-2">
              <div role="group" aria-label={t.preview} className="inline-flex gap-1 rounded-lg bg-ink-50 p-1">
                <button type="button" aria-pressed={side === "front"} className={toggle(side === "front")} onClick={() => setSide("front")}>
                  {t.front}
                </button>
                <button type="button" aria-pressed={side === "back"} className={toggle(side === "back")} onClick={() => setSide("back")}>
                  {t.back}
                </button>
              </div>
              <div className="inline-flex rounded-lg bg-ink-50 p-1">
                <button type="button" aria-pressed={night} className={toggle(night)} onClick={() => setNight((v) => !v)}>
                  {t.night}
                </button>
              </div>
            </div>
          </div>
          <div
            ref={host}
            role="region"
            aria-label={`${t.preview}: ${info.name}, ${side === "front" ? t.front : t.back}`}
            className="mt-2 h-96 overflow-auto rounded-lg border border-ink-900/10"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <CodeBlock title={t.frontCode} code={template.front} />
          <CodeBlock title={t.backCode} code={template.back} />
        </div>
      </div>
    </article>
  );
}
