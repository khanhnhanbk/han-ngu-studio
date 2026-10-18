"use client";

import { pinyin } from "pinyin-pro";
import { useEffect, useState, type FormEvent } from "react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { StrokeSteps } from "@/components/stroke-order/StrokeSteps";
import { Writer } from "@/components/stroke-order/Writer";
import { confirmDownload } from "@/lib/data/budget";
import { HANVIET_FILE, loadHanviet } from "@/lib/hanviet/load";
import { allCharReadings, type HanvietData } from "@/lib/hanviet/lookup";
import { getDictionary } from "@/lib/i18n";
import { parseCharacters, parseSheetCharacters } from "@/lib/practiceSheet";
import type { ScriptConverter } from "@/lib/script/convert";
import { useConverter } from "@/lib/script/useScript";
import { loadStrokes, strokeFiles } from "@/lib/strokes/load";
import type { StrokeData } from "@/lib/strokes/types";

const dict = getDictionary("vi");
const t = dict.strokeOrder;

const SAMPLE = "永字学写";
const MAX_CHARS = 20;

type Loaded = {
  chars: string[];
  /** Phồn thể mode: the Simplified character for Pinyin and Hán Việt. */
  simpOf?: ReadonlyMap<string, string>;
  strokes: Map<string, StrokeData>;
  hanviet: HanvietData | null;
};

export default function StrokeOrderPage() {
  const [input, setInput] = useState(SAMPLE);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [current, setCurrent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // The text last looked up (an object, so looking up the same text again
  // still runs). Re-run when the script switch changes.
  const [query, setQuery] = useState<{ text: string } | null>(null);
  const { conv, ready, failed } = useConverter();

  async function lookup(text: string, conv: ScriptConverter) {
    setError("");
    // Phồn thể mode shows Traditional characters whatever was typed.
    const { chars, simpOf } =
      conv.script === "trad"
        ? parseSheetCharacters(conv.toShown(text), conv.toSimp(text), true)
        : { chars: parseCharacters(text, true), simpOf: undefined };
    if (chars.length === 0) {
      setError(t.error);
      return;
    }
    if (chars.length > MAX_CHARS) {
      setError(t.tooMany);
      return;
    }
    setLoading(true);
    try {
      if (!(await confirmDownload([...strokeFiles(chars), HANVIET_FILE]))) return setError(dict.download.declined);
      const [strokes, hanviet] = await Promise.all([
        loadStrokes(chars),
        // Hán Việt is extra information; the page still works without it.
        loadHanviet().catch(() => null),
      ]);
      setLoaded({ chars, simpOf, strokes, hanviet });
      setCurrent(chars[0]);
      // The hash is never sent to the server, so the text stays on the device.
      window.history.replaceState(
        null,
        "",
        `#${new URLSearchParams({ c: chars.join("") })}`,
      );
    } catch {
      setError(t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  // Open the characters from a shared link (#c=…), or the sample.
  useEffect(() => {
    const fromHash = new URLSearchParams(window.location.hash.slice(1)).get("c");
    const text = fromHash || SAMPLE;
    setInput(text);
    setQuery({ text });
  }, []);

  // Waits for the Phồn thể converter so the first lookup is in the right script.
  useEffect(() => {
    if (query && ready) void lookup(query.text, conv);
  }, [query, conv, ready]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setQuery({ text: input });
  }

  const data = loaded?.strokes.get(current);
  const simpCurrent = loaded?.simpOf?.get(current) ?? current;
  const sheetHref =
    loaded &&
    `/tools/practice-sheet#${new URLSearchParams({
      chars: loaded.chars.join(""),
      strokes: "1",
    })}`;

  return (
    <>
      <Navbar />
      <main>
        <section className="section">
          <div className="container-page">
            <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{t.title}</h1>
            <p className="mt-4 text-lg text-ink-700">{t.subtitle}</p>

            <form className="card mt-8" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
                {t.inputLabel}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    className="hanzi w-full rounded-lg border border-ink-900/10 bg-surface px-4 py-3 text-2xl text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={input}
                    placeholder={t.placeholder}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <button type="submit" className="btn-primary shrink-0" disabled={loading || !ready}>
                    {loading ? t.loading : t.button}
                  </button>
                </div>
              </label>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              {!ready && !failed && <p className="mt-3 text-sm text-ink-500">{dict.script.loading}</p>}
              {failed && <p className="mt-3 text-sm text-red-600">{dict.script.loadFailed}</p>}

              {loaded && loaded.chars.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-2" role="tablist">
                  {loaded.chars.map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="tab"
                      aria-selected={c === current}
                      onClick={() => setCurrent(c)}
                      className={
                        "hanzi h-12 w-12 rounded-lg border text-2xl transition " +
                        (c === current
                          ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-400"
                          : "border-ink-900/10 text-ink-900 hover:border-ink-900/30")
                      }
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {loaded && current && (
              <div className="card mt-6">
                <div className="grid gap-8 md:grid-cols-[minmax(0,320px)_1fr]">
                  {data ? (
                    <Writer key={current} char={current} data={data} />
                  ) : (
                    <p className="text-sm text-ink-700">{t.noData}</p>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-baseline gap-4">
                      <span className="hanzi text-6xl text-ink-900">{current}</span>
                      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                        <dt className="text-ink-500">{t.pinyin}</dt>
                        <dd className="font-medium text-ink-900">
                          {pinyin(simpCurrent, { multiple: true, type: "array" }).join(", ")}
                        </dd>
                        <dt className="text-ink-500">{t.hanviet}</dt>
                        <dd className="font-medium text-brand-ink">
                          {allCharReadings(loaded.hanviet, simpCurrent).join(", ") || "—"}
                        </dd>
                        <dt className="text-ink-500">{t.strokeCount}</dt>
                        <dd className="font-medium text-ink-900">
                          {data ? data.strokes.length : "—"}
                        </dd>
                      </dl>
                    </div>

                    {data && (
                      <>
                        <h2 className="mt-6 text-lg font-semibold text-ink-900">{t.steps}</h2>
                        <p className="mb-3 mt-1 text-sm text-ink-500">{t.stepsHint}</p>
                        <StrokeSteps data={data} label={t.stroke} />
                      </>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                      {sheetHref && (
                        <a href={sheetHref} className="btn-secondary">
                          {t.toSheet}
                        </a>
                      )}
                      <a href={`/tools/decompose#${new URLSearchParams({ c: current })}`} className="btn-secondary">
                        {t.toDecompose}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="mt-6 text-xs text-ink-500">{t.credit}</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
