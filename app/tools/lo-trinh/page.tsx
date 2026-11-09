"use client";

import { useEffect, useMemo, useState } from "react";

import { FileInput } from "@/components/FileInput";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { confirmDownload } from "@/lib/data/budget";
import { etymologyOf } from "@/lib/decompose/ids";
import { DECOMPOSE_FILE, loadDecompose } from "@/lib/decompose/load";
import { buildTree, treeGlyphs } from "@/lib/decompose/tree";
import type { DecomposeData } from "@/lib/decompose/types";
import { downloadText } from "@/lib/download";
import { HANVIET_FILE, loadHanviet } from "@/lib/hanviet/load";
import { allCharReadings, type HanvietData } from "@/lib/hanviet/lookup";
import { useDictionary, useHref } from "@/lib/i18n/useLocale";
import { orderPath, phoneticFamilies, pickChars, toStages } from "@/lib/path/path";
import { parseProgressTsv, progressToTsv, readProgress, toggled, writeProgress, type PathProgress } from "@/lib/path/progress";
import { wordsHash } from "@/lib/reader/handoff";
import { useConverter } from "@/lib/script/useScript";
import { loadVocab, VOCAB_FILE } from "@/lib/vocab/load";
import { vocabFor, type VocabData } from "@/lib/vocab/lookup";

type Tables = { decompose: DecomposeData; hanviet: HanvietData | null; vocab: VocabData | null };

const today = () => new Date().toISOString().slice(0, 10);

/** The stage in the hash (#chang=3, 1-based), so a stage can be bookmarked. */
function stageFromHash(count: number): number {
  const n = Number.parseInt(new URLSearchParams(window.location.hash.slice(1)).get("chang") ?? "", 10);
  return Number.isInteger(n) && n >= 1 && n <= count ? n - 1 : 0;
}

/** HSK 1–3 characters (Simplified), from the words first listed at those levels. */
function hsk13(vocab: VocabData, data: DecomposeData): Set<string> {
  const out = new Set<string>();
  for (const [word, entries] of Object.entries(vocab)) {
    if (Math.min(...entries.map((e) => Number.parseInt(e[0], 10))) > 3) continue;
    for (const c of word) if (Object.hasOwn(data, c)) out.add(c);
  }
  return out;
}

