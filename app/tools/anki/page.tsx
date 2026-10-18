"use client";

import { useEffect, useMemo, useState } from "react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import {
  buildDeck,
  COLUMNS,
  EXAMPLE_COUNTS,
  EXAMPLE_SEPARATOR,
  MAX_WORDS,
  missing,
  parseWords,
  toTsv,
  type Column,
  type DeckRow,
  type ExampleCount,
} from "@/lib/anki/buildDeck";
import { loadMeanings, loadWubi, MEANINGS_FILE, WUBI_FILE, type WubiTable } from "@/lib/anki/load";
import { showRow, simpWords } from "@/lib/anki/script";
import { confirmDownload } from "@/lib/data/budget";
import { exampleFiles, loadExamples } from "@/lib/examples/load";
import { downloadText } from "@/lib/download";
import { HANVIET_FILE, loadHanviet } from "@/lib/hanviet/load";
import { getDictionary } from "@/lib/i18n";
import { useConverter } from "@/lib/script/useScript";
import { loadTokenizer, TOKENIZER_FILES } from "@/lib/segment/load";
import { loadVocab, VOCAB_FILE } from "@/lib/vocab/load";
import { CheckIcon } from "@/components/icons/check";
import { CopyIcon } from "@/components/icons/copy";
import { DownloadIcon } from "@/components/icons/download";
import { IconButton } from "@/components/icons/trigger";
import { FileInput } from "@/components/FileInput";

const dict = getDictionary("vi");

const SAMPLE = "大学\n学习\n朋友\n喜欢\n电脑";

// Wider inputs for the long text columns.
const WIDE: ReadonlySet<Column> = new Set(["meaning", "sentence", "sentence_pinyin", "sentence_meaning", "meaning_vi"]);
// Columns holding one line per example when a card has several.
const EXAMPLE_COLUMNS: ReadonlySet<Column> = new Set(["sentence", "sentence_pinyin", "sentence_meaning"]);

