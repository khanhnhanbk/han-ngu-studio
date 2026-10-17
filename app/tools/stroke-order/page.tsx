"use client";

import { pinyin } from "pinyin-pro";
import { useEffect, useState, type FormEvent } from "react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { StrokeSteps } from "@/components/stroke-order/StrokeSteps";
import { Writer } from "@/components/stroke-order/Writer";
import { loadHanviet } from "@/lib/hanviet/load";
import type { HanvietData } from "@/lib/hanviet/lookup";
import { getDictionary } from "@/lib/i18n";
import { parseCharacters } from "@/lib/practiceSheet";
import { loadStrokes } from "@/lib/strokes/load";
import type { StrokeData } from "@/lib/strokes/types";

const dict = getDictionary("vi");
const t = dict.strokeOrder;

const SAMPLE = "永字学写";
const MAX_CHARS = 20;

type Loaded = {
  chars: string[];
  strokes: Map<string, StrokeData>;
  hanviet: HanvietData | null;
};

/** Every Hán Việt reading of a character, in data order, without repeats. */
function hanvietReadings(data: HanvietData | null, char: string): string[] {
  const out: string[] = [];
  for (const [, readings] of data?.[char] ?? []) {
    for (const r of readings) if (!out.includes(r)) out.push(r);
  }
  return out;
}

export default function StrokeOrderPage() {
  const [input, setInput] = useState(SAMPLE);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [current, setCurrent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookup(text: string) {
    setError("");
    const chars = parseCharacters(text, true);
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
      const [strokes, hanviet] = await Promise.all([
        loadStrokes(chars),
        // Hán Việt is extra information; the page still works without it.
        loadHanviet().catch(() => null),
      ]);
      setLoaded({ chars, strokes, hanviet });
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
    void lookup(text);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void lookup(input);
  }

  const data = loaded?.strokes.get(current);
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
                  <button type="submit" className="btn-primary shrink-0" disabled={loading}>
                    {loading ? t.loading : t.button}
                  </button>
                </div>
              </label>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

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
                          {pinyin(current, { multiple: true, type: "array" }).join(", ")}
                        </dd>
                        <dt className="text-ink-500">{t.hanviet}</dt>
                        <dd className="font-medium text-brand-ink">
                          {hanvietReadings(loaded.hanviet, current).join(", ") || "—"}
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

                    {sheetHref && (
                      <a href={sheetHref} className="btn-secondary mt-6">
                        {t.toSheet}
                      </a>
                    )}
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
