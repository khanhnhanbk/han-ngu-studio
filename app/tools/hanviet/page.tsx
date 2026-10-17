"use client";

import { useMemo, useState } from "react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { downloadText } from "@/lib/download";
import { loadHanviet } from "@/lib/hanviet/load";
import type { HanvietData } from "@/lib/hanviet/lookup";
import {
  allReadings,
  analyzeText,
  toTsv,
  type HanvietWord,
} from "@/lib/hanviet/sentence";
import { getDictionary } from "@/lib/i18n";
import { loadTokenizer } from "@/lib/segment/load";
import type { Tokenizer } from "@/lib/segment/tokenizer";
import { CheckIcon } from "@/components/icons/check";
import { CopyIcon } from "@/components/icons/copy";
import { DownloadIcon } from "@/components/icons/download";
import { IconButton } from "@/components/icons/trigger";
import { FileInput } from "@/components/FileInput";

const dict = getDictionary("vi");

const SAMPLE = "我喜欢学习中文。\n越南和中国是邻国。";
const MAX_LENGTH = 5000;

type View = "words" | "text" | "tsv";
type HanWord = Extract<HanvietWord, { kind: "han" }>;

const VIEWS: View[] = ["words", "text", "tsv"];

function WordDetails({
  data,
  word,
  onClose,
}: {
  data: HanvietData;
  word: HanWord;
  onClose: () => void;
}) {
  const rows = allReadings(data, word.chars, word.tone3);
  return (
    <div className="mt-4 rounded-lg border border-brand-200 bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <p className="font-semibold text-ink-900">
          {dict.hanviet.details}: <span className="hanzi text-xl">{word.hanzi}</span>{" "}
          <span className="text-brand-600">{word.hanviet}</span>
        </p>
        <button type="button" className="text-sm text-ink-700 hover:text-brand-600" onClick={onClose}>
          {dict.hanviet.close}
        </button>
      </div>
      <table className="mt-3 w-full text-left text-sm">
        <thead className="text-ink-700/70">
          <tr>
            <th className="py-1 pr-4 font-medium" />
            <th className="py-1 pr-4 font-medium">{dict.hanviet.used}</th>
            <th className="py-1 font-medium">{dict.hanviet.allReadings}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-ink-900/5 align-top">
              <td className="hanzi py-2 pr-4 text-2xl">{row.char}</td>
              <td className="py-2 pr-4">
                <span className="text-ink-700/70">{word.pinyin[i]}</span>{" "}
                <span className="font-semibold text-brand-600">
                  {row.used.join(" / ") || "—"}
                </span>
              </td>
              <td className="py-2">
                {row.entries.length === 0 ? (
                  <span className="text-ink-700/70">{dict.hanviet.noReading}</span>
                ) : (
                  <ul className="space-y-0.5">
                    {row.entries.map(([tone3, readings]) => (
                      <li key={tone3}>
                        <span className="text-ink-700/70">
                          {tone3 === "*" ? dict.hanviet.anyPinyin : tone3}:
                        </span>{" "}
                        {readings.join(" / ")}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HanvietPage() {
  const [text, setText] = useState(SAMPLE);
  const [view, setView] = useState<View>("words");
  const [loaded, setLoaded] = useState<{ tokenizer: Tokenizer; data: HanvietData } | null>(null);
  const [submitted, setSubmitted] = useState("");
  const [selected, setSelected] = useState<HanWord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Counted in code points, like the other text tools.
  const length = Array.from(text).length;
  const tooLong = length > MAX_LENGTH;

  const lines = useMemo(
    () => (loaded && submitted ? analyzeText(loaded.tokenizer, loaded.data, submitted) : []),
    [loaded, submitted],
  );
  const plain = useMemo(
    () =>
      lines
        .map((l) => (l.source.trim() ? [l.segmented, l.pinyin, l.hanviet].join("\n") : ""))
        .join("\n\n"),
    [lines],
  );
  const tsv = useMemo(() => toTsv(lines), [lines]);

  async function handleFile(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!/\.txt$/i.test(file.name)) {
      setError(dict.hanviet.badFile);
      return;
    }
    setText(await file.text());
  }

  async function handleConvert() {
    setError("");
    setCopied(false);
    setSelected(null);
    if (!text.trim()) {
      setError(dict.hanviet.error);
      return;
    }
    if (tooLong) {
      setError(dict.hanviet.tooLong);
      return;
    }
    setLoading(true);
    try {
      const [tokenizer, data] = await Promise.all([loadTokenizer(), loadHanviet()]);
      setLoaded({ tokenizer, data });
      setSubmitted(text);
    } catch {
      setError(dict.hanviet.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(view === "tsv" ? tsv : plain);
    setCopied(true);
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="section">
          <div className="container-page">
            <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{dict.hanviet.title}</h1>
            <p className="mt-4 text-lg text-ink-700">{dict.hanviet.subtitle}</p>

            <div className="card mt-8">
              <textarea
                className="hanzi w-full resize-y rounded-lg border border-ink-900/10 p-4 text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={6}
                value={text}
                placeholder={dict.hanviet.placeholder}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="mt-2 flex items-center justify-between text-sm text-ink-700/70">
                <span>
                  {length} / {MAX_LENGTH}
                </span>
                {tooLong && <span className="text-red-600">{dict.hanviet.tooLong}</span>}
              </div>

              <div className="mt-4 grid gap-4 text-sm text-ink-700 sm:grid-cols-3">
                <FileInput label={dict.hanviet.upload} accept=".txt" onFile={handleFile} />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleConvert}
                  disabled={loading}
                >
                  {loading ? dict.hanviet.loading : dict.hanviet.button}
                </button>
              </div>

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              {loaded && lines.length > 0 && (
                <div className="mt-6">
                  <div role="tablist" className="flex flex-wrap gap-2">
                    {VIEWS.map((v) => (
                      <button
                        key={v}
                        type="button"
                        role="tab"
                        aria-selected={view === v}
                        onClick={() => {
                          setView(v);
                          setCopied(false);
                        }}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                          view === v
                            ? "bg-brand-600 text-white"
                            : "bg-ink-50 text-ink-700 hover:bg-ink-900/5"
                        }`}
                      >
                        {dict.hanviet.views[v]}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg border border-ink-900/10 bg-ink-50 p-4">
                    {view === "words" && (
                      <>
                        <p className="mb-3 text-xs text-ink-700/70">{dict.hanviet.wordsHint}</p>
                        {lines.map((line, i) =>
                          line.source.trim() ? (
                            <div key={i} className="mb-4 flex flex-wrap items-end gap-2">
                              {line.words.map((w, j) =>
                                w.kind === "han" ? (
                                  <button
                                    key={j}
                                    type="button"
                                    onClick={() => setSelected(w)}
                                    className={`rounded-lg border px-2 py-1 text-center transition hover:border-brand-500 ${
                                      selected === w
                                        ? "border-brand-500 bg-surface"
                                        : "border-ink-900/10 bg-surface/60"
                                    }`}
                                  >
                                    <span className="block text-xs text-ink-700/70">
                                      {w.pinyin.join(" ")}
                                    </span>
                                    <span className="hanzi block text-2xl text-ink-900">{w.hanzi}</span>
                                    <span className="block text-sm font-medium text-brand-600">
                                      {w.hanviet.replace(/_/g, " ")}
                                    </span>
                                  </button>
                                ) : (
                                  <span key={j} className="hanzi px-1 pb-6 text-2xl text-ink-700">
                                    {w.text}
                                  </span>
                                ),
                              )}
                            </div>
                          ) : null,
                        )}
                        {selected && (
                          <WordDetails
                            data={loaded.data}
                            word={selected}
                            onClose={() => setSelected(null)}
                          />
                        )}
                      </>
                    )}

                    {view === "text" &&
                      lines.map((line, i) =>
                        line.source.trim() ? (
                          <dl key={i} className="mb-4 grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1">
                            <dt className="text-sm text-ink-700/70">{dict.hanviet.rowSegmented}</dt>
                            <dd className="hanzi text-lg">{line.segmented}</dd>
                            <dt className="text-sm text-ink-700/70">{dict.hanviet.rowPinyin}</dt>
                            <dd>{line.pinyin}</dd>
                            <dt className="text-sm text-ink-700/70">{dict.hanviet.rowHanviet}</dt>
                            <dd className="font-medium text-brand-600">{line.hanviet}</dd>
                          </dl>
                        ) : null,
                      )}

                    {view === "tsv" && (
                      <>
                        <pre className="hanzi overflow-x-auto whitespace-pre text-sm">{tsv}</pre>
                        <p className="mt-3 text-xs text-ink-700/70">{dict.hanviet.tsvHint}</p>
                      </>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-ink-700/70">{dict.hanviet.note}</p>

                  {view !== "words" && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <IconButton icon={copied ? CheckIcon : CopyIcon} className="btn-secondary" onClick={handleCopy}>
                        {copied ? dict.hanviet.copied : dict.hanviet.copy}
                      </IconButton>
                      {view === "text" ? (
                        <IconButton
                          icon={DownloadIcon}
                          className="btn-secondary"
                          onClick={() => downloadText(plain, "hanviet.txt")}
                        >
                          {dict.hanviet.downloadTxt}
                        </IconButton>
                      ) : (
                        <IconButton
                          icon={DownloadIcon}
                          className="btn-secondary"
                          onClick={() =>
                            downloadText(tsv, "hanviet.tsv", "text/tab-separated-values")
                          }
                        >
                          {dict.hanviet.downloadTsv}
                        </IconButton>
                      )}
                    </div>
                  )}
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
