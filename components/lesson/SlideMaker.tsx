"use client";

import { useEffect, useState } from "react";

import { FileInput } from "@/components/FileInput";
import { DownloadIcon } from "@/components/icons/download";
import { IconButton } from "@/components/icons/trigger";
import { buildDeck, EXAMPLE_SEPARATOR } from "@/lib/anki/buildDeck";
import { loadMeanings, loadWubi, MEANINGS_FILE, WUBI_FILE } from "@/lib/anki/load";
import { showRow, simpWords } from "@/lib/anki/script";
import { confirmDownload } from "@/lib/data/budget";
import { downloadBytes } from "@/lib/download";
import { exampleFiles, loadExamples, loadSentencesWith } from "@/lib/examples/load";
import { HANVIET_FILE, loadHanviet } from "@/lib/hanviet/load";
import { useDictionary } from "@/lib/i18n/useLocale";
import { convertLine } from "@/lib/pinyin/convert";
import type { WordEntry } from "@/lib/lesson/paste";
import { briefMeaning } from "@/lib/lesson/table";
import { useConverter } from "@/lib/script/useScript";
import { loadTokenizer, TOKENIZER_FILES } from "@/lib/segment/load";
import { collocations } from "@/lib/slides/collocations";
import { fillTemplate, LESSON_FIELDS, WORD_FIELDS, type SlideWord } from "@/lib/slides/fill";
import { groupFitted, type FitNote } from "@/lib/slides/fit";
import { loadVocab, VOCAB_FILE } from "@/lib/vocab/load";

const BUILT_IN = ["the-tu", "hoi-dap", "ba-trang"] as const;
type Choice = (typeof BUILT_IN)[number] | "own";

const PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

/** A file name from the lesson name ("Bài 5: 你好" → "Bài 5 你好.pptx"). */
const fileName = (name: string) => `${name.replace(/[\\/:*?"<>|\t\r\n]+/g, " ").trim() || "slide"}.pptx`;

/**
 * Slides for the lesson: a built-in template or the teacher's own .pptx with
 * {{field}} placeholders, filled in the browser (lib/slides/fill.ts). The
 * teacher's file is read on the device and never sent anywhere.
 */
