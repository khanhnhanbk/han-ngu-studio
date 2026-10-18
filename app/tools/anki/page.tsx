"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
import { DEFAULT_DECK_NAME } from "@/lib/anki/apkg";
import { exportApkg, prepareImage, type CardImage } from "@/lib/anki/exportApkg";
import { loadMeanings, loadWubi, MEANINGS_FILE, WUBI_FILE, type WubiTable } from "@/lib/anki/load";
import { showRow, simpWords } from "@/lib/anki/script";
import { confirmDownload } from "@/lib/data/budget";
import { exampleFiles, loadExamples } from "@/lib/examples/load";
import { formatBytes } from "@/lib/data/budget";
import { downloadBlob, downloadText } from "@/lib/download";
import { HANVIET_FILE, loadHanviet } from "@/lib/hanviet/load";
import { getDictionary } from "@/lib/i18n";
import { useConverter } from "@/lib/script/useScript";
import { loadTokenizer, TOKENIZER_FILES } from "@/lib/segment/load";
import { loadVocab, VOCAB_FILE } from "@/lib/vocab/load";
import { CheckIcon } from "@/components/icons/check";
import { CopyIcon } from "@/components/icons/copy";
import { DownloadIcon } from "@/components/icons/download";
import { IconButton } from "@/components/icons/trigger";
import { ImageCell } from "@/components/anki/ImageCell";
import { FileInput } from "@/components/FileInput";

const dict = getDictionary("vi");

const SAMPLE = "大学\n学习\n朋友\n喜欢\n电脑";

// Wider inputs for the long text columns.
const WIDE: ReadonlySet<Column> = new Set(["meaning", "sentence", "sentence_pinyin", "sentence_meaning", "meaning_vi"]);
// Columns holding one line per example when a card has several.
const EXAMPLE_COLUMNS: ReadonlySet<Column> = new Set(["sentence", "sentence_pinyin", "sentence_meaning"]);
// Above this, importing the .apkg on a phone gets slow.
const LARGE_APKG = 50 * 1024 * 1024;

/** A file name for the deck, without characters file systems reject. */
const deckFileName = (name: string) => `${name.replace(/[\\/:*?"<>|]+/g, "_").trim() || "anki_deck"}.apkg`;

export default function AnkiPage() {
  const [text, setText] = useState(SAMPLE);
  const [rows, setRows] = useState<DeckRow[]>([]);
  // The deck as built (Simplified), re-shown when the script switch changes.
  const [built, setBuilt] = useState<{ rows: DeckRow[]; wubi: WubiTable } | null>(null);
  const { conv, ready, failed } = useConverter();
  // Card images, keyed by the word as built (Simplified), so they survive a
  // script switch and a rebuild that keeps the word. Only in the .apkg.
  const [images, setImages] = useState<Map<string, CardImage>>(() => new Map());
  const [imageError, setImageError] = useState("");
  const [deckName, setDeckName] = useState(DEFAULT_DECK_NAME);
  const [apkgBusy, setApkgBusy] = useState(false);
  const [apkgError, setApkgError] = useState("");
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

  const imageKey = (i: number) => built?.rows[i]?.word ?? rows[i]?.word ?? "";
  const cardImages = new Map<number, CardImage>();
  rows.forEach((_, i) => {
    const image = images.get(imageKey(i));
    if (image) cardImages.set(i, image);
  });
  const imageBytes = [...cardImages.values()].reduce((n, img) => n + img.data.length, 0);

  // Free the preview URLs when the page goes away.
  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => () => imagesRef.current.forEach((img) => URL.revokeObjectURL(img.url)), []);

  async function attachImage(i: number, file: File) {
    setImageError("");
    try {
      const image = await prepareImage(file);
      const key = imageKey(i);
      setImages((prev) => {
        const next = new Map(prev);
        const old = next.get(key);
        if (old) URL.revokeObjectURL(old.url);
        next.set(key, image);
        return next;
      });
    } catch {
      setImageError(dict.anki.imageBad);
    }
  }

  function removeImage(i: number) {
    const key = imageKey(i);
    setImages((prev) => {
      const next = new Map(prev);
      const old = next.get(key);
      if (old) URL.revokeObjectURL(old.url);
      next.delete(key);
      return next;
    });
  }

  async function handleApkg() {
    setApkgError("");
    setApkgBusy(true);
    try {
      downloadBlob(await exportApkg(rows, columns, cardImages, deckName), deckFileName(deckName));
    } catch {
      setApkgError(dict.anki.apkgFailed);
    } finally {
      setApkgBusy(false);
    }
  }

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
                          {/* First, so it is visible without scrolling the wide table. */}
                          <th className="whitespace-nowrap px-2 py-2 font-medium">{dict.anki.imageColumn}</th>
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
                            <td className="px-1 py-1 align-top">
                              <ImageCell
                                word={row.word}
                                image={cardImages.get(i)}
                                onImage={(file) => void attachImage(i, file)}
                                onRemove={() => removeImage(i)}
                              />
                            </td>
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

                  <p className="mt-2 text-xs text-ink-700/70">{dict.anki.imageHint}</p>
                  {imageError && <p className="mt-2 text-sm text-red-600">{imageError}</p>}

                  <div className="mt-6 rounded-lg border border-ink-900/10 p-4 text-sm text-ink-700">
                    <p className="font-semibold text-ink-900">{dict.anki.apkgTitle}</p>
                    <p className="mt-1">{dict.anki.apkgHint}</p>
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="font-medium">{dict.anki.deckName}</span>
                        <input
                          value={deckName}
                          onChange={(e) => setDeckName(e.target.value)}
                          className="w-64 max-w-full rounded-lg border border-ink-900/10 px-3 py-2"
                        />
                      </label>
                      <IconButton icon={DownloadIcon} className="btn-primary" onClick={handleApkg} disabled={apkgBusy}>
                        {apkgBusy ? dict.anki.apkgBuilding : dict.anki.apkgButton}
                      </IconButton>
                    </div>
                    {cardImages.size > 0 && (
                      <p className="mt-2 text-xs text-ink-700/70">
                        {dict.anki.apkgImages.replace("{n}", String(cardImages.size))} · {formatBytes(imageBytes)}
                      </p>
                    )}
                    {imageBytes > LARGE_APKG && (
                      <p className="mt-2 text-red-600">{dict.anki.apkgLarge.replace("{size}", formatBytes(imageBytes))}</p>
                    )}
                    {apkgError && <p className="mt-2 text-red-600">{apkgError}</p>}
                  </div>

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
