"use client";

import { useState } from "react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { postJSON } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";

const dict = getDictionary("vi");

const SAMPLE = "我喜欢学习中文。";
const MAX_LENGTH = 5000;

type SegmentResponse = {
  segmented: string;
  lines: string[][];
};

export default function SegmentPage() {
  const [text, setText] = useState(SAMPLE);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const tooLong = text.length > MAX_LENGTH;

  async function handleSegment() {
    setError("");
    setCopied(false);
    if (!text.trim()) {
      setError(dict.segment.error);
      return;
    }
    if (tooLong) {
      setError(dict.segment.tooLong);
      return;
    }
    setLoading(true);
    try {
      const data = await postJSON<SegmentResponse>("/api/py/segment", { text });
      setResult(data.segmented);
    } catch (e) {
      setError(e instanceof Error ? e.message : dict.segment.error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
  }

  function handleDownload() {
    const blob = new Blob([result], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "segmented.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="section">
          <div className="container-page">
            <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">
              {dict.segment.title}
            </h1>
            <p className="mt-4 text-lg text-ink-700">{dict.segment.subtitle}</p>

            <div className="card mt-8">
              <textarea
                className="hanzi w-full resize-y rounded-lg border border-ink-900/10 p-4 text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={6}
                value={text}
                placeholder={dict.segment.placeholder}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="mt-2 flex items-center justify-between text-sm text-ink-500">
                <span>
                  {text.length} / {MAX_LENGTH}
                </span>
                {tooLong && (
                  <span className="text-red-600">{dict.segment.tooLong}</span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSegment}
                  disabled={loading}
                >
                  {loading ? dict.segment.loading : dict.segment.button}
                </button>
              </div>

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              {result && (
                <div className="mt-6">
                  <div className="hanzi whitespace-pre-wrap rounded-lg border border-ink-900/10 bg-ink-50 p-4 text-lg">
                    {result}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleCopy}
                    >
                      {copied ? dict.segment.copied : dict.segment.copy}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleDownload}
                    >
                      {dict.segment.download}
                    </button>
                  </div>
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