export default function AnkiPage() {
  const [text, setText] = useState(SAMPLE);
  const [rows, setRows] = useState<DeckRow[]>([]);
  // The deck as built (Simplified), re-shown when the script switch changes.
  const [built, setBuilt] = useState<{ rows: DeckRow[]; wubi: WubiTable } | null>(null);
  const { conv, ready, failed } = useConverter();
  const [duplicates, setDuplicates] = useState(0);
  const [picked, setPicked] = useState<Set<Column>>(() => new Set(COLUMNS));
  const [header, setHeader] = useState(true);
  const [exampleCount, setExampleCount] = useState<ExampleCount>(1);
  // The count the shown rows were built with: it decides the TSV format.
  const [builtCount, setBuiltCount] = useState<ExampleCount>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const { words } = useMemo(() => parseWords(text), [text]);
  const tooMany = words.length > MAX_WORDS;

  const columns = useMemo(() => COLUMNS.filter((c) => picked.has(c)), [picked]);
  const tsv = useMemo(() => toTsv(rows, columns, header, builtCount > 1), [rows, columns, header, builtCount]);
  const notFound = useMemo(() => missing(rows), [rows]);

  // Edits made in the table are kept until the deck is rebuilt or the
  // script changes (then the cells are shown again from the built deck).
  useEffect(() => {
    if (built) setRows(built.rows.map((r) => showRow(r, conv, built.wubi)));
  }, [built, conv]);

  async function handleFile(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!/\.txt$/i.test(file.name)) {
      setError(dict.anki.badFile);
      return;
    }
    setText(await file.text());
  }

  async function handleBuild() {
    setError("");
    setCopied(false);
    const parsed = parseWords(text);
    if (parsed.words.length === 0) {
      setError(dict.anki.error);
      return;
    }
    if (parsed.words.length > MAX_WORDS) {
      setError(dict.anki.tooMany);
      return;
    }
    setLoading(true);
    try {
      const words = simpWords(conv, parsed.words);
      const files = [...TOKENIZER_FILES, HANVIET_FILE, MEANINGS_FILE, WUBI_FILE, VOCAB_FILE, ...(await exampleFiles(words))];
      if (!(await confirmDownload(files))) return setError(dict.download.declined);
      const [tokenizer, hanviet, meanings, examples, wubi, vocab] = await Promise.all([
        loadTokenizer(),
        loadHanviet(),
        loadMeanings(),
        loadExamples(words),
        loadWubi(),
        loadVocab(),
      ]);
      setBuilt({ rows: buildDeck({ tokenizer, hanviet, meanings, examples, wubi, vocab }, words, exampleCount), wubi });
      setBuiltCount(exampleCount);
      setDuplicates(parsed.duplicates + parsed.words.length - words.length);
    } catch {
      setError(dict.anki.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  function toggleColumn(c: Column) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
    setCopied(false);
  }

  function editCell(index: number, column: Column, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [column]: value } : r)));
    setCopied(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(tsv);
    setCopied(true);
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="section">
          <div className="container-page">
            <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{dict.anki.title}</h1>
            <p className="mt-4 text-lg text-ink-700">{dict.anki.subtitle}</p>

            <div className="card mt-8">
              <textarea
                className="hanzi w-full resize-y rounded-lg border border-ink-900/10 p-4 text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={6}
                value={text}
                placeholder={dict.anki.placeholder}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="mt-2 flex items-center justify-between text-sm text-ink-700/70">
                <span>
                  {dict.anki.wordCount}: {words.length} / {MAX_WORDS}
                </span>
                {tooMany && <span className="text-red-600">{dict.anki.tooMany}</span>}
              </div>

              <div className="mt-4 grid gap-4 text-sm text-ink-700 sm:grid-cols-3">
                <FileInput label={dict.anki.upload} accept=".txt" onFile={handleFile} />
                <label className="flex flex-col gap-1">
                  <span className="font-medium">{dict.anki.exampleCount}</span>
                  <select
                    value={exampleCount}
                    onChange={(e) => setExampleCount(Number(e.target.value) as ExampleCount)}
                    className="rounded-lg border border-ink-900/10 px-3 py-2"
                  >
                    {EXAMPLE_COUNTS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="btn-primary" onClick={handleBuild} disabled={loading || !ready}>
                  {loading ? dict.anki.loading : dict.anki.button}
                </button>
              </div>

              {!ready && !failed && <p className="mt-4 text-sm text-ink-500">{dict.script.loading}</p>}
              {failed && <p className="mt-4 text-sm text-red-600">{dict.script.loadFailed}</p>}

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              {rows.length > 0 && (
                <div className="mt-8">
                  <fieldset className="text-sm text-ink-700">
                    <legend className="font-medium">{dict.anki.columnsLabel}</legend>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                      {COLUMNS.map((c) => (
                        <label key={c} className="flex items-center gap-2">
                          <input type="checkbox" checked={picked.has(c)} onChange={() => toggleColumn(c)} />
                          {dict.anki.columns[c]}
                        </label>
                      ))}
                    </div>
                    <label className="mt-3 flex items-center gap-2">
                      <input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} />
                      {dict.anki.header}
                    </label>
                  </fieldset>

                  <h2 className="mt-6 font-semibold text-ink-900">{dict.anki.preview}</h2>
                  <p className="mt-1 text-xs text-ink-700/70">{dict.anki.editHint}</p>
                  <div className="mt-3 overflow-x-auto rounded-lg border border-ink-900/10">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-ink-50 text-ink-700">
                        <tr>
                          {columns.map((c) => (
                            <th key={c} className="whitespace-nowrap px-2 py-2 font-medium">
                              {dict.anki.columns[c]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={row.word} className="border-t border-ink-900/5">
                            {columns.map((c) => {
                              const cellClass = `rounded border border-transparent bg-transparent px-1 py-1 hover:border-ink-900/10 focus:border-brand-500 focus:outline-none ${
                                WIDE.has(c) ? "w-72" : "w-28"
                              } ${c === "word" || c === "sentence" ? "hanzi" : ""}`;
                              const label = `${row.word} – ${dict.anki.columns[c]}`;
                              return (
                                <td key={c} className="px-1 py-1 align-top">
                                  {builtCount > 1 && EXAMPLE_COLUMNS.has(c) ? (
                                    // One example per line; saved with EXAMPLE_SEPARATOR.
                                    <textarea
                                      value={row[c].split(EXAMPLE_SEPARATOR).join("\n")}
                                      rows={builtCount}
                                      // No wrapping: line n of each column stays example n.
                                      wrap="off"
                                      onChange={(e) => editCell(i, c, e.target.value.replace(/\r?\n/g, EXAMPLE_SEPARATOR))}
                                      aria-label={label}
                                      className={`${cellClass} resize-y`}
                                    />
                                  ) : (
                                    <input value={row[c]} onChange={(e) => editCell(i, c, e.target.value)} aria-label={label} className={cellClass} />
                                  )}
                                  {c === "sentence_meaning" && row.machineTranslated && (
                                    <span className="ml-1 inline-block rounded-full bg-ink-900/5 px-2 py-0.5 text-xs text-ink-700">
                                      {dict.anki.machineTag}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {columns.length === 0 ? (
                    <p className="mt-4 text-sm text-red-600">{dict.anki.noColumns}</p>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <IconButton icon={copied ? CheckIcon : CopyIcon} className="btn-secondary" onClick={handleCopy}>
                        {copied ? dict.anki.copied : dict.anki.copy}
                      </IconButton>
                      <IconButton
                        icon={DownloadIcon}
                        className="btn-primary"
                        onClick={() => downloadText(tsv, "anki_deck.tsv", "text/tab-separated-values")}
                      >
                        {dict.anki.download}
                      </IconButton>
                    </div>
                  )}

                  {(notFound.meaning.length > 0 ||
                    notFound.sentence.length > 0 ||
                    notFound.vocab.length > 0 ||
                    duplicates > 0) && (
                    <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-ink-700">
                      <p className="font-semibold text-ink-900">{dict.anki.missingTitle}</p>
                      {notFound.meaning.length > 0 && (
                        <p className="mt-1">
                          {dict.anki.missingMeaning}: <span className="hanzi">{notFound.meaning.join("、")}</span>
                        </p>
                      )}
                      {notFound.sentence.length > 0 && (
                        <p className="mt-1">
                          {dict.anki.missingSentence}:{" "}
                          <span className="hanzi">{notFound.sentence.join("、")}</span>
                        </p>
                      )}
                      {notFound.vocab.length > 0 && (
                        <p className="mt-1">
                          {dict.anki.missingVocab}: <span className="hanzi">{notFound.vocab.join("、")}</span>
                        </p>
                      )}
                      {duplicates > 0 && (
                        <p className="mt-1">{dict.anki.duplicates.replace("{n}", String(duplicates))}</p>
                      )}
                    </div>
                  )}

                  <div className="mt-6 rounded-lg bg-ink-50 p-4 text-sm text-ink-700">
                    <p className="font-semibold text-ink-900">{dict.anki.importTitle}</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-5">
                      {dict.anki.importSteps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <p className="mt-2">{dict.anki.importMore}</p>
                  </div>
                </div>
              )}

              <p className="mt-6 text-xs text-ink-700/70">{dict.anki.credits}</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