export function SlideMaker({
  words,
  entries,
  lessonName,
}: {
  words: readonly string[];
  /** The teacher's own Pinyin / meaning per word; they win over the dictionary. */
  entries: readonly WordEntry[];
  lessonName: string;
}) {
  const dict = useDictionary();
  const t = dict.lesson.slides;
  const { conv } = useConverter();
  const [choice, setChoice] = useState<Choice>("the-tu");
  const [own, setOwn] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [fitted, setFitted] = useState<FitNote[]>([]);
  /** A finished deck held back until the teacher has read the list of shrunk text. */
  const [pending, setPending] = useState<{ bytes: Uint8Array; slides: number; unknown: string[] } | null>(null);

  // A held deck is for the words and template it was made from.
  useEffect(() => {
    setPending(null);
    setFitted([]);
  }, [choice, own, words, entries, lessonName]);

  async function readOwn(file: File | undefined) {
    setError("");
    setDone("");
    if (!file) return setOwn(null);
    setOwn({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
    setChoice("own");
  }

  async function builtIn(id: (typeof BUILT_IN)[number]): Promise<Uint8Array> {
    const res = await fetch(`/templates/${id}.pptx`);
    if (!res.ok) throw new Error(String(res.status));
    return new Uint8Array(await res.arrayBuffer());
  }

  async function slideWords(): Promise<SlideWord[] | null> {
    const simp = simpWords(conv, [...words]);
    const files = [...TOKENIZER_FILES, HANVIET_FILE, MEANINGS_FILE, WUBI_FILE, VOCAB_FILE, ...(await exampleFiles(simp))];
    if (!(await confirmDownload(files))) {
      setError(dict.download.declined);
      return null;
    }
    const [tokenizer, hanviet, meanings, examples, wubi, vocab, sentences] = await Promise.all([
      loadTokenizer(),
      loadHanviet(),
      loadMeanings(),
      loadExamples(simp),
      loadWubi(),
      loadVocab(),
      loadSentencesWith(simp),
    ]);
    // "打扫干净 (dǎsǎo gānjìng)": the phrase as shown (Giản/Phồn) with its Pinyin.
    const phrase = (p: string | undefined) =>
      p ? `${conv.toShown(p)} (${convertLine(tokenizer, p, { toneStyle: "mark", spacing: "word" }).text})` : "";
    const mine = new Map(entries.map((e) => [conv.toSimp(e.word), e]));
    // Three examples: {{vidu}} is the easiest one (as before), {{vidu2}} and {{vidu3}} the next ones.
    return buildDeck({ tokenizer, hanviet, meanings, examples, wubi, vocab }, simp, 3, dict.vocab.pos).map((d) => {
      const r = showRow(d, conv, wubi);
      const e = mine.get(d.word);
      const [vidu = "", vidu2 = "", vidu3 = ""] = r.sentence.split(EXAMPLE_SEPARATOR);
      const [viduPinyin = "", vidu2Pinyin = "", vidu3Pinyin = ""] = r.sentence_pinyin.split(EXAMPLE_SEPARATOR);
      const [viduNghia = "", vidu2Nghia = "", vidu3Nghia = ""] = r.sentence_meaning.split(EXAMPLE_SEPARATOR);
      const phrases = collocations(tokenizer, vocab, d.word, Object.hasOwn(sentences, d.word) ? sentences[d.word] : []);
      return {
        chu: r.word,
        pinyin: e?.pinyin || r.pinyin,
        hanviet: r.hanviet,
        nghia: e?.meaning || briefMeaning(r.meaning_vi || r.meaning),
        vidu,
        vidu_pinyin: viduPinyin,
        vidu_nghia: viduNghia,
        vidu2,
        vidu2_pinyin: vidu2Pinyin,
        vidu2_nghia: vidu2Nghia,
        vidu3,
        vidu3_pinyin: vidu3Pinyin,
        vidu3_nghia: vidu3Nghia,
        cumtu: phrase(phrases[0]),
        cumtu2: phrase(phrases[1]),
        hsk: r.hsk_level,
      };
    });
  }

  function save(deck: { bytes: Uint8Array; slides: number; unknown: string[] }) {
    downloadBytes(deck.bytes, fileName(lessonName), PPTX);
    setPending(null);
    setDone(
      t.done.replace("{n}", String(deck.slides)) +
        (deck.unknown.length ? " " + t.unknown.replace("{fields}", deck.unknown.map((f) => `{{${f}}}`).join(", ")) : ""),
    );
  }

  async function make() {
    setError("");
    setDone("");
    setFitted([]);
    setPending(null);
    if (words.length === 0) return setError(dict.lesson.noWords);
    if (choice === "own" && !own) return setError(t.pickFile);
    setBusy(true);
    try {
      const template = choice === "own" ? own!.bytes : await builtIn(choice);
      const list = await slideWords();
      if (!list) return;
      const res = fillTemplate(template, list, lessonName);
      if (!res.ok) return setError(t.errors[res.error]);
      const deck = { bytes: res.bytes, slides: res.slides, unknown: res.unknown };
      const notes = groupFitted(res.fitted);
      setFitted(notes);
      // Text had to be made smaller: show which first, the teacher downloads after reading.
      if (notes.length > 0) setPending(deck);
      else save(deck);
    } catch {
      setError(dict.lesson.loadFailed);
    } finally {
      setBusy(false);
    }
  }

  async function downloadTemplate() {
    setError("");
    // With "Mẫu của tôi" picked, the word-card template is the starting point to edit.
    const id = choice === "own" ? "the-tu" : choice;
    try {
      downloadBytes(await builtIn(id), `${t.templates[id].name}.pptx`, PPTX);
    } catch {
      setError(dict.lesson.loadFailed);
    }
  }

  const options: Choice[] = [...BUILT_IN, "own"];

  return (
    <div>
      <p className="max-w-3xl text-ink-700">{t.intro}</p>

      <fieldset className="mt-6">
        <legend className="font-medium text-ink-900">{t.choose}</legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {options.map((id) => {
            const info = id === "own" ? t.own : t.templates[id];
            const active = choice === id;
            return (
              <label
                key={id}
                className={`flex h-full cursor-pointer flex-col gap-2 rounded-2xl border bg-surface p-4 transition ${
                  active ? "border-brand-600 ring-2 ring-brand-600/30" : "border-ink-900/10 hover:border-ink-900/30"
                }`}
              >
                <span className="flex items-center gap-2 font-semibold text-ink-900">
                  <input
                    type="radio"
                    name="slide-template"
                    className="accent-brand-600"
                    checked={active}
                    onChange={() => setChoice(id)}
                  />
                  {info.name}
                </span>
                <span className="text-sm text-ink-700">{info.description}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {choice === "own" && (
        <div className="mt-4 max-w-md">
          <FileInput buttonLabel={t.upload} accept=".pptx" onFile={(f) => void readOwn(f)} showName={false} fullWidth />
          <p className="mt-1 text-sm text-ink-500">{own ? own.name : t.ownHint}</p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <IconButton
          icon={DownloadIcon}
          className={`${pending ? "btn-secondary" : "btn-primary"} px-3 py-2 text-sm`}
          disabled={busy}
          onClick={() => void make()}
        >
          {busy ? t.making : t.make}
        </IconButton>
        <IconButton icon={DownloadIcon} className="btn-secondary px-3 py-2 text-sm" onClick={() => void downloadTemplate()}>
          {t.getTemplate}
        </IconButton>
      </div>
      {done && <p className="mt-3 text-sm text-ink-900">{done}</p>}
      {fitted.length > 0 && (
        <div className="mt-3 max-w-3xl rounded-2xl border border-brand-600/30 bg-surface p-4 text-sm">
          <p className="font-medium text-ink-900">{pending ? t.fittedAsk : t.fitted}</p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-ink-700">
            {fitted.map((n) => (
              <li key={`${n.fields.join(",")}:${n.text}`} className={n.overflow ? "text-red-600" : undefined}>
                {(n.overflow ? t.overflowItem : t.fittedItem)
                  .replace("{text}", n.text)
                  .replace("{field}", n.fields.map((f) => `{{${f}}}`).join(", "))
                  .replace("{pct}", String(Math.round(n.scale * 100)))}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-ink-500">{t.fittedHint}</p>
          {pending && (
            <div className="mt-4 flex flex-wrap gap-2">
              <IconButton icon={DownloadIcon} className="btn-primary px-3 py-2 text-sm" onClick={() => save(pending)}>
                {t.downloadAnyway}
              </IconButton>
              <button
                type="button"
                className="btn-secondary px-3 py-2 text-sm"
                onClick={() => {
                  setPending(null);
                  setFitted([]);
                }}
              >
                {t.fixTemplateFirst}
              </button>
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <details className="mt-8 max-w-3xl rounded-2xl border border-ink-900/10 bg-surface p-4">
        <summary className="cursor-pointer font-medium text-ink-900">{t.howTitle}</summary>
        <ol className="mt-3 list-decimal space-y-1 pl-6 text-sm text-ink-700">
          {t.how.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-900/10 text-ink-500">
                <th className="py-2 pr-4 font-medium">{t.fieldHeader}</th>
                <th className="py-2 font-medium">{t.meaningHeader}</th>
              </tr>
            </thead>
            <tbody>
              {[...WORD_FIELDS, ...LESSON_FIELDS].map((f) => (
                <tr key={f} className="border-b border-ink-900/5">
                  <td className="whitespace-nowrap py-2 pr-4 font-mono text-ink-900">{`{{${f}}}`}</td>
                  <td className="py-2 text-ink-700">{t.fields[f]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-ink-500">{t.privacy}</p>
      </details>
    </div>
  );
}
