"use client";

import { useEffect } from "react";

import { Footer } from "@/components/Footer";
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { IconLink } from "@/components/icons/trigger";
import { Navbar } from "@/components/Navbar";
import { useDictionary, useHref } from "@/lib/i18n/useLocale";

/** 迷路了 "lost", one character per 米字格 cell, like the practice sheet. */
const LOST = [
  { char: "迷", pinyin: "mí" },
  { char: "路", pinyin: "lù" },
  { char: "了", pinyin: "le" },
] as const;

function Cell({ char, pinyin }: { char: string; pinyin: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-sm text-ink-500">{pinyin}</span>
      <div className="relative aspect-square w-20 rounded-md border border-brand-300 bg-surface sm:w-24">
        <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="absolute h-px w-full bg-brand-300/40" />
          <span className="absolute h-full w-px bg-brand-300/40" />
          <span className="absolute h-px w-[141%] rotate-45 bg-brand-300/30" />
          <span className="absolute h-px w-[141%] -rotate-45 bg-brand-300/30" />
        </span>
        <span className="hanzi absolute inset-0 flex items-center justify-center text-5xl text-ink-900 sm:text-6xl">
          {char}
        </span>
      </div>
    </div>
  );
}

/** Shown for every unknown URL (app/not-found.tsx); the language follows the URL (/en/…). */
export function NotFoundPage() {
  const t = useDictionary().notFound;
  const href = useHref();
  // not-found.tsx is prerendered once, without the URL, so /en/… sets its English tab title here.
  useEffect(() => {
    document.title = t.metaTitle;
  }, [t.metaTitle]);
  const tools = [
    { href: "/lesson", label: t.tools.lesson },
    { href: "/tools/practice-sheet", label: t.tools.practiceSheet },
    { href: "/tools/lookup", label: t.tools.lookup },
  ];
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 h-96 bg-gradient-to-b from-brand-50 to-transparent"
        />
        <section className="section relative">
          <div className="container-page flex max-w-2xl flex-col items-center text-center">
            <p className="eyebrow">{t.eyebrow}</p>
            <div className="mt-6 flex gap-3" lang="zh-Hans">
              {LOST.map((c) => (
                <Cell key={c.char} {...c} />
              ))}
            </div>
            <p className="mt-3 text-sm text-ink-500">“{t.hanziMeaning}”</p>
            <h1 className="mt-8 text-balance text-3xl font-bold text-ink-900 sm:text-4xl">{t.title}</h1>
            <p className="mt-4 text-pretty text-lg text-ink-700">{t.subtitle}</p>
            <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <IconLink href={href("/")} icon={ArrowRightIcon} iconAfter className="btn-primary">
                {t.home}
              </IconLink>
              <a href={href("/guide")} className="btn-secondary">
                {t.guide}
              </a>
            </div>
            <p className="mt-10 text-sm text-ink-500">{t.popular}</p>
            <ul className="mt-3 flex flex-wrap justify-center gap-2">
              {tools.map((tool) => (
                <li key={tool.href}>
                  <a
                    href={href(tool.href)}
                    className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                  >
                    {tool.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
