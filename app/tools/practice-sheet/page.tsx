"use client";

import { useEffect, useMemo, useState } from "react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { FontPicker } from "@/components/practice-sheet/FontPicker";
import { SheetPage } from "@/components/practice-sheet/SheetPage";
import { useDictionary } from "@/lib/i18n/useLocale";
import {
  BOX_SIZES,
  GRID_COLORS,
  TRACE_COLORS,
  buildPages,
  getLayout,
  parseCharacters,
  parseSheetCharacters,
  type BoxSizeName,
  type GridColorName,
  type GridType,
  type SheetOptions,
  type TraceShadeName,
} from "@/lib/practiceSheet";
import { useConverter } from "@/lib/script/useScript";
import { fontStack, isSheetFontId, type SheetFontId } from "@/lib/sheetFonts";
import { confirmDownload, downloadSize, formatBytes } from "@/lib/data/budget";
import { loadStrokes, strokeFiles } from "@/lib/strokes/load";
import type { StrokeData } from "@/lib/strokes/types";

import { sheetFontVariables } from "./fonts";
import { PrinterIcon } from "@/components/icons/printer";
import { IconButton } from "@/components/icons/trigger";
import { FileInput } from "@/components/FileInput";

const SAMPLE = "永和九年岁在癸丑暮春之初";

const STORAGE_KEY = "practice-sheet-options";

type StoredOptions = {
  gridType: GridType;
  traceCount: number;
  showPinyin: boolean;
  dedupe: boolean;
  gridColor: GridColorName;
  traceShade: TraceShadeName;
  boxSize: BoxSizeName;
  linesPerChar: number;
  showStrokeOrder: boolean;
  fontId: SheetFontId;
  localFontName: string;
};

const DEFAULTS: StoredOptions = {
  gridType: "mizi",
  traceCount: 8,
  showPinyin: true,
  dedupe: false,
  gridColor: "red",
  traceShade: "medium",
  boxSize: "medium",
  linesPerChar: 1,
  showStrokeOrder: false,
  fontId: "notoSerif",
  localFontName: "",
};

type StrokeState =
  | { status: "idle" | "loading" | "error" }
  | { status: "ready"; data: Map<string, StrokeData> }
  // The user chose "Để sau" in the download prompt; bytes is for the notice.
  | { status: "declined"; bytes: number };

