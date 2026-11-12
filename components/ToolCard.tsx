"use client";

import type { ToolId } from "@/lib/links";
import { TOOL_GLYPHS } from "@/lib/tool-glyphs/glyphs";
import { ArrowRightIcon } from "./icons/arrow-right";
import { useIconTrigger } from "./icons/trigger";

/**
 * Landing-page tool card. The badge is one Chinese character for the tool
 * (Simplified or Traditional by CSS on <html data-script>, so no flash and no
 * OpenCC download); hovering or focusing the card plays the arrow.
 */
export function ToolCard({
  id,
  href,
  title,
  description,
  cta,
}: {
  id: ToolId;
  href: string;
  title: string;
  description: string;
  cta: string;
}) {
  const glyph = TOOL_GLYPHS[id];
  const arrow = useIconTrigger();
  const start = arrow.triggerProps.onMouseEnter;
  const stop = arrow.triggerProps.onMouseLeave;

  return (
    <a
      href={href}
      className="card group flex flex-col"
      onMouseEnter={start}
      onMouseLeave={stop}
      onFocus={start}
      onBlur={stop}
    >
      <div
        className="hanzi grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl text-brand-700"
        lang="zh"
        aria-hidden
      >
        {glyph.trad ? (
          <>
            <span className="glyph-simp">{glyph.simp}</span>
            <span className="glyph-trad">{glyph.trad}</span>
          </>
        ) : (
          glyph.simp
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-ink-700">{description}</p>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-ink group-hover:text-brand-700">
        {cta}
        <ArrowRightIcon ref={arrow.ref} size={16} aria-hidden />
      </span>
    </a>
  );
}
