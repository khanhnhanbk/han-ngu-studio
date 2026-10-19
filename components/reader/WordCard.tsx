"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useDictionary, useHref } from "@/lib/i18n/useLocale";
import type { ReaderWord } from "@/lib/reader/analyze";
import { SpeakButton } from "@/components/speech/SpeakButton";

import { LEVEL_STYLE, levelLabel } from "./levels";

export type CardTarget = {
  word: ReaderWord;
  /** The word as shown (Traditional in Phồn thể mode). */
  shown: string;
  count: number;
  /** Where the tapped word is on screen, to place the card under it. */
  rect: { top: number; bottom: number; left: number };
};

const CARD_WIDTH = 320;

/**
 * Details of a tapped word. Under the word on wide screens, a bottom sheet on
 * phones. Esc, the close button, a click outside or scrolling closes it.
 */
export function WordCard({
  target,
  known,
  myLevel,
  inList,
  onToggleKnown,
  onAdd,
  onClose,
}: {
  target: CardTarget;
  /** "list": marked known by the user; "level": known through "my level"; null: new. */
  known: "list" | "level" | null;
  /** "HSK 3" — the reader's level, for the "known up to" label. */
  myLevel: string;
  inList: boolean;
  onToggleKnown: () => void;
  onAdd: () => void;
  onClose: () => void;
}) {
  const t = useDictionary().reader;
  const href = useHref();
  const ref = useRef<HTMLDivElement>(null);
  const { word, shown, count, rect } = target;
  // Wide screens: under the word, or above it when there is no room below.
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const wide = typeof window !== "undefined" && window.innerWidth >= 640;

  useLayoutEffect(() => {
    if (!wide || !ref.current) return setPos(null);
    const height = ref.current.offsetHeight;
    const below = rect.bottom + 8;
    const top = below + height <= window.innerHeight - 8 ? below : Math.max(8, rect.top - height - 8);
    setPos({ top, left: Math.max(16, Math.min(rect.left, window.innerWidth - CARD_WIDTH - 16)) });
  }, [wide, rect, word]);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onClose, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onClose);
    };
  }, [onClose]);

  // Measured before paint (layout effect), so the card never shows in the wrong place.
  const style = wide ? { top: pos?.top ?? rect.bottom + 8, left: pos?.left ?? 16, width: CARD_WIDTH, visibility: pos ? undefined : ("hidden" as const) } : undefined;
  const level = word.level ?? "none";
  const meaning = (value: string) => value || <span className="text-ink-500">{t.card.noMeaning}</span>;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={shown}
      tabIndex={-1}
      style={style}
      className={`fixed z-[55] overflow-y-auto rounded-xl border border-ink-900/10 bg-surface p-4 shadow-lg focus:outline-none ${
        wide ? "max-h-[70vh]" : "inset-x-0 bottom-0 max-h-[60vh] rounded-b-none"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2">
            <span className="hanzi text-4xl text-ink-900">{shown}</span>
            {/* Read as in this sentence: a single character uses the syllable for its reading here. */}
            <SpeakButton word={word.text} label={shown} tone3={word.tone3} contextual size={22} />
          </p>
          <p className="mt-1 text-lg text-brand-ink">{word.pinyin}</p>
        </div>
        <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-700">
          <span className={`h-2 w-2 rounded-full ${LEVEL_STYLE[level].bg}`} aria-hidden />
          {levelLabel(level, t.levelNone)}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-ink-500">{t.card.hanviet}</dt>
        <dd className="font-semibold text-ink-900">{word.hanviet}</dd>
        <dt className="text-ink-500">{t.card.meaningVi}</dt>
        <dd className="text-ink-900">{meaning(word.meaningVi)}</dd>
        <dt className="text-ink-500">{t.card.meaningEn}</dt>
        <dd className="text-ink-700">{meaning(word.meaningEn)}</dd>
      </dl>
      {word.chars && word.chars.length > 1 && (
        <p className="mt-2 text-xs text-ink-700">
          <span className="text-ink-500">{t.card.charLevels}: </span>
          {word.chars.map(([c, l], i) => (
            <span key={i} className="mr-2 inline-flex items-center gap-1 whitespace-nowrap">
              <span className="hanzi text-sm text-ink-900">{c}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${LEVEL_STYLE[l ?? "none"].bg}`} aria-hidden />
              {levelLabel(l ?? "none", t.levelNone)}
            </span>
          ))}
        </p>
      )}
      <p className="mt-2 text-xs text-ink-500">{t.card.occurrences.replace("{n}", String(count))}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {known === "level" ? (
          <span className="rounded-lg bg-ink-50 px-3 py-1.5 text-xs text-ink-700">
            ✓ {t.card.knownByLevel.replace("{level}", myLevel)}
          </span>
        ) : (
          <button type="button" aria-pressed={known === "list"} onClick={onToggleKnown} className="btn-secondary px-3 py-1.5 text-xs">
            {known === "list" ? t.card.unmarkKnown : `✓ ${t.card.markKnown}`}
          </button>
        )}
        <button type="button" onClick={onAdd} disabled={inList} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-60">
          {inList ? t.card.inList : t.card.addToList}
        </button>
        <a href={href(`/tools/stroke-order#${new URLSearchParams({ c: shown })}`)} className="btn-secondary px-3 py-1.5 text-xs">
          {t.card.strokeOrder}
        </a>
        <a href={href(`/tools/decompose#${new URLSearchParams({ c: shown })}`)} className="btn-secondary px-3 py-1.5 text-xs">
          {t.card.decompose}
        </a>
        <button type="button" onClick={onClose} className="ml-auto px-2 text-xs text-ink-500 hover:text-ink-900">
          {t.card.close}
        </button>
      </div>
    </div>
  );
}