export default function PracticeSheetPage() {
  const dict = useDictionary();
  const [text, setText] = useState(SAMPLE);
  const [gridType, setGridType] = useState<GridType>(DEFAULTS.gridType);
  const [traceCount, setTraceCount] = useState(DEFAULTS.traceCount);
  const [showPinyin, setShowPinyin] = useState(DEFAULTS.showPinyin);
  const [dedupe, setDedupe] = useState(DEFAULTS.dedupe);
  const [gridColor, setGridColor] = useState<GridColorName>(DEFAULTS.gridColor);
  const [traceShade, setTraceShade] =
    useState<TraceShadeName>(DEFAULTS.traceShade);
  const [boxSize, setBoxSize] = useState<BoxSizeName>(DEFAULTS.boxSize);
  const [linesPerChar, setLinesPerChar] = useState(DEFAULTS.linesPerChar);
  const [showStrokeOrder, setShowStrokeOrder] = useState(
    DEFAULTS.showStrokeOrder,
  );
  const [fontId, setFontId] = useState<SheetFontId>(DEFAULTS.fontId);
  const [localFontName, setLocalFontName] = useState(DEFAULTS.localFontName);
  // Name of the font file loaded this visit (uploaded fonts are not saved).
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [strokeState, setStrokeState] = useState<StrokeState>({
    status: "idle",
  });
  // After "Để sau" the sheet stops asking until the user loads the data
  // with the notice's button (strokesAllowed) or turns the option off and on.
  const [strokesDeclined, setStrokesDeclined] = useState(false);
  const [strokesAllowed, setStrokesAllowed] = useState(false);
  const [error, setError] = useState("");

  // Hydrate persisted options on mount (SSR-safe), then apply
  // #chars=…&strokes=1 from links such as the stroke-order lookup page.
  // The hash is never sent to the server, so the text stays on the device.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = { ...DEFAULTS, ...JSON.parse(raw) } as StoredOptions;
        setGridType(saved.gridType);
        setTraceCount(saved.traceCount);
        setShowPinyin(saved.showPinyin);
        setDedupe(saved.dedupe);
        if (Object.hasOwn(GRID_COLORS, saved.gridColor)) {
          setGridColor(saved.gridColor);
        }
        setTraceShade(saved.traceShade);
        setBoxSize(saved.boxSize);
        setLinesPerChar(saved.linesPerChar);
        setShowStrokeOrder(saved.showStrokeOrder);
        // An uploaded font is gone after a reload, so it is never restored.
        if (isSheetFontId(saved.fontId) && saved.fontId !== "upload") {
          setFontId(saved.fontId);
        }
        if (typeof saved.localFontName === "string") {
          setLocalFontName(saved.localFontName);
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    const params = new URLSearchParams(window.location.hash.slice(1));
    const chars = params.get("chars");
    if (chars) setText(chars);
    if (params.get("strokes") === "1") setShowStrokeOrder(true);
  }, []);

  const layout = useMemo(() => getLayout(boxSize), [boxSize]);

  // Keep the trace slider within the valid range for the current box size.
  useEffect(() => {
    setTraceCount((c) => Math.min(c, layout.maxTrace));
  }, [layout.maxTrace]);

  // Persist options whenever they change.
  useEffect(() => {
    try {
      const data: StoredOptions = {
        gridType,
        traceCount,
        showPinyin,
        dedupe,
        gridColor,
        traceShade,
        boxSize,
        linesPerChar,
        showStrokeOrder,
        fontId: fontId === "upload" ? DEFAULTS.fontId : fontId,
        localFontName,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [
    gridType,
    traceCount,
    showPinyin,
    dedupe,
    gridColor,
    traceShade,
    boxSize,
    linesPerChar,
    showStrokeOrder,
    fontId,
    localFontName,
  ]);

  const { conv, ready, failed } = useConverter();
  const trad = conv.script === "trad";
  // Phồn thể mode: the sheet shows Traditional characters whatever was typed,
  // with Pinyin read from the Simplified character (simpOf).
  const sheet = useMemo(
    () =>
      trad
        ? parseSheetCharacters(conv.toShown(text), conv.toSimp(text), dedupe)
        : { chars: parseCharacters(text, dedupe), simpOf: undefined },
    [text, dedupe, conv, trad],
  );
  const characters = sheet.chars;
  const tooMany = characters.length > 300;
  // Without the data the sheet is laid out (and prints) without the strip.
  const withStrokes = showStrokeOrder && strokeState.status !== "declined";
  const pages = useMemo(
    () =>
      tooMany
        ? []
        : buildPages(
            characters,
            linesPerChar,
            layout.rowsPerPage,
            withStrokes,
          ),
    [characters, linesPerChar, layout.rowsPerPage, tooMany, withStrokes],
  );

  useEffect(() => {
    if (!showStrokeOrder) {
      setStrokesDeclined(false);
      setStrokesAllowed(false);
    }
  }, [showStrokeOrder]);

  // Fetch stroke data for the characters on the sheet (only the shards
  // they fall in; each shard is fetched once per visit). Waits until typing
  // pauses, and asks first when the download is large (lib/data/budget.ts).
  useEffect(() => {
    if (!showStrokeOrder || tooMany || characters.length === 0) {
      setStrokeState({ status: "idle" });
      return;
    }
    let cancelled = false;
    const files = strokeFiles(characters);
    // Declined: stay without strokes, only keep the notice's size current.
    if (strokesDeclined && !strokesAllowed) {
      void downloadSize(files).then((bytes) => !cancelled && setStrokeState({ status: "declined", bytes }));
      return () => {
        cancelled = true;
      };
    }
    setStrokeState((s) => (s.status === "ready" ? s : { status: "loading" }));
    const timer = window.setTimeout(async () => {
      try {
        const ok = strokesAllowed || (await confirmDownload(files));
        if (!ok) {
          const bytes = await downloadSize(files);
          if (!cancelled) {
            setStrokesDeclined(true);
            setStrokeState({ status: "declined", bytes });
          }
          return;
        }
        const data = await loadStrokes(characters);
        if (!cancelled) setStrokeState({ status: "ready", data });
      } catch {
        if (!cancelled) setStrokeState({ status: "error" });
      }
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [showStrokeOrder, characters, tooMany, strokesAllowed, strokesDeclined]);

  // Hold printing until the strips can be drawn.
  const strokesPending =
    withStrokes &&
    characters.length > 0 &&
    !tooMany &&
    strokeState.status !== "ready";
  const options: SheetOptions = {
    gridType,
    traceCount,
    showPinyin,
    gridColor,
    traceShade,
    boxSize,
    linesPerChar,
    showStrokeOrder: withStrokes,
    fontFamily: fontStack(
      fontId === "upload" && !uploadName ? DEFAULTS.fontId : fontId,
      localFontName,
      trad,
    ),
  };

  async function handleFile(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!/\.(txt|csv)$/i.test(file.name)) {
      setError(dict.practiceSheet.badFile);
      return;
    }
    setText(await file.text());
  }

  async function handlePrint() {
    setError("");
    if (characters.length === 0) {
      setError(dict.practiceSheet.error);
      return;
    }
    if (tooMany) {
      setError(dict.practiceSheet.tooMany);
      return;
    }
    if (strokesPending) return;
    // Let the chosen font's glyphs finish loading before the print snapshot.
    await document.fonts.ready;
    window.print();
  }

  return (
    <>
      <Navbar />
      <main className={sheetFontVariables}>
        <section className="section print:p-0">
          <div className="container-page print:max-w-none print:p-0">
            <div className="print:hidden">
              <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">
                {dict.practiceSheet.title}
              </h1>
              <p className="mt-4 text-lg text-ink-700">
                {dict.practiceSheet.subtitle}
              </p>

              <div className="card mt-8">
                <textarea
                  className="hanzi w-full resize-y rounded-lg border border-ink-900/10 p-4 text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  rows={5}
                  value={text}
                  placeholder={dict.practiceSheet.placeholder}
                  onChange={(e) => setText(e.target.value)}
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-500">
                  <span>
                    {dict.practiceSheet.count}: {characters.length} / 300
                  </span>
                  {tooMany && (
                    <span className="text-red-600">
                      {dict.practiceSheet.tooMany}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid gap-4 text-sm text-ink-700 sm:grid-cols-2">
                  <FileInput label={dict.practiceSheet.upload} accept=".txt,.csv" onFile={handleFile} />

                  <label className="flex flex-col gap-1">
                    <span className="font-medium">
                      {dict.practiceSheet.gridType}
                    </span>
                    <select
                      value={gridType}
                      onChange={(e) => setGridType(e.target.value as GridType)}
                      className="rounded-lg border border-ink-900/10 px-3 py-2"
                    >
                      <option value="mizi">{dict.practiceSheet.mizi}</option>
                      <option value="tianzi">
                        {dict.practiceSheet.tianzi}
                      </option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="font-medium">
                      {dict.practiceSheet.boxSize}
                    </span>
                    <select
                      value={boxSize}
                      onChange={(e) =>
                        setBoxSize(e.target.value as BoxSizeName)
                      }
                      className="rounded-lg border border-ink-900/10 px-3 py-2"
                    >
                      {(Object.keys(BOX_SIZES) as BoxSizeName[]).map((k) => (
                        <option key={k} value={k}>
                          {dict.practiceSheet.sizes[k]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="font-medium">
                      {dict.practiceSheet.traceShade}
                    </span>
                    <select
                      value={traceShade}
                      onChange={(e) =>
                        setTraceShade(e.target.value as TraceShadeName)
                      }
                      className="rounded-lg border border-ink-900/10 px-3 py-2"
                    >
                      {(Object.keys(TRACE_COLORS) as TraceShadeName[]).map(
                        (k) => (
                          <option key={k} value={k}>
                            {dict.practiceSheet.shades[k]}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="font-medium">
                      {dict.practiceSheet.traceCount}: {traceCount}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={layout.maxTrace}
                      value={traceCount}
                      onChange={(e) => setTraceCount(Number(e.target.value))}
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="font-medium">
                      {dict.practiceSheet.linesPerChar}: {linesPerChar}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={linesPerChar}
                      onChange={(e) =>
                        setLinesPerChar(
                          Math.max(1, Math.min(6, Number(e.target.value) || 1)),
                        )
                      }
                      className="rounded-lg border border-ink-900/10 px-3 py-2"
                    />
                  </label>

                  <FontPicker
                    fontId={fontId}
                    onFontId={setFontId}
                    localName={localFontName}
                    onLocalName={setLocalFontName}
                    uploadName={uploadName}
                    onUploadName={setUploadName}
                  />

                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <span className="font-medium">
                      {dict.practiceSheet.gridColor}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(GRID_COLORS) as GridColorName[]).map(
                        (name) => {
                          const c = GRID_COLORS[name];
                          const active = gridColor === name;
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => setGridColor(name)}
                              className={
                                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition " +
                                (active
                                  ? "border-brand-500 ring-2 ring-brand-400"
                                  : "border-ink-900/10 hover:border-ink-900/30")
                              }
                            >
                              <span
                                className="inline-block h-4 w-4 rounded-sm"
                                style={{ backgroundColor: c.border }}
                              />
                              {dict.practiceSheet.colors[name]}
                            </button>
                          );
                        },
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-end gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={showPinyin}
                        onChange={(e) => setShowPinyin(e.target.checked)}
                      />
                      {dict.practiceSheet.showPinyin}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={dedupe}
                        onChange={(e) => setDedupe(e.target.checked)}
                      />
                      {dict.practiceSheet.dedupe}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={showStrokeOrder}
                        onChange={(e) => setShowStrokeOrder(e.target.checked)}
                      />
                      {dict.practiceSheet.showStrokeOrder}
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <IconButton
                    icon={PrinterIcon}
                    className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handlePrint}
                    disabled={strokesPending}
                  >
                    {strokesPending && strokeState.status === "loading"
                      ? dict.practiceSheet.strokesLoading
                      : dict.practiceSheet.print}
                  </IconButton>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setText(SAMPLE)}
                  >
                    {dict.practiceSheet.sample}
                  </button>
                </div>
                <p className="mt-3 text-xs text-ink-500">
                  {dict.practiceSheet.printHint}
                </p>
                {showStrokeOrder && (
                  <p className="mt-1 text-xs text-ink-500">
                    {dict.practiceSheet.strokesCredit}
                  </p>
                )}
                {strokeState.status === "declined" && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-700">
                    <p>{dict.download.strokesDeclined.replace("{size}", formatBytes(strokeState.bytes))}</p>
                    <button type="button" className="btn-secondary px-3 py-2" onClick={() => setStrokesAllowed(true)}>
                      {dict.download.strokesLoad}
                    </button>
                  </div>
                )}
                {strokeState.status === "error" && (
                  <p className="mt-4 text-sm text-red-600">
                    {dict.practiceSheet.strokesFailed}
                  </p>
                )}

                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
                {!ready && !failed && <p className="mt-4 text-sm text-ink-500">{dict.script.loading}</p>}
                {failed && <p className="mt-4 text-sm text-red-600">{dict.script.loadFailed}</p>}
              </div>

              <h2 className="mt-10 text-xl font-semibold text-ink-900">
                {dict.practiceSheet.preview} ({pages.length}{" "}
                {dict.practiceSheet.pages})
              </h2>
            </div>

            <div className="sheet-print-area mt-4 flex flex-col items-center gap-6 print:mt-0 print:gap-0">
              {pages.map((rows, i) => (
                <SheetPage
                  key={i}
                  rows={rows}
                  options={options}
                  pageNumber={i + 1}
                  pageCount={pages.length}
                  simpOf={sheet.simpOf}
                  labels={{
                    name: dict.practiceSheet.nameLabel,
                    date: dict.practiceSheet.dateLabel,
                    strokes: dict.practiceSheet.strokesUnit,
                    noStrokes: dict.practiceSheet.noStrokes,
                  }}
                  strokes={
                    strokeState.status === "ready"
                      ? strokeState.data
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}