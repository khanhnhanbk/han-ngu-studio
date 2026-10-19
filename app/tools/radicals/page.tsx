"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SpeakButton } from "@/components/speech/SpeakButton";
import { SpeechSettingsLink } from "@/components/speech/SpeechSettingsLink";
import { useDictionary, useHref } from "@/lib/i18n/useLocale";
import { loadRadicals } from "@/lib/radicals/load";
import { forScript, groupByStrokes, searchRadicals } from "@/lib/radicals/search";
import type { Radical } from "@/lib/radicals/types";
import { useConverter } from "@/lib/script/useScript";
import { defaultTone3 } from "@/lib/speech/tone";

/** Characters sent to the stroke-order page and the practice sheet. */
const LINKED_EXAMPLES = 6;

function Details({ radical, onClose }: { radical: Radical; onClose: () => void }) {
  const dict = useDictionary();
  const t = dict.radicals;
  const href = useHref();
  // Example characters may be Traditional (Phồn thể); recordings are Simplified.
  const { conv } = useConverter();
  const chars = [radical.radical, ...radical.chars.slice(0, LINKED_EXAMPLES).map(([c]) => c)].join("");
  // Characters travel in the hash, which is never sent to the server.
  const strokeHref = href(`/tools/stroke-order#${new URLSearchParams({ c: chars })}`);
  const sheetHref = href(`/tools/practice-sheet#${new URLSearchParams({ chars, strokes: "1" })}`);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-ink-700">{t.number.replace("{n}", String(radical.no))}</p>
        <button type="button" className="text-sm text-ink-700 underline hover:text-ink-900" onClick={onClose}>
          {t.close}
        </button>
      </div>
      <div className="mt-2 flex items-end gap-4">
        <span className="hanzi text-7xl leading-none text-ink-900">{radical.radical}</span>
        <div>
          <p className="text-2xl font-bold text-ink-900">{radical.name}</p>
          <p className="text-ink-700">{radical.pinyin}</p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-ink-700">{t.meaning}</dt>
        <dd className="text-ink-900">{radical.meaning}</dd>
        <dt className="text-ink-700">{t.strokes}</dt>
        <dd className="text-ink-900">{radical.strokes}</dd>
        <dt className="text-ink-700">{t.variants}</dt>
        <dd className={radical.variants.length ? "hanzi text-xl text-ink-900" : "text-ink-900"}>
          {radical.variants.length ? radical.variants.join("　") : t.noVariants}
        </dd>
      </dl>

      <h3 className="mt-6 font-semibold text-ink-900">{t.examples}</h3>
      {radical.chars.length === 0 ? (
        <p className="mt-2 text-sm text-ink-700">{t.noExamples}</p>
      ) : (
        <>
          <ul className="mt-3 grid grid-cols-4 gap-2">
            {radical.chars.map(([char, hv]) => (
              <li key={char} className="relative">
                <a
                  href={href(`/tools/stroke-order#${new URLSearchParams({ c: char })}`)}
                  className="flex flex-col items-center rounded-lg border border-ink-900/10 px-1 py-2 hover:border-brand-500 hover:bg-brand-50"
                >
                  <span className="hanzi text-2xl text-ink-900">{char}</span>
                  <span className="text-xs text-ink-700">{hv}</span>
                </a>
                {/* Beside the link, not inside it: a link cannot hold a button. */}
                <SpeakButton
                  word={conv.toSimp(char)}
                  label={char}
                  tone3={defaultTone3(conv.toSimp(char))}
                  size={12}
                  className="absolute left-0.5 top-0.5 p-1"
                />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-700/70">
            {t.exampleCount
              .replace("{shown}", String(radical.chars.length))
              .replace("{count}", String(radical.count))}
          </p>
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <a href={strokeHref} className="btn-secondary">
          {t.strokeOrder}
        </a>
        <a href={sheetHref} className="btn-primary">
          {t.practice}
        </a>
        <a href={href(`/tools/decompose#${new URLSearchParams({ c: chars })}`)} className="btn-secondary">
          {t.decompose}
        </a>
      </div>
    </div>
  );
}

export default function RadicalsPage() {
  const dict = useDictionary();
  const t = dict.radicals;
  const [data, setData] = useState<Radical[] | null>(null);
  const { conv } = useConverter();
  // Example characters and search use the chosen script's lists.
  const radicals = useMemo(() => data && forScript(data, conv.script), [data, conv.script]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Load the table, then open the radical from a shared link (#r=85).
  useEffect(() => {
    loadRadicals()
      .then((data) => {
        setData(data);
        const no = Number(new URLSearchParams(window.location.hash.slice(1)).get("r"));
        if (Number.isInteger(no) && no >= 1 && no <= data.length) setSelected(no);
      })
      .catch(() => setError(t.loadFailed));
  }, [t]);

  // In Phồn thể mode a Simplified query finds its Traditional form too (头 → 頭).
  const results = useMemo(() => {
    if (!radicals) return [];
    const q = conv.script === "trad" && /\p{Script=Han}/u.test(query) ? query + conv.toShown(query) : query;
    return searchRadicals(radicals, q);
  }, [radicals, query, conv]);
  const groups = useMemo(() => groupByStrokes(results), [results]);
  const current = radicals && selected ? radicals[selected - 1] : null;

  function select(no: number | null) {
    setSelected(no);
    window.history.replaceState(null, "", no ? `#r=${no}` : window.location.pathname);
    // On narrow screens the details sit above the grid: bring them into view.
    if (no && window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="section">
          <div className="container-page">
            <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{t.title}</h1>
            <p className="mt-4 text-lg text-ink-700">{t.subtitle}</p>

            <label className="mt-8 block max-w-xl text-sm font-medium text-ink-700">
              {t.search}
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="mt-1 w-full rounded-lg border border-ink-900/10 bg-surface px-4 py-2 text-base text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>

            {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
            {!radicals && !error && <p className="mt-6 text-sm text-ink-700">{t.loading}</p>}

            {radicals && (
              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
                <div ref={detailsRef} className="scroll-mt-24 lg:order-2">
                  <div className="lg:sticky lg:top-24">
                    {current ? (
                      <Details radical={current} onClose={() => select(null)} />
                    ) : (
                      <p className="hidden rounded-2xl border border-dashed border-ink-900/15 p-6 text-sm text-ink-700 lg:block">
                        {t.pick}
                      </p>
                    )}
                  </div>
                </div>

                <div className="lg:order-1">
                  <p className="text-sm text-ink-700/70">{t.resultCount.replace("{n}", String(results.length))}</p>
                  {results.length === 0 && <p className="mt-4 text-ink-700">{t.noResults}</p>}
                  {groups.map(([strokes, list]) => (
                    <section key={strokes} className="mt-6">
                      <h2 className="text-sm font-semibold text-ink-900">
                        {t.strokesGroup.replace("{n}", String(strokes))}
                      </h2>
                      <ul className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
                        {list.map((r) => (
                          <li key={r.no}>
                            <button
                              type="button"
                              onClick={() => select(r.no)}
                              aria-pressed={r.no === selected}
                              className={`flex w-full flex-col items-center rounded-lg border px-1 py-2 transition ${
                                r.no === selected
                                  ? "border-brand-500 bg-brand-50"
                                  : "border-ink-900/10 bg-surface hover:border-brand-500"
                              }`}
                            >
                              <span className="text-[10px] text-ink-700/70">{r.no}</span>
                              <span className="hanzi text-2xl leading-tight text-ink-900">{r.radical}</span>
                              <span className="text-xs text-ink-700">{r.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-10 text-xs text-ink-700/70">
              {t.credits} {dict.speech.credit} <SpeechSettingsLink />
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
