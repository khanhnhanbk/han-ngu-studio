"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Footer } from "@/components/Footer";
import { LookupResult } from "@/components/lookup/LookupResult";
import { Navbar } from "@/components/Navbar";
import { SpeechToggle } from "@/components/speech/SpeechToggle";
import { loadMeanings, MEANINGS_FILE } from "@/lib/anki/load";
import { cvdictFile, loadCvdictShard } from "@/lib/cvdict/load";
import { confirmDownload } from "@/lib/data/budget";
import { exampleFiles, loadExamples } from "@/lib/examples/load";
import { HANVIET_FILE, loadHanviet } from "@/lib/hanviet/load";
import { useDictionary, useHref } from "@/lib/i18n/useLocale";
import { buildLookupCard, MAX_LOOKUP_CHARS, type LookupCard } from "@/lib/lookup/card";
import type { ScriptConverter } from "@/lib/script/convert";
import { useConverter } from "@/lib/script/useScript";
import { loadTokenizer, TOKENIZER_FILES } from "@/lib/segment/load";
import { loadVocab, VOCAB_FILE } from "@/lib/vocab/load";

const SAMPLE = "亲戚";
/** Unknown input longer than this is treated as a sentence (pointed to Đọc hiểu). */
const SENTENCE_CHARS = 4;
/** Chinese characters only: spaces and punctuation around a pasted word are dropped. */
const HAN = /\p{Script=Han}/u;

export default function LookupPage() {
  const dict = useDictionary();
  const t = dict.lookup;
  const href = useHref();
  const [input, setInput] = useState(SAMPLE);
  const [card, setCard] = useState<LookupCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tooLong, setTooLong] = useState(false);
  // The word last looked up (an object, so the same word again still runs). Re-run when the script switch changes.
  const [query, setQuery] = useState<{ text: string } | null>(null);
  const { conv, ready, failed } = useConverter();

  async function lookup(text: string, conv: ScriptConverter) {
    setError("");
    setTooLong(false);
    const word = Array.from(conv.toSimp(text.trim())).filter((c) => HAN.test(c)).join("");
    if (!word) return setError(t.error);
    if (Array.from(word).length > MAX_LOOKUP_CHARS) return setTooLong(true);
    setLoading(true);
    try {
      const files = [...TOKENIZER_FILES, HANVIET_FILE, VOCAB_FILE, MEANINGS_FILE, cvdictFile(word), ...(await exampleFiles([word]))];
      if (!(await confirmDownload(files))) return setError(dict.download.declined);
      const [tokenizer, hanviet, vocab, meanings, cvdict, examples] = await Promise.all([
        loadTokenizer(),
        loadHanviet(),
        loadVocab(),
        loadMeanings(),
        loadCvdictShard(word),
        loadExamples([word]),
      ]);
      const result = buildLookupCard({ tokenizer, hanviet, vocab, meanings, cvdict, examples }, word);
      setCard(result);
      // Not a word and longer than a short phrase: most likely a sentence.
      if (!result.readings.length && Array.from(word).length > SENTENCE_CHARS) setTooLong(true);
      // The hash is never sent to the server, so the word stays on the device.
      window.history.replaceState(null, "", `#${new URLSearchParams({ w: conv.toShown(word) })}`);
    } catch {
      setError(t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  // Open the word from a link (#w=…, e.g. from Đọc hiểu), or the sample.
  useEffect(() => {
    const read = () => {
      const text = new URLSearchParams(window.location.hash.slice(1)).get("w") || SAMPLE;
      setInput(text);
      setQuery({ text });
    };
    read();
    // A link to another word on this page only changes the hash.
    const onHash = () => read();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Waits for the Phồn thể converter so the first lookup is in the right script.
  useEffect(() => {
    if (query && ready) void lookup(query.text, conv);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lookup() only reads its arguments
  }, [query, conv, ready]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setQuery({ text: input });
  }

  function lookupWord(word: string) {
    const text = conv.toShown(word);
    setInput(text);
    setQuery({ text });
    window.scrollTo({ top: 0 });
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="section">
          <div className="container-page">
            <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{t.title}</h1>
            <p className="mt-4 text-lg text-ink-700">{t.subtitle}</p>
            <SpeechToggle prominent className="mt-5" />

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
              {tooLong && (
                <p className="mt-3 text-sm text-ink-700">
                  {t.tooLong}{" "}
                  <a href={href("/tools/reader")} className="font-medium text-brand-700 underline-offset-4 hover:underline">
                    {t.openReader} →
                  </a>
                </p>
              )}
              {!ready && !failed && <p className="mt-3 text-sm text-ink-500">{dict.script.loading}</p>}
            </form>

            {card && !tooLong && <LookupResult card={card} conv={conv} onLookup={lookupWord} />}

            <p className="mt-8 text-xs text-ink-500">{t.credits}</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
