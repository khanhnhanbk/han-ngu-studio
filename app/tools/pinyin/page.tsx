"use client";

import { useMemo, useState } from "react";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { confirmDownload } from "@/lib/data/budget";
import { downloadText } from "@/lib/download";
import { useDictionary } from "@/lib/i18n/useLocale";
import {
  convertText,
  toTsv,
  type PinyinLine,
  type Spacing,
  type ToneStyle,
} from "@/lib/pinyin/convert";
import { createAligner, type ScriptConverter } from "@/lib/script/convert";
import { useConverter } from "@/lib/script/useScript";
import { loadTokenizer, TOKENIZER_FILES } from "@/lib/segment/load";
import type { Tokenizer } from "@/lib/segment/tokenizer";
import { CheckIcon } from "@/components/icons/check";
import { CopyIcon } from "@/components/icons/copy";
import { DownloadIcon } from "@/components/icons/download";
import { IconButton } from "@/components/icons/trigger";
import { FileInput } from "@/components/FileInput";

const SAMPLE = "我去银行取钱，然后行走回家。\n他长大了，头发很长。";
const MAX_LENGTH = 5000;

type View = "text" | "ruby" | "tsv";

const TONE_STYLES: ToneStyle[] = ["mark", "number", "none"];
const SPACINGS: Spacing[] = ["word", "syllable"];
const VIEWS: View[] = ["text", "ruby", "tsv"];

