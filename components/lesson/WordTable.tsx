"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CheckIcon } from "@/components/icons/check";
import { CopyIcon } from "@/components/icons/copy";
import { DownloadIcon } from "@/components/icons/download";
import { PrinterIcon } from "@/components/icons/printer";
import { IconButton } from "@/components/icons/trigger";
import { loadMeanings, loadWubi, MEANINGS_FILE, WUBI_FILE } from "@/lib/anki/load";
import { showRow, simpWords } from "@/lib/anki/script";
import { confirmDownload } from "@/lib/data/budget";
import { prefetcher } from "@/lib/data/prefetch";
import { downloadText } from "@/lib/download";
import { HANVIET_FILE, loadHanviet } from "@/lib/hanviet/load";
import { useDictionary } from "@/lib/i18n/useLocale";
import { parseEntries, type WordEntry } from "@/lib/lesson/paste";
import { SAMPLE_ROWS, SAMPLE_WORDS } from "@/lib/lesson/sample";
import { tableCsv, tableHtml, tableQuizlet, tableRow, tableText, tableTsv, type TableRow } from "@/lib/lesson/table";
import { ensurePrintFonts } from "@/lib/quiz/printFonts";
import { readScript } from "@/lib/script/preference";
import { useConverter } from "@/lib/script/useScript";
import { loadTokenizer, TOKENIZER_FILES } from "@/lib/segment/load";
import { loadVocab, VOCAB_FILE } from "@/lib/vocab/load";

type CopyKind = "docs" | "sheets" | "zalo" | "quizlet";

/** What building the table downloads. */
const TABLE_FILES = [...TOKENIZER_FILES, HANVIET_FILE, MEANINGS_FILE, WUBI_FILE, VOCAB_FILE];
const loadTable = () =>
  Promise.all([
    // Loaded with the data: the deck code pulls in pinyin-pro, not needed for the sample.
    import("@/lib/anki/buildDeck"),
    loadTokenizer(),
    loadHanviet(),
    loadMeanings(),
    loadWubi(),
    loadVocab(),
  ]);
/** For the lesson's inputs: the teacher is about to paste or type words (lib/data/prefetch.ts). */
export const prefetchTable = prefetcher(TABLE_FILES, loadTable);

/** Same form as `key` below, for the sample lesson's words. */
const entriesKey = (entries: readonly WordEntry[]) => entries.map((e) => `${e.word}\t${e.pinyin}\t${e.meaning}`).join("\n");
const SAMPLE_KEY = entriesKey(parseEntries(SAMPLE_WORDS).entries);

const COLS = ["word", "pinyin", "hanviet", "meaning", "hsk"] as const;

/** A file name from the lesson name ("Bài 5: 你好" → "Bài 5 你好.csv"). */
const fileName = (name: string, ext: string) => `${name.replace(/[\\/:*?"<>|\t\r\n]+/g, " ").trim() || "bang-tu"}.${ext}`;

/**
 * The lesson's word table: looked up once (same data as the Anki deck, no
 * example sentences), editable, then copied out for Word / Google Docs,
 * Sheets / Excel, Zalo, Quizlet, saved as CSV or printed. Nothing is sent
 * anywhere; copying goes through the device's clipboard.
 */
