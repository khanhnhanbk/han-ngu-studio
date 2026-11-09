"use client";

import { useEffect, useState } from "react";

import { commonsPage, formsFor, loadAncient, svgDataUrl, type AncientEntry } from "@/lib/ancient/load";
import { useDictionary } from "@/lib/i18n/useLocale";

/**
 * "Chữ qua các thời kỳ" (phase 12d): giáp cốt → kim văn → đại triện → tiểu
 * triện drawings from Wikimedia Commons (public domain), then the khải form in
 * the site font. Each drawing links to its Commons file page. Shows nothing
 * when there is no drawing for the character.
 */
export function AncientForms({ shown, simp, tradForms }: { shown: string; simp: string; tradForms: readonly string[] }) {
  const t = useDictionary().decompose;
  const [entry, setEntry] = useState<{ simp: string; data: AncientEntry | null } | null>(null);

  useEffect(() => {
    let live = true;
    loadAncient(simp)
      .then((data) => live && setEntry({ simp, data }))
      .catch(() => live && setEntry({ simp, data: null }));
    return () => {
      live = false;
    };
  }, [simp]);

  const forms = entry?.simp === simp ? formsFor(entry.data, shown, simp, tradForms) : [];
  if (forms.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-ink-900">{t.ancient}</h3>
      <ol className="mt-2 flex flex-wrap items-start gap-1">
        {forms.map(({ form, svg, name }) => (
          <li key={form}>
            <a
              href={commonsPage(name, form)}
              target="_blank"
              rel="noopener noreferrer"
              title={t.ancientSource.replace("{file}", `${name}-${form}.svg`)}
              className="flex w-[52px] flex-col items-center gap-0.5 rounded-lg border border-ink-900/10 p-1 transition hover:border-brand-400"
            >
              {/* An <img> never runs SVG scripts; the file is ours (public/data/ancient). */}
              {/* eslint-disable-next-line @next/next/no-img-element -- inline data: SVG, nothing to optimise */}
              <img src={svgDataUrl(svg)} alt={t.ancientAlt.replace("{form}", t.ancientForms[form]).replace("{char}", name)} className="h-10 w-10 dark:invert" />
              <span className="text-center text-[10px] leading-tight text-ink-700">{t.ancientForms[form]}</span>
            </a>
          </li>
        ))}
        <li className="flex w-[52px] flex-col items-center gap-0.5 p-1">
          <span className="hanzi flex h-10 w-10 items-center justify-center text-3xl text-ink-900">{shown}</span>
          <span className="text-center text-[10px] leading-tight text-ink-700">{t.ancientKhai}</span>
        </li>
      </ol>
      <p className="mt-1 text-xs text-ink-500">{t.ancientHint}</p>
    </div>
  );
}