function RubyLine({ line }: { line: PinyinLine }) {
  if (!line.source.trim()) return <div className="h-6" />;
  return (
    <p className="hanzi text-2xl leading-[2.6]">
      {line.segments.map((seg, i) =>
        seg.kind === "han" ? (
          <span key={i} className="mr-1 inline-block">
            {seg.chars.map((ch, j) => (
              <ruby key={j}>
                {ch}
                <rt className="font-sans text-xs text-brand-ink">{seg.syllables[j]}</rt>
              </ruby>
            ))}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </p>
  );
}

/**
 * Pinyin is read from the Simplified text (pinyin-pro gets 們/行 wrong in
 * Traditional); the characters are then relabelled in the chosen script.
 */
function showLines(lines: PinyinLine[], conv: ScriptConverter, text: string): PinyinLine[] {
  if (conv.script === "simp") return lines;
  const shown = conv.toShown(text).split("\n");
  return lines.map((line, i) => {
    const source = (shown[i] ?? line.source).replace(/\r$/, "");
    const take = createAligner(line.source, source);
    return {
      ...line,
      source,
      segments: line.segments.map((seg) =>
        seg.kind === "han"
          ? { ...seg, chars: Array.from(take(seg.chars.join(""))) }
          : { ...seg, text: take(seg.text) },
      ),
    };
  });
}

export default function PinyinPage() {
  const dict = useDictionary();
  const [text, setText] = useState(SAMPLE);
  const [toneStyle, setToneStyle] = useState<ToneStyle>("mark");
  const [spacing, setSpacing] = useState<Spacing>("word");
  const [view, setView] = useState<View>("text");
  const [tokenizer, setTokenizer] = useState<Tokenizer | null>(null);
  const [submitted, setSubmitted] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const { conv, ready, failed } = useConverter();

  // Counted in code points, like the segmentation tool.
  const length = Array.from(text).length;
  const tooLong = length > MAX_LENGTH;

  // Re-computed when the options change, so the user sees the effect at once.
  const lines = useMemo(
    () =>
      tokenizer && submitted
        ? showLines(
            convertText(tokenizer, conv.toSimp(submitted), { toneStyle, spacing }),
            conv,
            submitted,
          )
        : [],
    [tokenizer, submitted, toneStyle, spacing, conv],
  );
  const plain = useMemo(() => lines.map((l) => l.text).join("\n"), [lines]);
  const tsv = useMemo(() => toTsv(lines), [lines]);

  async function handleFile(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!/\.txt$/i.test(file.name)) {
      setError(dict.pinyin.badFile);
      return;
    }
    setText(await file.text());
  }

  async function handleConvert() {
    setError("");
    setCopied(false);
    if (!text.trim()) {
      setError(dict.pinyin.error);
      return;
    }
    if (tooLong) {
      setError(dict.pinyin.tooLong);
      return;
    }
    setLoading(true);
    try {
      if (!(await confirmDownload(TOKENIZER_FILES))) return setError(dict.download.declined);
      setTokenizer(await loadTokenizer());
      setSubmitted(text);
    } catch {
      setError(dict.pinyin.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(view === "tsv" ? tsv : plain);
    setCopied(true);
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="section">
          <div className="container-page">
            <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">
              {dict.pinyin.title}
            </h1>
            <p className="mt-4 text-lg text-ink-700">{dict.pinyin.subtitle}</p>

            <div className="card mt-8">
              <textarea
                className="hanzi w-full resize-y rounded-lg border border-ink-900/10 p-4 text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={6}
                value={text}
                placeholder={dict.pinyin.placeholder}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="mt-2 flex items-center justify-between text-sm text-ink-700/70">
                <span>
                  {length} / {MAX_LENGTH}
                </span>
                {tooLong && <span className="text-red-600">{dict.pinyin.tooLong}</span>}
              </div>

              <div className="mt-4 grid gap-4 text-sm text-ink-700 sm:grid-cols-3">
                <FileInput label={dict.pinyin.upload} accept=".txt" onFile={handleFile} />

                <label className="flex flex-col gap-1">
                  <span className="font-medium">{dict.pinyin.toneStyle}</span>
                  <select
                    value={toneStyle}
                    onChange={(e) => setToneStyle(e.target.value as ToneStyle)}
                    className="rounded-lg border border-ink-900/10 px-3 py-2"
                  >
                    {TONE_STYLES.map((k) => (
                      <option key={k} value={k}>
                        {dict.pinyin.tones[k]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="font-medium">{dict.pinyin.spacing}</span>
                  <select
                    value={spacing}
                    onChange={(e) => setSpacing(e.target.value as Spacing)}
                    className="rounded-lg border border-ink-900/10 px-3 py-2"
                  >
                    {SPACINGS.map((k) => (
                      <option key={k} value={k}>
                        {dict.pinyin.spacings[k]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleConvert}
                  disabled={loading || !ready}
                >
                  {loading ? dict.pinyin.loading : dict.pinyin.button}
                </button>
              </div>

              {!ready && !failed && <p className="mt-4 text-sm text-ink-500">{dict.script.loading}</p>}
              {failed && <p className="mt-4 text-sm text-red-600">{dict.script.loadFailed}</p>}

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              {lines.length > 0 && (
                <div className="mt-6">
                  <div role="tablist" className="flex flex-wrap gap-2">
                    {VIEWS.map((v) => (
                      <button
                        key={v}
                        type="button"
                        role="tab"
                        aria-selected={view === v}
                        onClick={() => {
                          setView(v);
                          setCopied(false);
                        }}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                          view === v
                            ? "bg-brand-600 text-on-brand"
                            : "bg-ink-50 text-ink-700 hover:bg-ink-900/5"
                        }`}
                      >
                        {dict.pinyin.views[v]}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg border border-ink-900/10 bg-ink-50 p-4">
                    {view === "text" && (
                      <p className="whitespace-pre-wrap text-lg">{plain}</p>
                    )}
                    {view === "ruby" &&
                      lines.map((line, i) => <RubyLine key={i} line={line} />)}
                    {view === "tsv" && (
                      <>
                        <pre className="hanzi overflow-x-auto whitespace-pre text-sm">{tsv}</pre>
                        <p className="mt-3 text-xs text-ink-700/70">{dict.pinyin.tsvHint}</p>
                      </>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-ink-700/70">{dict.pinyin.note}</p>

                  {view !== "ruby" && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <IconButton icon={copied ? CheckIcon : CopyIcon} className="btn-secondary" onClick={handleCopy}>
                        {copied ? dict.pinyin.copied : dict.pinyin.copy}
                      </IconButton>
                      {view === "text" ? (
                        <IconButton
                          icon={DownloadIcon}
                          className="btn-secondary"
                          onClick={() => downloadText(plain, "pinyin.txt")}
                        >
                          {dict.pinyin.downloadTxt}
                        </IconButton>
                      ) : (
                        <IconButton
                          icon={DownloadIcon}
                          className="btn-secondary"
                          onClick={() =>
                            downloadText(tsv, "pinyin.tsv", "text/tab-separated-values")
                          }
                        >
                          {dict.pinyin.downloadTsv}
                        </IconButton>
                      )}
                    </div>
                  )}
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