export default function PathPage() {
  const dict = useDictionary();
  const t = dict.path;
  const href = useHref();
  const { conv } = useConverter();
  const [tables, setTables] = useState<Tables | null>(null);
  const [error, setError] = useState("");
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState<PathProgress>({});
  const [status, setStatus] = useState("");

  useEffect(() => setProgress(readProgress()), []);

  useEffect(() => {
    let live = true;
    (async () => {
      if (!(await confirmDownload([DECOMPOSE_FILE, VOCAB_FILE, HANVIET_FILE]))) return live && setError(dict.download.declined);
      const [decompose, vocab, hanviet] = await Promise.all([
        loadDecompose(),
        loadVocab().catch(() => null),
        loadHanviet().catch(() => null),
      ]);
      if (live) setTables({ decompose, vocab, hanviet });
    })().catch(() => live && setError(t.loadFailed));
    return () => {
      live = false;
    };
  }, [dict, t]);

  // The path is Simplified (the data is); characters are shown through conv.
  const stages = useMemo(() => {
    if (!tables?.vocab) return [];
    const data = tables.decompose;
    const chars = pickChars(Object.keys(data), hsk13(tables.vocab, data));
    return toStages(orderPath(chars, (c) => treeGlyphs(buildTree(c, data, () => undefined))));
  }, [tables]);

  useEffect(() => {
    if (stages.length) setStage(stageFromHash(stages.length));
  }, [stages]);

  function openStage(i: number) {
    setStage(i);
    window.history.replaceState(null, "", `#chang=${i + 1}`);
    document.getElementById("stage")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function save(next: PathProgress, message = "") {
    setProgress(next);
    setStatus(writeProgress(next) ? message : t.unsaved);
  }

  async function handleImport(file: File | undefined) {
    if (!file) return;
    const imported = parseProgressTsv(await file.text(), today());
    const n = Object.keys(imported).length;
    if (n === 0) return setStatus(t.importEmpty);
    save({ ...readProgress(), ...imported }, t.imported.replace("{n}", String(n)));
  }

  const shown = (c: string) => conv.toShown(c);
  const learned = (c: string) => Object.hasOwn(progress, c);
  const total = stages.reduce((n, s) => n + s.filter(learned).length, 0);
  const current = stages[stage] ?? [];
  const start = stages.slice(0, stage).reduce((n, s) => n + s.length, 0);
  const meaningOf = (c: string) => {
    const m = tables?.vocab ? (vocabFor(tables.vocab, c)?.meaning ?? "") : "";
    return m.split(/[;；]/)[0].trim();
  };
  const families = tables ? phoneticFamilies(current, (c) => etymologyOf(tables.decompose[c]).phonetic) : [];
  const shownStage = current.map(shown);

  return (
    <>
      <Navbar />
      <main>
        <section className="section">
          <div className="container-page">
            <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{t.title}</h1>
            <p className="mt-4 text-lg text-ink-700">{t.subtitle}</p>

            {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
            {!error && stages.length === 0 && <p className="mt-6 text-sm text-ink-500">{t.loading}</p>}

            {stages.length > 0 && (
              <>
                <div className="card mt-8">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-lg font-semibold text-ink-900">{t.stages}</h2>
                    <p className="text-sm text-ink-700">
                      {t.total.replace("{n}", String(total)).replace("{total}", String(stages.flat().length))}
                    </p>
                  </div>
                  <ol className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
                    {stages.map((s, i) => {
                      const done = s.filter(learned).length;
                      return (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => openStage(i)}
                            aria-current={i === stage ? "true" : undefined}
                            className={
                              "w-full rounded-xl border p-2.5 text-left transition sm:p-3 " +
                              (i === stage ? "border-brand-500 bg-brand-50 ring-2 ring-brand-400" : "border-ink-900/10 hover:border-brand-400")
                            }
                          >
                            <span className="block text-sm font-semibold text-ink-900">{t.stage.replace("{n}", String(i + 1))}</span>
                            <span className="hanzi mt-1 block truncate text-lg text-ink-700">{s.slice(0, 8).map(shown).join("")}…</span>
                            <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-ink-900/10" aria-hidden="true">
                              <span className="block h-full bg-brand-600" style={{ width: `${(done / s.length) * 100}%` }} />
                            </span>
                            <span className="mt-1 block text-xs text-ink-500">
                              {t.stageProgress.replace("{n}", String(done)).replace("{total}", String(s.length))}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-ink-700">
                    <button
                      type="button"
                      className="btn-secondary px-3 py-2"
                      disabled={total === 0}
                      onClick={() => downloadText(progressToTsv(progress), "lo-trinh-da-hoc.tsv", "text/tab-separated-values")}
                    >
                      {t.export}
                    </button>
                    <FileInput buttonLabel={t.import} accept=".tsv,.txt" onFile={handleImport} showName={false} />
                  </div>
                  <p className="mt-2 min-h-5 text-xs text-ink-500" aria-live="polite">
                    {status || t.privacy}
                  </p>
                </div>

                <div id="stage" className="card mt-6 scroll-mt-24">
                  <h2 className="text-lg font-semibold text-ink-900">
                    {t.stage.replace("{n}", String(stage + 1))}
                    <span className="ml-2 text-sm font-normal text-ink-500">
                      {t.stageRange.replace("{from}", String(start + 1)).replace("{to}", String(start + current.length))}
                    </span>
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={href(`/tools/anki${wordsHash(shownStage)}`)} className="btn-primary px-3 py-2">
                      {t.anki}
                    </a>
                    <a
                      href={href(`/tools/practice-sheet#${new URLSearchParams({ chars: shownStage.join(""), strokes: "1" })}`)}
                      className="btn-secondary px-3 py-2"
                    >
                      {t.sheet}
                    </a>
                  </div>

                  {families.length > 0 && (
                    <div className="mt-5">
                      <h3 className="text-sm font-semibold text-ink-900">{t.families}</h3>
                      <p className="mt-1 text-xs text-ink-500">{t.familiesHint}</p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {families.map((f) => (
                          <li key={f.phonetic} className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm text-ink-700">
                            <span className="hanzi text-brand-ink">{shown(f.phonetic)}</span> →{" "}
                            <span className="hanzi text-lg text-ink-900">{f.chars.map(shown).join(" ")}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {current.map((c) => {
                      const type = tables ? etymologyOf(tables.decompose[c]).type : "";
                      const hv = allCharReadings(tables?.hanviet ?? null, c)[0] ?? "";
                      const done = learned(c);
                      return (
                        <li
                          key={c}
                          className={"flex flex-col rounded-xl border p-2 " + (done ? "border-brand-300 bg-brand-50" : "border-ink-900/10")}
                        >
                          <div className="flex items-start gap-2">
                            <a
                              href={href(`/tools/decompose#${new URLSearchParams({ c: shown(c) })}`)}
                              className="hanzi text-4xl leading-none text-ink-900 hover:text-brand-ink"
                              title={t.openDecompose.replace("{char}", shown(c))}
                            >
                              {shown(c)}
                            </a>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-brand-ink">{hv || "—"}</p>
                              {type && (
                                <span className="mt-0.5 inline-block rounded-full bg-ink-900/5 px-1.5 text-[10px] text-ink-700">
                                  {dict.decompose.formationTypes[type]}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 line-clamp-2 min-h-8 text-xs text-ink-700">{meaningOf(c)}</p>
                          <label className="mt-1 flex items-center gap-1.5 text-xs text-ink-700">
                            <input type="checkbox" checked={done} onChange={() => save(toggled(progress, c, today()))} />
                            {t.learned}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}

            <p className="mt-6 text-xs text-ink-500">{t.credits}</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
