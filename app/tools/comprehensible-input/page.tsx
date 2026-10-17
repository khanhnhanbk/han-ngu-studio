"use client";

import { useState } from "react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { buildFreqRank } from "@/lib/comprehensible-input/freq";
import { splitHighlight } from "@/lib/comprehensible-input/highlight";
import { isLongSentence, orderSentences, summarize, type OrderedRow } from "@/lib/comprehensible-input/order";
import { toTsv, TSV_FILENAME } from "@/lib/comprehensible-input/tsv";
import { extractWords, parseKnownWords, parseSentences } from "@/lib/comprehensible-input/words";
import { downloadText } from "@/lib/download";
import { getDictionary } from "@/lib/i18n";
import { loadTokenizer, loadWordListLines } from "@/lib/segment/load";

const dict = getDictionary("vi").comprehensibleInput;

type Row = OrderedRow & { line: number };

export default function ComprehensibleInputPage() {
  const [sentences, setSentences] = useState("");
  const [known, setKnown] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [empty, setEmpty] = useState(false);

  async function handleSort() {
    setError(false);
    setEmpty(false);
    const parsed = parseSentences(sentences);
    if (parsed.length === 0) {
      setRows([]);
      setEmpty(true);
      return;
    }
    setLoading(true);
    try {
      const [tokenizer, lines] = await Promise.all([loadTokenizer(), loadWordListLines()]);
      const inputs = parsed.map((s) => ({
        text: s.text,
        words: [...extractWords(tokenizer, s.text)],
      }));
      const ordered = orderSentences(inputs, parseKnownWords(known), buildFreqRank(lines));
      setRows(ordered.map((r) => ({ ...r, line: parsed[r.idx].idx })));
    } catch {
      setRows([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    downloadText(
      toTsv(
        rows.map((r) => ({ idx: r.line, sentence: r.text, newWords: r.newWords, unknownCount: r.newCount })),
      ),
      TSV_FILENAME,
      "text/tab-separated-values",
    );
  }

  const summary = summarize(rows);
  const pct = (n: number) => `${Math.round((n / rows.length) * 100)}%`;
  const stats: [string, string][] = [
    [dict.stats.sentences, String(rows.length)],
    [dict.stats.totalNew, String(summary.totalNewWords)],
    [dict.stats.average, summary.average.toLocaleString("vi-VN", { maximumFractionDigits: 1 })],
    [dict.stats.one, `${summary.one} · ${pct(summary.one)}`],
    [dict.stats.zero, `${summary.zero} · ${pct(summary.zero)}`],
    [dict.stats.many, `${summary.twoPlus} · ${pct(summary.twoPlus)}`],
    [dict.stats.max, String(summary.maxNew)],
    [dict.stats.long, String(summary.longCount)],
  ];

  return (
    <>
      <Navbar />
      <main>
        <section className="section">
          <div className="container-page">
            <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{dict.title}</h1>
            <p className="mt-4 text-lg text-ink-700">{dict.subtitle}</p>

            <div className="card mt-8">
              <label className="block text-sm font-medium text-ink-700" htmlFor="ci-sentences">
                {dict.sentencesLabel}
              </label>
              <textarea
                id="ci-sentences"
                className="hanzi mt-2 w-full resize-y rounded-lg border border-ink-900/10 p-4 text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={8}
                value={sentences}
                placeholder={dict.sentencesPlaceholder}
                onChange={(e) => setSentences(e.target.value)}
              />
              <label className="mt-4 block text-sm font-medium text-ink-700" htmlFor="ci-known">
                {dict.knownLabel}
              </label>
              <textarea
                id="ci-known"
                className="hanzi mt-2 w-full resize-y rounded-lg border border-ink-900/10 p-4 text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={4}
                value={known}
                placeholder={dict.knownPlaceholder}
                onChange={(e) => setKnown(e.target.value)}
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="btn-primary" onClick={handleSort} disabled={loading}>
                  {loading ? dict.loading : dict.button}
                </button>
                {rows.length > 0 && (
                  <button type="button" className="btn-secondary" onClick={handleDownload}>
                    {dict.download}
                  </button>
                )}
              </div>

              {empty && <p className="mt-4 text-sm text-red-600">{dict.empty}</p>}
              {error && <p className="mt-4 text-sm text-red-600">{dict.loadFailed}</p>}

              {rows.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-ink-900">{dict.stats.title}</h2>
                  <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {stats.map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-ink-900/10 bg-ink-50 p-3">
                        <dt className="text-xs text-ink-500">{label}</dt>
                        <dd className="mt-1 text-xl font-semibold text-ink-900">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  {summary.twoPlus > 0 && (
                    <div className="mt-4 rounded-lg border border-brand-500/30 bg-brand-500/10 p-4 text-sm text-ink-700">
                      <p className="font-semibold text-ink-900">{dict.manyNotice.title(summary.twoPlus)}</p>
                      <p className="mt-2">{dict.manyNotice.why}</p>
                      <p className="mt-3 font-semibold text-ink-900">{dict.manyNotice.whatTitle}</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {dict.manyNotice.what.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <ol className="mt-4 space-y-3">
                    {rows.map((r, i) => (
                      <li
                        key={r.idx}
                        className="rounded-lg border border-ink-900/10 bg-ink-50 p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
                          <span className="font-semibold text-ink-700">{i + 1}.</span>
                          <span>{dict.originalLine(r.line + 1)}</span>
                          <span>· {dict.count(r.newCount)}</span>
                          {r.newCount === 0 && (
                            <span
                              className="cursor-help rounded bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-ink-900"
                              title={dict.flagZeroHint}
                            >
                              {dict.flagZero}
                            </span>
                          )}
                          {r.newCount >= 2 && (
                            <span
                              className="cursor-help rounded bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-red-600"
                              title={dict.flagManyHint(r.newCount)}
                            >
                              {dict.flagMany}
                            </span>
                          )}
                          {isLongSentence(r.text) && (
                            <span
                              className="cursor-help rounded bg-ink-900/10 px-2 py-0.5 text-xs font-medium text-ink-700"
                              title={dict.flagLongHint}
                            >
                              {dict.flagLong}
                            </span>
                          )}
                        </div>
                        <p className="hanzi mt-2 text-lg text-ink-900">
                          {splitHighlight(r.text, r.newWords).map((part, k) =>
                            part.highlighted ? (
                              <mark key={k} className="rounded bg-brand-500/30 px-0.5 text-ink-900">
                                {part.text}
                              </mark>
                            ) : (
                              <span key={k}>{part.text}</span>
                            ),
                          )}
                        </p>
                        {r.newWords.length > 0 && (
                          <p className="hanzi mt-2 text-sm text-ink-700">
                            {dict.newWords}: {r.newWords.join(" ")}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
