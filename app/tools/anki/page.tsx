"use client";

import Link from "next/link";
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
import { APKG_FILES, loadSqlJs } from "@/lib/anki/sqlite";
import { apkgTemplates, type CardTemplateId } from "@/lib/anki/templates";
import { audioFileName, joinRecordings, loadAudioIndex, loadShards, recordingsFor, shardPath } from "@/lib/anki/audio";
import { wordMnemonic } from "@/lib/anki/mnemonic";
import { imageCredit, imageFieldHtml, imageFileName, type ImageCandidate } from "@/lib/anki/images";
import { fetchShrunkJpeg } from "@/lib/anki/shrink";
import { ImagePicker } from "@/components/anki/ImagePicker";
import type { RowExtras } from "@/lib/anki/apkg";
import { loadMnemonics } from "@/lib/decompose/mnemonics";
import { defaultTone3 } from "@/lib/speech/tone";
import { confirmDownload, formatBytes } from "@/lib/data/budget";
import { exampleFiles, loadExamples } from "@/lib/examples/load";
import { downloadBytes, downloadText } from "@/lib/download";
import { HANVIET_FILE, loadHanviet } from "@/lib/hanviet/load";
import { useDictionary, useHref } from "@/lib/i18n/useLocale";
import { parseWordsHash } from "@/lib/reader/handoff";
import { useConverter } from "@/lib/script/useScript";
import { loadTokenizer, TOKENIZER_FILES } from "@/lib/segment/load";
import { loadVocab, VOCAB_FILE } from "@/lib/vocab/load";
import { addWords, HSK_LEVELS, splitParts, wordsOfLevel, type HskLevel } from "@/lib/anki/picker";
import { readKnown } from "@/lib/reader/known";
import { CheckIcon } from "@/components/icons/check";
import { CopyIcon } from "@/components/icons/copy";
import { DownloadIcon } from "@/components/icons/download";
import { IconButton } from "@/components/icons/trigger";
import { FileInput } from "@/components/FileInput";

/** "34 KB" under 1 MB, else "2,4 MB". */
const fileSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : formatBytes(bytes));

const SAMPLE = "大学\n学习\n朋友\n喜欢\n电脑";

// Wider inputs for the long text columns.
const WIDE: ReadonlySet<Column> = new Set(["meaning", "sentence", "sentence_pinyin", "sentence_meaning", "meaning_vi"]);
// Columns holding one line per example when a card has several.
const EXAMPLE_COLUMNS: ReadonlySet<Column> = new Set(["sentence", "sentence_pinyin", "sentence_meaning"]);
// Nghe first: it needs no typing, so it suits a phone.
const CARD_TYPES: readonly CardTemplateId[] = ["listen", "recognize", "recall", "sentence", "type"];

/** A file name from the deck name ("Tiếng Trung::HSK 1" → "Tiếng Trung - HSK 1.apkg"). */
const apkgFileName = (deck: string) =>
  `${deck.replace(/::/g, " - ").replace(/[\\/:*?"<>|\t\r\n]+/g, " ").trim() || "anki_deck"}.apkg`;

