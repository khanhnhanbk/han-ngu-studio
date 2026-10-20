"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FileInput } from "@/components/FileInput";
import { Footer } from "@/components/Footer";
import { DownloadIcon } from "@/components/icons/download";
import { IconButton } from "@/components/icons/trigger";
import { Navbar } from "@/components/Navbar";
import { LEVEL_STYLE, levelLabel, percent } from "@/components/reader/levels";
import { WordCard, type CardTarget } from "@/components/reader/WordCard";
import { SpeakButton } from "@/components/speech/SpeakButton";
import { SpeechToggle } from "@/components/speech/SpeechToggle";
import { loadMeanings, MEANINGS_FILE } from "@/lib/anki/load";
import { confirmDownload } from "@/lib/data/budget";
import { downloadText } from "@/lib/download";
import { HANVIET_FILE, loadHanviet } from "@/lib/hanviet/load";
import { useDictionary, useHref } from "@/lib/i18n/useLocale";
import { analyzeText, HSK_LEVELS, type HskLevel, type ReaderData, type ReaderLine, type ReaderWord } from "@/lib/reader/analyze";
import { wordsHash } from "@/lib/reader/handoff";
import { knownToTsv, parseKnownTsv, readKnown, today, writeKnown, type KnownWords } from "@/lib/reader/known";
import {
  estimateLevel,
  knownShare,
  outsideShare,
  LEVEL_KEYS,
  levelStats,
  makeIsKnown,
  sortRows,
  wordTable,
  type SortKey,
} from "@/lib/reader/stats";
import { createAligner, type ScriptConverter } from "@/lib/script/convert";
import { useConverter } from "@/lib/script/useScript";
import { loadTokenizer, TOKENIZER_FILES } from "@/lib/segment/load";
import { loadStory, storyIdFromHash, storyText, type Story } from "@/lib/stories/load";
import { loadVocab, VOCAB_FILE } from "@/lib/vocab/load";

const SAMPLE =
  "我叫小明，是越南人。我在河内的一所大学学习中文。每天早上，我先去图书馆看书，然后跟朋友一起吃早饭。周末的时候，我们常常去公园散步，有时候也去看电影。我觉得学习中文很有意思，但是汉字有点儿难。";
const MAX_LENGTH = 5000;

type PinyinMode = "smart" | "always" | "hidden";
const PINYIN_MODES: PinyinMode[] = ["smart", "always", "hidden"];
const SORTS: SortKey[] = ["order", "count", "level"];

/** Reading preferences (not user text), remembered in this browser. */
type Prefs = { level: HskLevel; levelKnown: boolean; pinyin: PinyinMode; color: boolean };
const PREFS_KEY = "hns-reader-prefs";
const DEFAULT_PREFS: Prefs = { level: "3", levelKnown: true, pinyin: "smart", color: true };

