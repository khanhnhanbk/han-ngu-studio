"use client";

import type { ToolId } from "@/lib/links";
import { ArrowRightIcon } from "./icons/arrow-right";
import { BookOpenIcon } from "./icons/book-open";
import { LanguagesIcon } from "./icons/languages";
import { LayersIcon } from "./icons/layers";
import { ListOrderedIcon } from "./icons/list-ordered";
import { PaintbrushIcon } from "./icons/paintbrush";
import { PencilIcon } from "./icons/pencil";
import { PuzzleIcon } from "./icons/puzzle";
import { ScissorsIcon } from "./icons/scissors";
import { SparklesIcon } from "./icons/sparkles";
import { useIconTrigger, type AnimatedIcon } from "./icons/trigger";

const TOOL_ICONS: Record<ToolId, AnimatedIcon> = {
  practiceSheet: PencilIcon,
  strokeOrder: PaintbrushIcon,
  segment: ScissorsIcon,
  pinyin: LanguagesIcon,
  hanviet: BookOpenIcon,
  anki: LayersIcon,
  quiz: SparklesIcon,
  radicals: PuzzleIcon,
  comprehensibleInput: ListOrderedIcon,
};

/** Landing-page tool card; hovering or focusing the card plays both icons. */
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
  const Icon = TOOL_ICONS[id];
  const badge = useIconTrigger();
  const arrow = useIconTrigger();
  const start = () => {
    badge.triggerProps.onMouseEnter();
    arrow.triggerProps.onMouseEnter();
  };
  const stop = () => {
    badge.triggerProps.onMouseLeave();
    arrow.triggerProps.onMouseLeave();
  };

  return (
    <a
      href={href}
      className="card group flex flex-col"
      onMouseEnter={start}
      onMouseLeave={stop}
      onFocus={start}
      onBlur={stop}
    >
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
        <Icon ref={badge.ref} size={22} aria-hidden />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-ink-700">{description}</p>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 group-hover:text-brand-700">
        {cta}
        <ArrowRightIcon ref={arrow.ref} size={16} aria-hidden />
      </span>
    </a>
  );
}
