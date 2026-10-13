"use client";

import { useMemo, useState } from "react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { SheetPage } from "@/components/practice-sheet/SheetPage";
import { getDictionary } from "@/lib/i18n";
import {
  MAX_CHARACTERS,
  MAX_TRACE,
  paginate,
  parseCharacters,
  type GridType,
} from "@/lib/practiceSheet";

const dict = getDictionary("vi");

const SAMPLE = "永和九年岁在癸丑暮春之初";

export default function PracticeSheetPage() {
  const [text, setText] = useState(SAMPLE);
  const [gridType, setGridType] = useState<GridType>("mizi");
  const [traceCount, setTraceCount] = useState(8);
  const [showPinyin, setShowPinyin] = useState(true);
  const [dedupe, setDedupe] = useState(false);
  const [error, setError] = useState("");

  const characters = useMemo(
    () => parseCharacters(text, dedupe),
    [text, dedupe],
  );
  const tooMany = characters.length > MAX_CHARACTERS;
  const pages = useMemo(
    () => paginate(tooMany ? [] : characters),
    [characters, tooMany],
  );
  const options = { gridType, traceCount, showPinyin };

  async function handleFile(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!/\.(txt|csv)$/i.test(file.name)) {
      setError(dict.practiceSheet.badFile);
      return;
    }
    setText(await file.text());
  }

  function handlePrint() {
    setError("");
    if (characters.length === 0) {
      setError(dict.practiceSheet.error);
      return;
    }
    if (tooMany) {
      setError(dict.practiceSheet.tooMany);
      return;
    }
    window.print();
  }

  return (
    <>
      <Navbar />
      <main>
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
                    {dict.practiceSheet.count}: {characters.length} /{" "}
                    {MAX_CHARACTERS}
                  </span>
                  {tooMany && (
                    <span className="text-red-600">
                      {dict.practiceSheet.tooMany}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid gap-4 text-sm text-ink-700 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="font-medium">
                      {dict.practiceSheet.upload}
                    </span>
                    <input
                      type="file"
                      accept=".txt,.csv"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                      className="text-sm"
                    />
                  </label>

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
                      {dict.practiceSheet.traceCount}: {traceCount}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={MAX_TRACE}
                      value={traceCount}
                      onChange={(e) => setTraceCount(Number(e.target.value))}
                    />
                  </label>

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
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handlePrint}
                  >
                    {dict.practiceSheet.print}
                  </button>
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

                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
              </div>

              <h2 className="mt-10 text-xl font-semibold text-ink-900">
                {dict.practiceSheet.preview} ({pages.length}{" "}
                {dict.practiceSheet.pages})
              </h2>
            </div>

            <div className="sheet-print-area mt-4 flex flex-col items-center gap-6 print:mt-0 print:gap-0">
              {pages.map((pageChars, i) => (
                <SheetPage
                  key={i}
                  characters={pageChars}
                  options={options}
                  pageNumber={i + 1}
                  pageCount={pages.length}
                  labels={{
                    name: dict.practiceSheet.nameLabel,
                    date: dict.practiceSheet.dateLabel,
                  }}
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