function readPrefs(): Prefs {
  try {
    const raw = JSON.parse(window.localStorage.getItem(PREFS_KEY) ?? "{}") as Partial<Prefs>;
    return {
      level: HSK_LEVELS.includes(raw.level as HskLevel) ? (raw.level as HskLevel) : DEFAULT_PREFS.level,
      levelKnown: typeof raw.levelKnown === "boolean" ? raw.levelKnown : DEFAULT_PREFS.levelKnown,
      pinyin: PINYIN_MODES.includes(raw.pinyin as PinyinMode) ? (raw.pinyin as PinyinMode) : DEFAULT_PREFS.pinyin,
      color: typeof raw.color === "boolean" ? raw.color : DEFAULT_PREFS.color,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** Each token's text in the chosen script (lines line up code point by code point). */
function shownTexts(lines: ReaderLine[], conv: ScriptConverter, submitted: string): string[][] {
  if (conv.script === "simp") return lines.map((l) => l.map((t) => t.text));
  const simp = conv.toSimp(submitted).split("\n");
  const shown = conv.toShown(submitted).split("\n");
  return lines.map((line, i) => {
    const take = createAligner((simp[i] ?? "").replace(/\r$/, ""), (shown[i] ?? "").replace(/\r$/, ""));
    return line.map((t) => take(t.text));
  });
}

const fill = (s: string, values: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k] ?? ""));

export default function ReaderPage() {
  const dict = useDictionary();
  const t = dict.reader;
  const href = useHref();
  const { conv, ready, failed } = useConverter();

  const [text, setText] = useState(SAMPLE);
  const [submitted, setSubmitted] = useState("");
  const [data, setData] = useState<ReaderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [known, setKnown] = useState<KnownWords>({});
  const [knownSaved, setKnownSaved] = useState(true);
  const [knownMsg, setKnownMsg] = useState("");
  const [list, setList] = useState<string[]>([]);
  const [card, setCard] = useState<CardTarget | null>(null);
  const [filterNew, setFilterNew] = useState(false);
  const [sort, setSort] = useState<SortKey>("order");
  // A story from the library (#story=<id>): shown while its text is the one read.
  const [story, setStory] = useState<Story | null>(null);
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(new Set());
  const resultRef = useRef<HTMLDivElement>(null);

  // Preferences and known words live in this browser only.
  useEffect(() => {
    setPrefs(readPrefs());
    setKnown(readKnown());
  }, []);

  function updatePrefs(next: Partial<Prefs>) {
    setPrefs((p) => {
      const value = { ...p, ...next };
      try {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(value));
      } catch {
        // Not saved; applies for this visit.
      }
      return value;
    });
  }

  function saveKnown(next: KnownWords) {
    setKnown(next);
    setKnownSaved(writeKnown(next));
  }

  const length = Array.from(text).length;
  const tooLong = length > MAX_LENGTH;

  const lines = useMemo(() => (data && submitted ? analyzeText(data, conv.toSimp(submitted)) : []), [data, submitted, conv]);
  const shown = useMemo(() => shownTexts(lines, conv, submitted), [lines, conv, submitted]);
  const knownSet = useMemo(() => new Set(Object.keys(known)), [known]);
  const isKnown = useMemo(() => makeIsKnown(knownSet, prefs.level, prefs.levelKnown), [knownSet, prefs.level, prefs.levelKnown]);
  const stats = useMemo(() => levelStats(lines), [lines]);
  const estimate = useMemo(() => estimateLevel(stats), [stats]);
  const share = useMemo(() => knownShare(lines, isKnown), [lines, isKnown]);
  const rows = useMemo(() => wordTable(lines), [lines]);
  // Shown form of each analysed (Simplified) word, for the table, list and hand-off.
  const shownOf = useMemo(() => {
    const map = new Map<string, string>();
    lines.forEach((line, i) => line.forEach((tok, j) => tok.kind === "word" && !map.has(tok.text) && map.set(tok.text, shown[i]?.[j] ?? tok.text)));
    return map;
  }, [lines, shown]);
  const show = useCallback((w: string) => shownOf.get(w) ?? w, [shownOf]);
  const counts = useMemo(() => new Map(rows.map((r) => [r.text, r.count])), [rows]);
  const byText = useMemo(() => new Map(rows.map((r) => [r.text, r])), [rows]);
  const tableRows = useMemo(
    () => sortRows(filterNew ? rows.filter((r) => !isKnown(r)) : rows, sort),
    [rows, filterNew, sort, isKnown],
  );

  async function handleFile(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!/\.txt$/i.test(file.name)) return setError(t.badFile);
    setText(await file.text());
  }

  async function handleRead(source: string = text) {
    setError("");
    setCard(null);
    if (!source.trim()) return setError(t.error);
    if (Array.from(source).length > MAX_LENGTH) return setError(t.tooLong);
    setLoading(true);
    try {
      if (!data) {
        if (!(await confirmDownload([...TOKENIZER_FILES, HANVIET_FILE, VOCAB_FILE, MEANINGS_FILE]))) {
          return setError(dict.download.declined);
        }
        const [tokenizer, hanviet, vocab, meanings] = await Promise.all([
          loadTokenizer(),
          loadHanviet(),
          loadVocab(),
          loadMeanings(),
        ]);
        setData({ tokenizer, hanviet, vocab, meanings });
      }
      setSubmitted(source);
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      setError(t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  // Open a story from the library: fill the text and read it at once.
  useEffect(() => {
    const id = storyIdFromHash(window.location.hash);
    if (!id) return;
    loadStory(id)
      .then((s) => {
        const source = storyText(s);
        setStory(s);
        setRevealed(new Set());
        setText(source);
        void handleRead(source);
      })
      .catch(() => setError(dict.stories.storyFailed));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on arrival
  }, []);

  const storyActive = story !== null && submitted === storyText(story);
  const allRevealed = storyActive && revealed.size === story.sentences.length;
  const toggleLine = (i: number) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const closeCard = useCallback(() => setCard(null), []);

  function openCard(word: ReaderWord, shownText: string, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    setCard({ word, shown: shownText, count: counts.get(word.text) ?? 1, rect: { top: r.top, bottom: r.bottom, left: r.left } });
  }

  function toggleKnown(w: string) {
    const next = { ...known };
    if (next[w]) delete next[w];
    else next[w] = today();
    saveKnown(next);
  }

  const addToList = (words: string[]) => setList((prev) => [...prev, ...words.filter((w) => !prev.includes(w))]);
  const newWords = sortRows(rows.filter((r) => !isKnown(r)), "count").map((r) => r.text);
  const listShown = list.map(show);

  function downloadList() {
    const header = ["word", "pinyin", "hanviet", "hsk_level", "meaning_vi", "meaning_en"].join("\t");
    const body = list.map((w) => {
      const r = byText.get(w);
      return [show(w), r?.pinyin ?? "", r?.hanviet ?? "", r?.level ? `HSK ${r.level}` : "", r?.meaningVi ?? "", r?.meaningEn ?? ""]
        .map((s) => s.replace(/[\t\r\n]+/g, " "))
        .join("\t");
    });
    downloadText([header, ...body].join("\n") + "\n", "reader_words.tsv", "text/tab-separated-values");
  }

  async function importKnown(file: File | undefined) {
    setKnownMsg("");
    if (!file) return;
    const imported = parseKnownTsv(await file.text());
    const n = Object.keys(imported).length;
    if (n === 0) return setKnownMsg(t.knownImportEmpty);
    // Stored by Simplified form, like the words the reader analyses.
    const next = { ...known };
    for (const [w, d] of Object.entries(imported)) next[conv.toSimp(w)] ??= d;
    saveKnown(next);
    setKnownMsg(fill(t.knownImported, { n }));
  }

  function clearKnown() {
    const n = Object.keys(known).length;
    if (n === 0 || !window.confirm(fill(t.knownClearConfirm, { n }))) return;
    saveKnown({});
  }

  const toggle = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition ${
      active ? "bg-surface text-ink-900 shadow-sm" : "text-ink-700 hover:text-ink-900"
    }`;
  const knownCount = Object.keys(known).length;

  return (
    <>
      <Navbar />
      <main>
        <section className="section">
          <div className="container-page">
            <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{t.title}</h1>
            <p className="mt-4 text-lg text-ink-700">{t.subtitle}</p>
            <SpeechToggle prominent className="mt-5" />

            <div className="card mt-8">
              <textarea
                className="hanzi w-full resize-y rounded-lg border border-ink-900/10 p-4 text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={6}
                value={text}
                placeholder={t.placeholder}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="mt-2 flex items-center justify-between text-sm text-ink-500">
                <span>
                  {length} / {MAX_LENGTH}
                </span>
                {tooLong && <span className="text-red-600">{t.tooLong}</span>}
              </div>

              <div className="mt-4 grid gap-4 text-sm text-ink-700 sm:grid-cols-2 lg:grid-cols-4">
                <FileInput label={t.upload} accept=".txt" onFile={handleFile} />
                <label className="flex flex-col gap-1">
                  <span className="font-medium">{t.myLevel}</span>
                  <select
                    value={prefs.level}
                    onChange={(e) => updatePrefs({ level: e.target.value as HskLevel })}
                    className="rounded-lg border border-ink-900/10 px-3 py-2"
                  >
                    {HSK_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        HSK {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="font-medium">{t.pinyinMode}</span>
                  <select
                    value={prefs.pinyin}
                    onChange={(e) => updatePrefs({ pinyin: e.target.value as PinyinMode })}
                    className="rounded-lg border border-ink-900/10 px-3 py-2"
                  >
                    {PINYIN_MODES.map((m) => (
                      <option key={m} value={m}>
                        {t.pinyinModes[m]}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-col justify-end gap-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={prefs.levelKnown} onChange={(e) => updatePrefs({ levelKnown: e.target.checked })} />
                    {t.levelKnown}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={prefs.color} onChange={(e) => updatePrefs({ color: e.target.checked })} />
                    {t.colorLevels}
                  </label>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="btn-primary" onClick={() => handleRead()} disabled={loading || !ready}>
                  {loading ? t.loading : t.button}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setText(SAMPLE)}>
                  {t.sample}
                </button>
              </div>
              {!ready && !failed && <p className="mt-4 text-sm text-ink-500">{dict.script.loading}</p>}
              {failed && <p className="mt-4 text-sm text-red-600">{dict.script.loadFailed}</p>}
              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            </div>

            {lines.length > 0 && (
              <div ref={resultRef} className="scroll-mt-24">
                {storyActive && (
                  <div className="card mt-6 border-brand-200 bg-brand-50">
                    <a href={href("/tools/stories")} className="text-sm text-ink-700 hover:text-brand-ink">
                      {dict.stories.back}
                    </a>
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-brand-ink">
                      {fill(dict.stories.level, { level: story.level })} · {story.topic}
                    </p>
                    <h2 className="hanzi mt-1 text-2xl text-ink-900">{conv.toShown(story.title)}</h2>
                    <p className="text-ink-700">{story.titleVi}</p>
                    {story.status === "draft" && (
                      <span className="mt-2 inline-block rounded-full bg-ink-900/5 px-2 py-0.5 text-xs text-ink-700">
                        {dict.stories.draft}
                      </span>
                    )}
                    <p className="mt-4 text-sm font-medium text-ink-700">{dict.stories.newWords}</p>
                    <p className="hanzi mt-1 text-lg text-ink-900">{story.newWords.map((w) => conv.toShown(w)).join("、")}</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button type="button" className="btn-secondary px-3 py-1.5 text-sm" onClick={() => addToList(story.newWords)}>
                        {dict.stories.addNewWords}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary px-3 py-1.5 text-sm"
                        onClick={() => setRevealed(allRevealed ? new Set() : new Set(story.sentences.map((_, i) => i)))}
                      >
                        {allRevealed ? dict.stories.hideAll : dict.stories.showAll}
                      </button>
                    </div>
                  </div>
                )}

                {/* The text, word by word */}
                <div className="card mt-6">
                  <p className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-500">
                    <span>{t.legend}</span>
                    <SpeechToggle />
                  </p>
                  <div className="hanzi mt-4 text-2xl leading-[2.4] text-ink-900">
                    {lines.map((line, i) => (
                      <Fragment key={i}>
                      <p className="min-h-[1em]">
                        {line.map((tok, j) => {
                          const label = shown[i]?.[j] ?? tok.text;
                          if (tok.kind === "other") return <span key={j}>{label}</span>;
                          const isNew = !isKnown(tok);
                          const withPinyin = prefs.pinyin === "always" || (prefs.pinyin === "smart" && isNew);
                          const level = tok.level ?? "none";
                          return (
                            <button
                              key={j}
                              type="button"
                              onClick={(e) => openCard(tok, label, e.currentTarget)}
                              aria-label={`${label}, ${tok.pinyin}, ${levelLabel(level, t.levelNone)}`}
                              className={`rounded px-0.5 align-baseline underline-offset-[6px] transition hover:bg-brand-500/20 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                                prefs.color ? `underline decoration-2 ${LEVEL_STYLE[level].underline}` : ""
                              } ${isNew ? "bg-brand-500/15" : ""}`}
                            >
                              {withPinyin ? (
                                <ruby>
                                  {label}
                                  <rt className="font-sans text-xs text-brand-ink">{tok.pinyin}</rt>
                                </ruby>
                              ) : (
                                label
                              )}
                            </button>
                          );
                        })}
                      </p>
                      {storyActive && story.sentences[i] && (
                        <div className="mb-3 font-sans text-sm leading-normal">
                          <button
                            type="button"
                            className="text-brand-ink underline decoration-dotted underline-offset-2"
                            aria-expanded={revealed.has(i)}
                            onClick={() => toggleLine(i)}
                          >
                            {revealed.has(i) ? dict.stories.hideTranslation : dict.stories.showTranslation}
                          </button>
                          {revealed.has(i) && <p className="mt-1 text-base text-ink-700">{story.sentences[i][1]}</p>}
                        </div>
                      )}
                      </Fragment>
                    ))}
                  </div>
                </div>

                {storyActive && (
                  <div className="card mt-6">
                    <h2 className="text-xl font-semibold text-ink-900">{dict.stories.culture}</h2>
                    <p className="mt-2 text-ink-700">{story.culture}</p>
                    <p className="mt-3 text-xs text-ink-500">{dict.stories.note}</p>
                  </div>
                )}

                {/* Difficulty */}
                <div className="card mt-6">
                  <h2 className="text-xl font-semibold text-ink-900">{t.summaryTitle}</h2>
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                    <p className="text-2xl font-bold text-brand-ink">
                      {estimate === "beyond" ? t.estimateBeyond : estimate ? fill(t.estimate, { level: `HSK ${estimate}` }) : "—"}
                    </p>
                    <p className="text-lg font-semibold text-ink-900">{fill(t.knownShare, { pct: percent(share) })}</p>
                    <p className="text-sm text-ink-500">
                      {fill(t.totals, { tokens: stats.totalTokens, distinct: stats.totalDistinct })}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">{t.estimateHelp}</p>
                  {stats.tokens.none > 0 && (
                    <p className="mt-1 text-xs text-ink-500">{fill(t.outside, { pct: percent(outsideShare(stats)) })}</p>
                  )}
                  <ul className="mt-4 space-y-1.5">
                    {LEVEL_KEYS.map((k) => {
                      const s = stats.totalTokens ? stats.tokens[k] / stats.totalTokens : 0;
                      return (
                        <li key={k} className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3 text-sm">
                          <span className="text-ink-700">{levelLabel(k, t.levelNone)}</span>
                          <span className="h-3 overflow-hidden rounded-full bg-ink-50">
                            <span className={`block h-full rounded-full ${LEVEL_STYLE[k].bg}`} style={{ width: `${s * 100}%` }} />
                          </span>
                          <span className="text-right tabular-nums text-ink-700">{percent(s)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Word table */}
                <div className="card mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-ink-900">{t.tableTitle}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div role="group" className="inline-flex gap-1 rounded-lg bg-ink-50 p-1">
                        <button type="button" aria-pressed={!filterNew} className={toggle(!filterNew)} onClick={() => setFilterNew(false)}>
                          {t.filterAll} ({rows.length})
                        </button>
                        <button type="button" aria-pressed={filterNew} className={toggle(filterNew)} onClick={() => setFilterNew(true)}>
                          {t.filterNew} ({newWords.length})
                        </button>
                      </div>
                      {/* The options say what they sort by; the name stays for screen readers. */}
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as SortKey)}
                        aria-label={t.sortLabel}
                        className="rounded-lg border border-ink-900/10 px-2 py-1.5 text-ink-700"
                      >
                        {SORTS.map((s) => (
                          <option key={s} value={s}>
                            {t.sorts[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {tableRows.length === 0 ? (
                    <p className="mt-4 text-sm text-ink-700">{t.noNewWords}</p>
                  ) : (
                    <div className="mt-4 max-h-[28rem] overflow-auto rounded-lg border border-ink-900/10">
                      <table className="min-w-full text-left text-sm">
                        <thead className="sticky top-0 bg-ink-50 text-ink-700">
                          <tr>
                            {(["word", "pinyin", "hanviet", "level", "meaning", "count", "known"] as const).map((c) => (
                              <th key={c} className="whitespace-nowrap px-3 py-2 font-medium">
                                {t.columns[c]}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableRows.map((r) => {
                            const level = r.level ?? "none";
                            return (
                              <tr key={r.text} className="border-t border-ink-900/5 align-top">
                                <td className="whitespace-nowrap px-2 py-1.5">
                                  <span className="flex items-center gap-1">
                                    <span className="hanzi text-lg text-ink-900">{show(r.text)}</span>
                                    <SpeakButton word={r.text} label={show(r.text)} tone3={r.tone3} contextual size={16} />
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-brand-ink">{r.pinyin}</td>
                                <td className="whitespace-nowrap px-3 py-2">{r.hanviet}</td>
                                <td className="whitespace-nowrap px-3 py-2">
                                  <span className="inline-flex items-center gap-1.5">
                                    <span className={`h-2 w-2 rounded-full ${LEVEL_STYLE[level].bg}`} aria-hidden />
                                    {levelLabel(level, t.levelNone)}
                                  </span>
                                </td>
                                <td className="min-w-48 px-3 py-2 text-ink-700">{r.meaningVi || r.meaningEn}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{r.count}</td>
                                <td className="px-3 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isKnown(r)}
                                    disabled={!knownSet.has(r.text) && isKnown(r)}
                                    onChange={() => toggleKnown(r.text)}
                                    aria-label={`${t.columns.known}: ${show(r.text)}`}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {newWords.length > 0 && (
                    <button type="button" className="btn-secondary mt-4" onClick={() => addToList(newWords)}>
                      {t.addNew} ({newWords.length})
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* Study list (this visit only) */}
              <div className="card">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-xl font-semibold text-ink-900">{t.listTitle}</h2>
                  <span className="text-sm text-ink-500">{fill(t.listCount, { n: list.length })}</span>
                </div>
                {list.length === 0 ? (
                  <p className="mt-3 text-sm text-ink-700">{t.listEmpty}</p>
                ) : (
                  <>
                    <p className="hanzi mt-3 text-xl leading-relaxed text-ink-900">
                      {listShown.map((w, i) => (
                        <Fragment key={w}>
                          {i > 0 && <span className="text-ink-500">、</span>}
                          {w}
                        </Fragment>
                      ))}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a className="btn-primary px-3 py-2 text-sm" href={href(`/tools/anki${wordsHash(listShown)}`)}>
                        {t.toAnki}
                      </a>
                      <a className="btn-secondary px-3 py-2 text-sm" href={href(`/tools/quiz${wordsHash(listShown)}`)}>
                        {t.toQuiz}
                      </a>
                      <a
                        className="btn-secondary px-3 py-2 text-sm"
                        href={href(`/tools/practice-sheet#${new URLSearchParams({ chars: listShown.join(""), strokes: "1" })}`)}
                      >
                        {t.toSheet}
                      </a>
                      <IconButton icon={DownloadIcon} className="btn-secondary px-3 py-2 text-sm" onClick={downloadList}>
                        {t.downloadTsv}
                      </IconButton>
                      <button type="button" className="px-3 py-2 text-sm text-ink-500 hover:text-red-600" onClick={() => setList([])}>
                        {t.clearList}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Known words (this browser only) */}
              <div className="card">
                <h2 className="text-xl font-semibold text-ink-900">{t.knownTitle}</h2>
                <p className="mt-1 text-sm text-ink-700">{fill(t.knownCount, { n: knownCount })}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                  <IconButton
                    icon={DownloadIcon}
                    className="btn-secondary px-3 py-2 text-sm"
                    disabled={knownCount === 0}
                    onClick={() => downloadText(knownToTsv(known), "known_words.tsv", "text/tab-separated-values")}
                  >
                    {t.knownExport}
                  </IconButton>
                  <FileInput buttonLabel={t.knownImport} accept=".tsv,.txt" onFile={importKnown} showName={false} />
                  <button
                    type="button"
                    className="btn-secondary px-3 py-2 text-sm text-red-600"
                    disabled={knownCount === 0}
                    onClick={clearKnown}
                  >
                    {t.knownClear}
                  </button>
                </div>
                {knownMsg && <p className="mt-2 text-sm text-ink-700">{knownMsg}</p>}
                {!knownSaved && <p className="mt-2 text-sm text-red-600">{t.knownUnsaved}</p>}
                <p className="mt-3 text-xs text-ink-500">{t.knownPrivacy}</p>
              </div>
            </div>

            <p className="mt-6 text-xs text-ink-500">
              {t.credits} {dict.speech.credit}
            </p>
          </div>
        </section>
      </main>
      {card && (
        <WordCard
          target={card}
          known={knownSet.has(card.word.text) ? "list" : isKnown(card.word) ? "level" : null}
          myLevel={`HSK ${prefs.level}`}
          inList={list.includes(card.word.text)}
          onToggleKnown={() => toggleKnown(card.word.text)}
          onAdd={() => addToList([card.word.text])}
          onClose={closeCard}
        />
      )}
      <Footer />
    </>
  );
}