export default function AnkiPage() {
  const dict = useDictionary();
  const href = useHref();
  const [text, setText] = useState(SAMPLE);
  // Words sent from another tool (Đọc hiểu) as #words=…; the hash never leaves the device.
  useEffect(() => {
    const words = parseWordsHash(window.location.hash);
    if (words.length) setText(words.join("\n"));
  }, []);
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
  const [deckName, setDeckName] = useState(dict.anki.defaultDeck);
  // Start with the basic cards that need no typing; the guide suggests adding others later.
  const [cardTypes, setCardTypes] = useState<Set<CardTemplateId>>(() => new Set(["listen", "recognize", "recall"]));
  // Human recordings packed into the .apkg (the "Nghe" card needs them).
  const [withAudio, setWithAudio] = useState(true);
  const [apkgStatus, setApkgStatus] = useState("");
  // Pictures chosen in "Ảnh minh họa", by row (cleared when the deck is rebuilt).
  const [picks, setPicks] = useState<Record<number, ImageCandidate>>({});
  const [apkgBusy, setApkgBusy] = useState(false);
  const [apkgError, setApkgError] = useState("");
  // "Thêm từ theo cấp HSK": level, part (levels over MAX_WORDS are split), skip known words.
  const [level, setLevel] = useState<HskLevel>("1");
  const [part, setPart] = useState(0);
  const [levelParts, setLevelParts] = useState<number | null>(null);
  const [skipKnown, setSkipKnown] = useState(true);
  const [pickStatus, setPickStatus] = useState("");
  const [picking, setPicking] = useState(false);

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

  useEffect(() => setPicks({}), [built]);

  /** The level's words (parts only when it has more than MAX_WORDS). vocab.json is about 300 KB. */
  async function levelWords(lvl: HskLevel): Promise<string[][] | null> {
    if (!(await confirmDownload([VOCAB_FILE]))) return null;
    return splitParts(wordsOfLevel(await loadVocab(), lvl));
  }

  async function chooseLevel(lvl: HskLevel) {
    setLevel(lvl);
    setPart(0);
    setPickStatus("");
    setLevelParts(null);
    const parts = await levelWords(lvl).catch(() => null);
    if (parts) setLevelParts(parts.length);
  }

  async function handlePick() {
    setPickStatus("");
    setPicking(true);
    try {
      const parts = await levelWords(level);
      if (!parts) return setPickStatus(dict.download.declined);
      setLevelParts(parts.length);
      const current = simpWords(conv, parseWords(text).words);
      const r = addWords(current, parts[Math.min(part, parts.length - 1)] ?? [], readKnown(), skipKnown);
      setText(r.words.map((w) => conv.toShown(w)).join("\n"));
      const notes = [
        r.known && dict.anki.pickKnown.replace("{n}", String(r.known)),
        r.already && dict.anki.pickAlready.replace("{n}", String(r.already)),
        r.overLimit && dict.anki.pickOverLimit.replace("{n}", String(r.overLimit)).replace("{max}", String(MAX_WORDS)),
      ].filter(Boolean);
      setPickStatus(
        dict.anki.pickDone.replace("{n}", String(r.added)).replace("{level}", level) + (notes.length ? ` (${notes.join(", ")})` : ""),
      );
    } catch {
      setPickStatus(dict.anki.loadFailed);
    } finally {
      setPicking(false);
    }
  }

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
      setBuilt({ rows: buildDeck({ tokenizer, hanviet, meanings, examples, wubi, vocab }, words, exampleCount, dict.vocab.pos), wubi });
      setBuiltCount(exampleCount);
      setDuplicates(parsed.duplicates + parsed.words.length - words.length);
    } catch {
      setError(dict.anki.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  function toggleCardType(id: CardTemplateId) {
    setCardTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  /**
   * Memory stories and recordings for each row (built.rows are Simplified, in
   * the same order as rows). Recordings come from the audio shards, which are
   * fetched only now and only those the words need.
   */
  async function rowExtras(): Promise<{ extras: RowExtras[]; media: Map<string, Uint8Array>; noSound: number; images: number; imagesFailed: number }> {
    const words = (built?.rows ?? []).map((r) => r.word);
    const mnemonics = await loadMnemonics().catch(() => null);
    const labels = { goc: dict.decompose.kinds.goc, draft: dict.decompose.suggestionDraft };
    const extras: RowExtras[] = words.map((w) => ({ mnemonic: wordMnemonic(mnemonics, w, labels) }));
    const media = new Map<string, Uint8Array>();

    // Chosen pictures: one Openverse thumbnail request each, shrunk here.
    let images = 0;
    let imagesFailed = 0;
    for (const [key, choice] of Object.entries(picks)) {
      const i = Number(key);
      if (!extras[i]) continue;
      setApkgStatus(dict.anki.imagesPacking.replace("{n}", String(images + imagesFailed + 1)).replace("{total}", String(Object.keys(picks).length)));
      const bytes = await fetchShrunkJpeg(choice.thumbnail);
      if (!bytes) {
        imagesFailed++;
        continue;
      }
      const file = imageFileName(choice.id);
      media.set(file, bytes);
      extras[i].image = { file, html: imageFieldHtml(file, imageCredit(choice)) };
      images++;
    }
    if (!withAudio || words.length === 0) return { extras, media, noSound: 0, images, imagesFailed };

    const index = await loadAudioIndex(words);
    const plans = words.map((w) => recordingsFor(index, w, defaultTone3(w)));
    const paths = Array.from(new Set(plans.flatMap((p) => (p ?? []).map(shardPath))));
    setApkgStatus(dict.anki.audioLoading.replace("{done}", "0").replace("{total}", String(paths.length)));
    const shards = await loadShards(paths, (done) =>
      setApkgStatus(dict.anki.audioLoading.replace("{done}", String(done)).replace("{total}", String(paths.length))),
    );
    let noSound = 0;
    for (const [i, plan] of plans.entries()) {
      const bytes = plan ? joinRecordings(plan, shards) : null;
      if (!bytes) {
        noSound++;
        continue;
      }
      const name = await audioFileName(words[i]);
      media.set(name, bytes);
      extras[i].audio = name;
    }
    return { extras, media, noSound, images, imagesFailed };
  }

  /** The deck as one .apkg file (note type + templates included); SQLite loads only now. */
  async function handleApkg() {
    setApkgError("");
    setApkgStatus("");
    setApkgBusy(true);
    try {
      if (!(await confirmDownload(APKG_FILES))) return setApkgError(dict.download.declined);
      const [{ buildApkg, cleanDeckName }, SQL] = await Promise.all([import("@/lib/anki/apkg"), loadSqlJs()]);
      const names = Object.fromEntries(CARD_TYPES.map((id) => [id, dict.ankiGuide.templates[id].name])) as Record<
        CardTemplateId,
        string
      >;
      const deck = cleanDeckName(deckName, dict.anki.defaultDeck);
      const { extras, media, noSound, images, imagesFailed } = await rowExtras();
      const bytes = await buildApkg(SQL, rows, {
        deckName: deck,
        templates: apkgTemplates(dict.ankiGuide.cardLabels),
        cardTypes,
        templateNames: names,
        columns,
        extras,
        media,
      });
      downloadBytes(bytes, apkgFileName(deck), "application/apkg");
      setApkgStatus(
        [
          withAudio
            ? dict.anki.audioDone.replace("{n}", String(media.size - images)).replace("{size}", fileSize(bytes.length))
            : dict.anki.apkgDone.replace("{size}", fileSize(bytes.length)),
          noSound && withAudio ? dict.anki.audioMissing.replace("{n}", String(noSound)) : "",
          images ? dict.anki.imagesPacked.replace("{n}", String(images)) : "",
          imagesFailed ? dict.anki.imagesFailed.replace("{n}", String(imagesFailed)) : "",
        ]
          .filter(Boolean)
          .join(" "),
      );
    } catch {
      setApkgError(dict.anki.apkgFailed);
    } finally {
      setApkgBusy(false);
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

              <fieldset className="mt-4 rounded-lg border border-ink-900/10 p-3 text-sm text-ink-700">
                <legend className="px-1 font-medium">{dict.anki.pickTitle}</legend>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1">
                    <span>{dict.anki.pickLevel}</span>
                    <select
                      value={level}
                      onChange={(e) => chooseLevel(e.target.value as HskLevel)}
                      className="rounded-lg border border-ink-900/10 bg-surface px-3 py-2"
                    >
                      {HSK_LEVELS.map((l) => (
                        <option key={l} value={l}>
                          HSK {l}
                        </option>
                      ))}
                    </select>
                  </label>
                  {levelParts !== null && levelParts > 1 && (
                    <label className="flex flex-col gap-1">
                      <span>{dict.anki.pickPart}</span>
                      <select
                        value={part}
                        onChange={(e) => setPart(Number(e.target.value))}
                        className="rounded-lg border border-ink-900/10 bg-surface px-3 py-2"
                      >
                        {Array.from({ length: levelParts }, (_, i) => (
                          <option key={i} value={i}>
                            {dict.anki.pickPartN.replace("{n}", String(i + 1)).replace("{total}", String(levelParts))}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <button type="button" className="btn-secondary px-3 py-2" onClick={handlePick} disabled={picking || !ready}>
                    {picking ? dict.anki.loading : dict.anki.pickButton}
                  </button>
                </div>
                <label className="mt-3 flex items-center gap-2">
                  <input type="checkbox" checked={skipKnown} onChange={(e) => setSkipKnown(e.target.checked)} />
                  {dict.anki.pickSkipKnown}
                </label>
                <p className="mt-2 min-h-5 text-xs text-ink-500" aria-live="polite">
                  {pickStatus || dict.anki.pickHint}
                </p>
              </fieldset>

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
                    <>
                    <ImagePicker
                      rows={rows.map((r) => ({ word: r.word, meaning: r.meaning }))}
                      picks={picks}
                      onPick={(i, choice) =>
                        setPicks((prev) => {
                          const next = { ...prev };
                          if (choice) next[i] = choice;
                          else delete next[i];
                          return next;
                        })
                      }
                    />
                    <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-4">
                      <h2 className="font-semibold text-ink-900">{dict.anki.apkgTitle}</h2>
                      <p className="mt-1 text-sm text-ink-700">{dict.anki.apkgHint}</p>
                      <label className="mt-4 block text-sm font-medium text-ink-700">
                        {dict.anki.deckName}
                        <input
                          value={deckName}
                          onChange={(e) => setDeckName(e.target.value)}
                          className="mt-1 block w-full max-w-sm rounded-lg border border-ink-900/10 bg-surface px-3 py-2 font-normal text-ink-900 focus:border-brand-500 focus:outline-none"
                        />
                        <span className="mt-1 block text-xs font-normal text-ink-500">{dict.anki.deckNameHint}</span>
                      </label>
                      <fieldset className="mt-4 text-sm text-ink-700">
                        <legend className="font-medium">{dict.anki.cardTypes}</legend>
                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                          {CARD_TYPES.map((id) => (
                            <label key={id} className="flex items-center gap-2" title={dict.ankiGuide.templates[id].purpose}>
                              <input type="checkbox" checked={cardTypes.has(id)} onChange={() => toggleCardType(id)} />
                              {dict.ankiGuide.templates[id].name}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                      <label className="mt-4 flex items-start gap-2 text-sm text-ink-700">
                        <input type="checkbox" className="mt-1" checked={withAudio} onChange={(e) => setWithAudio(e.target.checked)} />
                        <span>
                          <span className="font-medium">{dict.anki.audio}</span>
                          <span className="block text-xs text-ink-500">{dict.anki.audioHint}</span>
                        </span>
                      </label>
                      {cardTypes.has("listen") && !withAudio && <p className="mt-2 text-sm text-red-600">{dict.anki.listenNeedsAudio}</p>}
                      {cardTypes.size === 0 && <p className="mt-3 text-sm text-red-600">{dict.anki.noCardTypes}</p>}
                      <div className="mt-4">
                        <IconButton
                          icon={DownloadIcon}
                          className="btn-primary"
                          onClick={handleApkg}
                          disabled={apkgBusy || cardTypes.size === 0}
                        >
                          {apkgBusy ? dict.anki.apkgBuilding : dict.anki.apkg}
                        </IconButton>
                      </div>
                      <p className="mt-2 min-h-5 text-xs text-ink-500" aria-live="polite">
                        {apkgStatus}
                      </p>
                      {apkgError && <p className="mt-3 text-sm text-red-600">{apkgError}</p>}
                    </div>

                    <h2 className="mt-6 text-sm font-semibold text-ink-900">{dict.anki.tsvTitle}</h2>
                    <div className="mt-2 flex flex-wrap gap-3">
                      <IconButton icon={copied ? CheckIcon : CopyIcon} className="btn-secondary" onClick={handleCopy}>
                        {copied ? dict.anki.copied : dict.anki.copy}
                      </IconButton>
                      <IconButton
                        icon={DownloadIcon}
                        className="btn-secondary"
                        onClick={() => downloadText(tsv, "anki_deck.tsv", "text/tab-separated-values")}
                      >
                        {dict.anki.download}
                      </IconButton>
                    </div>
                    </>
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
                    <Link href={href("/tools/anki/huong-dan")} className="mt-2 inline-block font-medium text-brand-ink underline">
                      {dict.anki.guideLink}
                    </Link>
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
