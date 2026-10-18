"use client";

import { useMemo, useState } from "react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { confirmDownload } from "@/lib/data/budget";
import { downloadText } from "@/lib/download";
import { useDictionary } from "@/lib/i18n/useLocale";
import { createAligner } from "@/lib/script/convert";
import { useConverter } from "@/lib/script/useScript";
import { loadTokenizer, TOKENIZER_FILES } from "@/lib/segment/load";
import { joinTokens, segment, type Tokenizer } from "@/lib/segment/tokenizer";
import { CheckIcon } from "@/components/icons/check";
import { CopyIcon } from "@/components/icons/copy";
import { DownloadIcon } from "@/components/icons/download";
import { IconButton } from "@/components/icons/trigger";

const SAMPLE = "我喜欢学习中文。";
const MAX_LENGTH = 5000;

export default function SegmentPage() {
  const dict = useDictionary();
  const [text, setText] = useState(SAMPLE);
  const [tokenizer, setTokenizer] = useState<Tokenizer | null>(null);
  const [submitted, setSubmitted] = useState("");
  const { conv, ready, failed } = useConverter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Counted in code points, like the old Python API's limit.
  const length = Array.from(text).length;
  const tooLong = length > MAX_LENGTH;

  // Segment the Simplified text, then show each word in the chosen script
  // (both are the input itself in Giản thể mode).
  const result = useMemo(() => {
    if (!tokenizer || !submitted) return "";
    const take = createAligner(conv.toSimp(submitted), conv.toShown(submitted));
    return segment(tokenizer, conv.toSimp(submitted))
      .map((line) => joinTokens(line.map(take)))
      .join("\n");
  }, [tokenizer, submitted, conv]);

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
      if (!(await confirmDownload(TOKENIZER_FILES))) return setError(dict.download.declined);
      setTokenizer(await loadTokenizer());
      setSubmitted(text);
    } catch {
      setError(dict.segment.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
  }

  function handleDownload() {
    downloadText(result, "segmented.txt");
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
                  {length} / {MAX_LENGTH}
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
                  disabled={loading || !ready}
                >
                  {loading ? dict.segment.loading : dict.segment.button}
                </button>
              </div>

              {!ready && !failed && <p className="mt-4 text-sm text-ink-500">{dict.script.loading}</p>}
              {failed && <p className="mt-4 text-sm text-red-600">{dict.script.loadFailed}</p>}

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              {result && (
                <div className="mt-6">
                  <div className="hanzi whitespace-pre-wrap rounded-lg border border-ink-900/10 bg-ink-50 p-4 text-lg">
                    {result}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <IconButton
                      icon={copied ? CheckIcon : CopyIcon}
                      className="btn-secondary"
                      onClick={handleCopy}
                    >
                      {copied ? dict.segment.copied : dict.segment.copy}
                    </IconButton>
                    <IconButton
                      icon={DownloadIcon}
                      className="btn-secondary"
                      onClick={handleDownload}
                    >
                      {dict.segment.download}
                    </IconButton>
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
