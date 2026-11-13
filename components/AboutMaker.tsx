"use client";

import Image from "next/image";

import { useDictionary } from "@/lib/i18n/useLocale";
import { PORTFOLIO_URL, ZALO_URL } from "@/lib/links";

/** "Who made this site": a real person behind the tools (photo from the owner's portfolio). */
export function AboutMaker() {
  const dict = useDictionary();
  const t = dict.maker;
  return (
    <section id="maker" className="section">
      <div className="container-page">
        <div className="card mx-auto flex max-w-3xl flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
          <Image
            src="/about/novian.webp"
            alt={t.photoAlt}
            width={96}
            height={96}
            unoptimized
            className="h-24 w-24 shrink-0 rounded-full border border-ink-900/10 object-cover"
          />
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            {/* Whole name parts never split across lines on a phone. */}
            <h2 className="mt-2 text-xl font-semibold text-ink-900">
              <span className="whitespace-nowrap">{t.name}</span> <span className="whitespace-nowrap">{t.nickname}</span>
            </h2>
            <p className="mt-1 text-balance text-sm text-ink-500">{t.role}</p>
            <p className="mt-3 text-sm text-ink-700">{t.story}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
              <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary px-3 py-2 text-sm">
                {t.portfolio}
              </a>
              <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="btn-secondary px-3 py-2 text-sm">
                {t.zalo}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