export function WordTable({
  words,
  entries,
  lessonName,
}: {
  words: readonly string[];
  /** The teacher's own Pinyin / meaning per word (lib/lesson/paste.ts); they win over the dictionary. */
  entries: readonly WordEntry[];
  lessonName: string;
}) {
  const dict = useDictionary();
  const t = dict.lesson.table;
  const { conv } = useConverter();
  const key = entriesKey(entries);
  // The untouched sample lesson's table ships with the page (lib/lesson/sample.ts),
  // so it is in the first render too and the page does not jump when it appears.
  const isSample = key === SAMPLE_KEY;
  const [rows, setRows] = useState<TableRow[]>(() => (isSample ? [...SAMPLE_ROWS] : []));
  // The words the shown table was built from (to tell when it is stale).
  const [builtFrom, setBuiltFrom] = useState<string | null>(isSample ? key : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<CopyKind | null>(null);
  const stale = builtFrom !== null && builtFrom !== key;

  // Keyed by the Simplified form, like the deck rows.
  const own = useMemo(() => new Map(entries.map((e) => [conv.toSimp(e.word), e])), [entries, conv]);

  const build = useCallback(async () => {
    setError("");
    setCopied(null);
    if (words.length === 0) return setError(dict.lesson.noWords);
    setLoading(true);
    try {
      const simp = simpWords(conv, [...words]);
      if (!(await confirmDownload(TABLE_FILES))) return setError(dict.download.declined);
      const [{ buildDeck }, tokenizer, hanviet, meanings, wubi, vocab] = await loadTable();
      // No example sentences in the table, so no example shards are fetched.
      const deck = buildDeck({ tokenizer, hanviet, meanings, examples: {}, wubi, vocab }, simp, 1, dict.vocab.pos);
      setRows(deck.map((d) => tableRow(showRow(d, conv, wubi), own.get(d.word))));
      setBuiltFrom(key);
    } catch {
      setError(dict.lesson.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [words, own, key, conv, dict]);

  // Build once when the tab opens; later changes wait for the button so edits are not lost.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || words.length === 0) return;
    started.current = true;
    if (isSample) {
      // Already shown, in Giản thể. readScript(): on the first render the hook
      // still reports the default script.
      if (readScript() === "simp") return;
      setRows([]);
      setBuiltFrom(null);
    }
    void build();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the tab opens
  }, [build, words.length]);

  const headers = useMemo(() => t.headers, [t]);

  async function copy(kind: CopyKind) {
    setError("");
    try {
      if (kind === "docs") {
        const html = tableHtml(rows, headers, lessonName);
        const plain = tableText(rows, lessonName);
        if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
          await navigator.clipboard.write([
            new ClipboardItem({
              "text/html": new Blob([html], { type: "text/html" }),
              "text/plain": new Blob([plain], { type: "text/plain" }),
            }),
          ]);
        } else {
          await navigator.clipboard.writeText(plain);
        }
      } else {
        const text =
          kind === "sheets" ? tableTsv(rows, headers) : kind === "zalo" ? tableText(rows, lessonName) : tableQuizlet(rows);
        await navigator.clipboard.writeText(text);
      }
      setCopied(kind);
    } catch {
      setError(t.copyFailed);
    }
  }

  async function print() {
    await ensurePrintFonts(lessonName + rows.map((r) => COLS.map((c) => r[c]).join("")).join(""));
    await document.fonts.ready;
    window.print();
  }

  function edit(i: number, col: (typeof COLS)[number], value: string) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, [col]: value } : r)));
    setCopied(null);
  }

  const copyButtons: Array<[CopyKind, string]> = [
    ["docs", t.copyDocs],
    ["sheets", t.copySheets],
    ["zalo", t.copyZalo],
    ["quizlet", t.copyQuizlet],
  ];

  return (
    <div>
      <div className="print:hidden">
        <p className="text-ink-700">{t.intro}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {copyButtons.map(([kind, label]) => (
            <IconButton
              key={kind}
              icon={copied === kind ? CheckIcon : CopyIcon}
              className="btn-secondary px-3 py-2 text-sm"
              disabled={rows.length === 0 || loading}
              onClick={() => void copy(kind)}
            >
              {copied === kind ? t.copied : label}
            </IconButton>
          ))}
          <IconButton
            icon={DownloadIcon}
            className="btn-secondary px-3 py-2 text-sm"
            disabled={rows.length === 0 || loading}
            onClick={() => downloadText(tableCsv(rows, headers), fileName(lessonName, "csv"), "text/csv")}
          >
            {t.csv}
          </IconButton>
          <IconButton
            icon={PrinterIcon}
            className="btn-primary px-3 py-2 text-sm"
            disabled={rows.length === 0 || loading}
            onClick={() => void print()}
          >
            {t.print}
          </IconButton>
        </div>
        {copied === "quizlet" && <p className="mt-2 text-sm text-ink-700">{t.quizletHint}</p>}
        {stale && (
          <p className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-brand-50 p-3 text-sm text-ink-900">
            {t.stale}
            <button type="button" className="btn-secondary px-3 py-1 text-sm" onClick={() => void build()} disabled={loading}>
              {t.build}
            </button>
          </p>
        )}
        {loading && <p className="mt-3 text-sm text-ink-700">{t.building}</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {rows.length > 0 && (
        <div className="mt-4 overflow-x-auto print:hidden">
          <table className="w-full min-w-[44rem] table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col className="w-12" />
              <col className="w-28" />
              <col className="w-36" />
              <col className="w-36" />
              <col />
              <col className="w-20" />
            </colgroup>
            <thead>
              <tr className="border-b border-ink-900/20">
                <th className="px-2 py-2 font-semibold text-ink-700">{headers.no}</th>
                {COLS.map((c) => (
                  <th key={c} className="px-2 py-2 font-semibold text-ink-700">
                    {headers[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-ink-900/10 align-middle">
                  <td className="px-2 py-1 text-ink-500">{i + 1}</td>
                  {COLS.map((c) => (
                    <td key={c} className="px-1 py-1">
                      <input
                        aria-label={`${headers[c]} ${i + 1}`}
                        className={`w-full rounded border border-transparent bg-transparent px-1 py-1 hover:border-ink-900/10 focus:border-brand-500 focus:outline-none ${
                          c === "word" ? "hanzi text-xl" : ""
                        }`}
                        value={r[c]}
                        onChange={(e) => edit(i, c, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* The printed word sheet: its own layout, A4 with margins (globals.css "wordlist"). */}
      {rows.length > 0 && (
        <div className="wordlist-print hidden text-ink-900 print:block">
          <h1 className="text-2xl font-bold">{lessonName}</h1>
          <p className="mb-4 mt-1 text-sm text-ink-500">{t.printSubtitle.replace("{n}", String(rows.length))}</p>
          <table className="w-[calc(100%-1px)] table-fixed border-collapse text-left text-[11pt]">
            <colgroup>
              <col style={{ width: "12mm" }} />
              <col style={{ width: "30mm" }} />
              <col style={{ width: "30mm" }} />
              <col style={{ width: "30mm" }} />
              <col />
              <col style={{ width: "15mm" }} />
            </colgroup>
            <thead>
              <tr className="bg-ink-50">
                <th className="border border-ink-500/40 px-2 py-1.5 text-center font-semibold">{headers.no}</th>
                {COLS.map((c) => (
                  <th key={c} className="border border-ink-500/40 px-2 py-1.5 font-semibold">
                    {headers[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="break-inside-avoid">
                  <td className="border border-ink-500/40 px-2 py-1.5 text-center align-middle text-ink-500">{i + 1}</td>
                  <td className="hanzi border border-ink-500/40 px-2 py-1.5 align-middle text-[18pt] leading-tight">{r.word}</td>
                  <td className="border border-ink-500/40 px-2 py-1.5 align-middle">{r.pinyin}</td>
                  <td className="border border-ink-500/40 px-2 py-1.5 align-middle">{r.hanviet}</td>
                  <td className="border border-ink-500/40 px-2 py-1.5 align-middle">{r.meaning}</td>
                  <td className="border border-ink-500/40 px-2 py-1.5 text-center align-middle text-[9pt]">
                    {r.hsk.replace(/^HSK\s*/i, "")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
