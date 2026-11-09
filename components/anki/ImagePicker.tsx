"use client";

import { useRef, useState } from "react";

import { imageCredit, imageQuery, RateLimitedError, searchImages, type ImageCandidate } from "@/lib/anki/images";
import { useDictionary } from "@/lib/i18n/useLocale";

/** Words per page of the picker; one search each. */
const PAGE = 10;
/** Pause between searches of a page (Openverse allows about 20 a minute without an account). */
const GAP_MS = 3200;

type Row = { word: string; meaning: string };
type Found = { query: string; results: ImageCandidate[] | null; state: "idle" | "busy" | "done" | "error" };

/**
 * "Ảnh minh họa" on /tools/anki (phase 4a). Nothing is sent anywhere until
 * the learner ticks the consent box on this visit (it is not remembered).
 * Then each search sends one short English query to Openverse; the previews
 * load from the pictures' own sites. The chosen picture of each word is
 * reported to the page, which packs it into the .apkg.
 */
export function ImagePicker({
  rows,
  picks,
  onPick,
}: {
  rows: readonly Row[];
  picks: Readonly<Record<number, ImageCandidate>>;
  onPick: (index: number, choice: ImageCandidate | null) => void;
}) {
  const t = useDictionary().anki;
  const [consent, setConsent] = useState(false);
  const [page, setPage] = useState(0);
  const [found, setFound] = useState<Record<number, Found>>({});
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(false);
  const stop = useRef(false);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const indexes = Array.from({ length: Math.min(PAGE, rows.length - page * PAGE) }, (_, k) => page * PAGE + k);
  const queryOf = (i: number) => found[i]?.query ?? imageQuery(rows[i].meaning);
  const chosen = Object.keys(picks).length;

  async function search(i: number): Promise<"ok" | "limited" | "skip"> {
    const query = queryOf(i).trim();
    if (!query) return "skip";
    setFound((f) => ({ ...f, [i]: { query, results: f[i]?.results ?? null, state: "busy" } }));
    try {
      const results = await searchImages(query);
      setFound((f) => ({ ...f, [i]: { query, results, state: "done" } }));
      return "ok";
    } catch (err) {
      setFound((f) => ({ ...f, [i]: { query, results: null, state: "error" } }));
      return err instanceof RateLimitedError ? "limited" : "ok";
    }
  }

  async function searchPage() {
    if (!consent) return;
    setRunning(true);
    stop.current = false;
    setStatus("");
    let first = true;
    for (const i of indexes) {
      if (stop.current) break;
      if (found[i]?.state === "done" || !queryOf(i).trim()) continue;
      if (!first) await new Promise((r) => setTimeout(r, GAP_MS));
      first = false;
      if ((await search(i)) === "limited") {
        setStatus(t.imagesLimited);
        break;
      }
    }
    setRunning(false);
  }

  return (
    <section className="mt-6 rounded-xl border border-ink-900/10 p-4">
      <h2 className="font-semibold text-ink-900">{t.imagesTitle}</h2>
      <p className="mt-1 text-sm text-ink-700">{t.imagesHint}</p>
      <label className="mt-3 flex items-start gap-2 rounded-lg bg-brand-50 p-3 text-sm text-ink-900">
        <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          <span className="font-medium">{t.imagesConsent}</span>
          <span className="mt-0.5 block text-xs text-ink-700">{t.imagesConsentHint}</span>
        </span>
      </label>

      {consent && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <button type="button" className="btn-primary px-3 py-2" onClick={searchPage} disabled={running}>
              {running ? t.imagesSearching : t.imagesSearchPage}
            </button>
            {running && (
              <button type="button" className="btn-secondary px-3 py-2" onClick={() => (stop.current = true)}>
                {t.imagesStop}
              </button>
            )}
            <span className="text-ink-700">
              {t.imagesPage.replace("{n}", String(page + 1)).replace("{total}", String(pages))}
            </span>
            <button type="button" className="btn-secondary px-2 py-1" disabled={page === 0 || running} onClick={() => setPage(page - 1)}>
              ‹
            </button>
            <button
              type="button"
              className="btn-secondary px-2 py-1"
              disabled={page >= pages - 1 || running}
              onClick={() => setPage(page + 1)}
            >
              ›
            </button>
            <span className="text-ink-500">{t.imagesChosen.replace("{n}", String(chosen))}</span>
          </div>
          <p className="mt-2 min-h-5 text-xs text-ink-500" aria-live="polite">
            {status}
          </p>

          <ul className="mt-2 space-y-4">
            {indexes.map((i) => {
              const f = found[i];
              return (
                <li key={i} className="border-t border-ink-900/5 pt-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="hanzi text-2xl text-ink-900">{rows[i].word}</span>
                    <input
                      value={queryOf(i)}
                      onChange={(e) => setFound((all) => ({ ...all, [i]: { query: e.target.value, results: all[i]?.results ?? null, state: all[i]?.state ?? "idle" } }))}
                      placeholder={t.imagesQueryPlaceholder}
                      aria-label={t.imagesQuery.replace("{word}", rows[i].word)}
                      className="w-40 rounded-lg border border-ink-900/10 bg-surface px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      className="btn-secondary px-2 py-1 text-sm"
                      disabled={running || f?.state === "busy" || !queryOf(i).trim()}
                      onClick={async () => {
                        if ((await search(i)) === "limited") setStatus(t.imagesLimited);
                      }}
                    >
                      {t.imagesSearchOne}
                    </button>
                    {picks[i] && (
                      <button type="button" className="text-sm text-brand-ink underline" onClick={() => onPick(i, null)}>
                        {t.imagesClear}
                      </button>
                    )}
                    {f?.state === "busy" && <span className="text-xs text-ink-500">{t.imagesSearching}</span>}
                    {f?.state === "error" && <span className="text-xs text-red-600">{t.imagesError}</span>}
                    {f?.state === "done" && f.results?.length === 0 && <span className="text-xs text-ink-500">{t.imagesNone}</span>}
                  </div>
                  {f?.results && f.results.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {f.results.map((c) => {
                        const on = picks[i]?.id === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => onPick(i, on ? null : c)}
                            aria-pressed={on}
                            title={imageCredit(c)}
                            className={
                              "overflow-hidden rounded-lg border-2 transition " + (on ? "border-brand-500 ring-2 ring-brand-400" : "border-transparent hover:border-ink-900/20")
                            }
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element -- third-party preview, not optimisable */}
                            <img src={c.url} alt={c.title || rows[i].word} loading="lazy" referrerPolicy="no-referrer" className="aspect-square w-full bg-ink-50 object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {picks[i] && <p className="mt-1 text-xs text-ink-500">{imageCredit(picks[i])}</p>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
