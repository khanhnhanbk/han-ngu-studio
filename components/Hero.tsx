"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";

import {
  practiceSheetLink,
  TRY_CELLS,
  TRY_DEFAULT,
  TRY_DEFAULT_PINYIN,
  tryChars,
} from "@/lib/hero/tryBox";
import { useDictionary, useHref } from "@/lib/i18n/useLocale";
import { PRACTICE_SHEET_HREF, USER_GUIDE_URL } from "@/lib/links";
import { ArrowDownIcon } from "./icons/arrow-down";
import { ExternalLinkIcon } from "./icons/external-link";
import { SparklesIcon } from "./icons/sparkles";
import { PencilIcon } from "./icons/pencil";
import { IconButton, IconLink } from "./icons/trigger";

function MizigeCell({ char }: { char: string }) {
  return (
    <div className="relative aspect-square rounded-md border border-brand-300 bg-surface">
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] text-brand-500/40">
        <span className="absolute h-px w-full rotate-0 bg-brand-300/40" />
        <span className="absolute h-full w-px bg-brand-300/40" />
        <span className="absolute h-px w-[141%] rotate-45 bg-brand-300/30" />
        <span className="absolute h-px w-[141%] -rotate-45 bg-brand-300/30" />
      </span>
      <span className="hanzi absolute inset-0 flex items-center justify-center text-2xl text-ink-900 sm:text-3xl">
        {char}
      </span>
    </div>
  );
}

/**
 * "Thử ngay": type a few characters, see them in 米字格 cells with their
 * Pinyin, then open the practice sheet with them in the URL hash (never sent
 * to the server). pinyin-pro only downloads once the text is changed.
 */
function TryBox() {
  const dict = useDictionary();
  const href = useHref();
  const router = useRouter();
  const inputId = useId();
  const hintId = useId();
  const [text, setText] = useState(TRY_DEFAULT);
  const chars = tryChars(text);
  const shown = chars.slice(0, TRY_CELLS);
  const shownText = shown.join("");
  const [pinyin, setPinyin] = useState(TRY_DEFAULT_PINYIN);

  useEffect(() => {
    if (shownText === TRY_DEFAULT) {
      setPinyin(TRY_DEFAULT_PINYIN);
      return;
    }
    if (!shownText) {
      setPinyin("");
      return;
    }
    let alive = true;
    import("@/lib/practiceSheet").then(
      ({ getPinyin }) => alive && setPinyin(getPinyin(shownText)),
      () => alive && setPinyin(""),
    );
    return () => {
      alive = false;
    };
  }, [shownText]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (chars.length === 0) return;
    router.push(practiceSheetLink(href(PRACTICE_SHEET_HREF), chars));
  };

  return (
    <form
      onSubmit={submit}
      className="animate-fade-up rounded-2xl border border-ink-900/10 bg-surface p-5 shadow-lg"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink-900">{dict.hero.mockupTitle}</h2>
        <span className="rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700">
          米字格
        </span>
      </div>
      <label htmlFor={inputId} className="block text-sm font-medium text-ink-700">
        {dict.hero.tryLabel}
      </label>
      <input
        id={inputId}
        type="text"
        value={text}
        maxLength={300}
        autoComplete="off"
        aria-describedby={hintId}
        onChange={(e) => setText(e.target.value)}
        className="hanzi mt-1 w-full rounded-lg border border-ink-900/10 bg-surface px-4 py-2 text-lg text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <div aria-label={dict.hero.tryPreview} className="mt-4">
        <div className="mb-2 min-h-4 truncate text-xs text-ink-700/60" lang="zh-Latn-pinyin">
          {pinyin}
        </div>
        <div className="grid grid-cols-6 gap-2" aria-hidden>
          {Array.from({ length: TRY_CELLS }, (_, i) => (
            <MizigeCell key={i} char={shown[i] ?? ""} />
          ))}
        </div>
      </div>
      <p id={hintId} className={`mt-3 text-xs ${chars.length ? "text-ink-500" : "text-red-600 dark:text-red-400"}`}>
        {chars.length ? dict.hero.tryHint : dict.hero.tryEmpty}
      </p>
      <IconButton
        type="submit"
        icon={PencilIcon}
        disabled={chars.length === 0}
        className="btn-primary mt-4 w-full"
      >
        {dict.hero.tryButton}
      </IconButton>
    </form>
  );
}

export function Hero() {
  const dict = useDictionary();
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-96 bg-gradient-to-b from-brand-50 to-transparent"
      />
      <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        {/* No fade-in here: this text is the page's largest paint (LCP), and
            Chrome only counts it once it is visible (owner decision 2026-11-14). */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <SparklesIcon size={14} aria-hidden />
            {dict.hero.badge}
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            {dict.hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-700">
            {dict.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <IconLink href="#need" icon={ArrowDownIcon} iconAfter className="btn-primary">
              {dict.hero.ctaPrimary}
            </IconLink>
            <IconLink
              href={USER_GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              icon={ExternalLinkIcon}
              iconAfter
              className="btn-secondary"
            >
              {dict.hero.ctaSecondary}
            </IconLink>
          </div>
          <p className="mt-4 text-sm text-ink-700/70">{dict.hero.trustNote}</p>
        </div>

        <TryBox />
      </div>
    </section>
  );
}
