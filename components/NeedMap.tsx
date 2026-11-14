"use client";

import { useDictionary, useHref } from "@/lib/i18n/useLocale";
import { NEED_MAP, type Need } from "@/lib/needs";

import { ArrowRightIcon } from "./icons/arrow-right";

function Glyph({ glyph }: { glyph: Need["glyph"] }) {
  return (
    <span
      className="hanzi grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-xl text-brand-700"
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
    </span>
  );
}

/**
 * "Bạn muốn làm gì?": a tree from "Tôi muốn…" to three branches (the tool
 * groups) to one leaf per job, each leaf a link to the tool that does it
 * (owner request 2026-11-14: the first thing a teacher sees under the hero).
 * Wide screens draw the branches side by side under one root; phones stack
 * them, each with its own line down the left.
 */
export function NeedMap() {
  const dict = useDictionary();
  const href = useHref();
  const d = dict.needMap;

  return (
    <section id="need" className="section scroll-mt-24 !pt-0">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">{d.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">{d.title}</h2>
          <p className="mt-4 text-lg text-ink-700">{d.subtitle}</p>
        </div>

        <div className="mt-10 flex justify-center">
          <span className="rounded-full bg-brand-600 px-6 py-2.5 text-lg font-semibold text-on-brand shadow-sm">
            {d.root}
          </span>
        </div>
        {/* Trunk and the bar joining the three branches (wide screens only). */}
        <div aria-hidden className="mx-auto hidden h-6 w-0.5 bg-brand-200 lg:block" />
        <div aria-hidden className="mx-auto hidden h-0.5 w-2/3 bg-brand-200 lg:block" />

        <div className="mt-6 grid gap-8 lg:mt-0 lg:grid-cols-3 lg:gap-6">
          {NEED_MAP.map((branch) => {
            const group = dict.nav.groups[branch.group];
            return (
              <div key={branch.group} role="group" aria-label={group.title}>
                <div aria-hidden className="mx-auto hidden h-6 w-0.5 bg-brand-200 lg:block" />
                <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-center">
                  <h3 className="text-lg font-semibold text-ink-900">{group.title}</h3>
                  <p className="text-sm text-ink-500">{group.hint}</p>
                </div>
                <ul className="ml-6">
                  {branch.needs.map((need, i) => {
                    const text = d.needs[need.id];
                    return (
                      <li key={need.id} className="relative pl-5 pt-2">
                        {/* Each leaf draws its piece of the branch line; the last one stops at its tick. */}
                        <span
                          aria-hidden
                          className={`absolute left-0 top-0 w-0.5 bg-brand-200 ${i === branch.needs.length - 1 ? "h-[calc(50%+0.25rem)]" : "h-full"}`}
                        />
                        <span aria-hidden className="absolute left-0 top-[calc(50%+0.25rem)] h-0.5 w-4 bg-brand-200" />
                        <a
                          href={href(need.href)}
                          className="group flex items-center gap-3 rounded-xl border border-ink-900/10 bg-surface px-3 py-2.5 shadow-sm transition hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                        >
                          <Glyph glyph={need.glyph} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-balance font-medium text-ink-900">{text.title}</span>
                            <span className="block text-xs text-ink-500">{text.where}</span>
                          </span>
                          <ArrowRightIcon
                            size={16}
                            aria-hidden
                            className="shrink-0 text-ink-500 transition group-hover:translate-x-0.5 group-hover:text-brand-ink"
                          />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center">
          <a href="#features" className="text-sm font-semibold text-brand-ink hover:text-brand-700">
            {d.all} ↓
          </a>
        </p>
      </div>
    </section>
  );
}
