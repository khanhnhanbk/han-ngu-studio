"use client";

import { useEffect, useMemo, useState } from "react";

import { FileInput } from "@/components/FileInput";
import { Footer } from "@/components/Footer";
import { DownloadIcon } from "@/components/icons/download";
import { PrinterIcon } from "@/components/icons/printer";
import { IconButton } from "@/components/icons/trigger";
import { Navbar } from "@/components/Navbar";
import { OrderCard } from "@/components/quiz/OrderCard";
import { PrintSheet } from "@/components/quiz/PrintSheet";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { loadMeanings, MEANINGS_FILE } from "@/lib/anki/load";
import { confirmDownload } from "@/lib/data/budget";
import { exampleFiles, loadExamples } from "@/lib/examples/load";
import { downloadText } from "@/lib/download";
import { HANVIET_FILE, loadHanviet } from "@/lib/hanviet/load";
import { useDictionary } from "@/lib/i18n/useLocale";
import { buildQuiz, isCorrect, MAX_ENTRIES, parseEntries, reshuffle } from "@/lib/quiz/build";
import { orderedSentence, printText, toTsv } from "@/lib/quiz/export";
import { ensurePrintFonts } from "@/lib/quiz/printFonts";
import { createRng, randomSeed } from "@/lib/quiz/rng";
import { showQuestion, showSkipped, simpEntries } from "@/lib/quiz/script";
import { KINDS, ORDERS, type Question, type QuizKind, type QuizOrder, type Response, type Skipped } from "@/lib/quiz/types";
import { parseWordsHash } from "@/lib/reader/handoff";
import { useConverter } from "@/lib/script/useScript";
import { loadTokenizer, TOKENIZER_FILES } from "@/lib/segment/load";
import { loadVocab, VOCAB_FILE } from "@/lib/vocab/load";

const SAMPLE = "大学\n学习\n朋友\n喜欢\n电脑\n老师\n医生\n苹果";

type Phase = "setup" | "playing" | "done";

/** What the learner answered, as text for the results list. */
function responseText(q: Question, r: Response): string {
  if (q.kind === "ordering") return Array.isArray(r) ? r.join("") + q.end : "";
  return typeof r === "number" ? q.options[r] : "";
}

function answerText(q: Question): string {
  return q.kind === "ordering" ? orderedSentence(q) : q.options[q.answer];
}

export default function QuizPage() {
  const dict = useDictionary();
  const [text, setText] = useState(SAMPLE);
  // Words sent from another tool (Đọc hiểu) as #words=…; the hash never leaves the device.
  useEffect(() => {
    const words = parseWordsHash(window.location.hash);
    if (words.length) setText(words.join("\n"));
  }, []);
  const [kinds, setKinds] = useState<Set<QuizKind>>(() => new Set(KINDS));
  const [order, setOrder] = useState<QuizOrder>("random");
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Array<Response | null>>([]);
  const [index, setIndex] = useState(0);
  const [skipped, setSkipped] = useState<Skipped[]>([]);
  const [duplicates, setDuplicates] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [printing, setPrinting] = useState(false);
  const { conv, ready, failed } = useConverter();

  const { entries } = useMemo(() => parseEntries(text), [text]);
  const tooMany = entries.length > MAX_ENTRIES;

  const current = questions[index];
  const currentResponse = responses[index] ?? null;
  const score = questions.filter((q, i) => isCorrect(q, responses[i] ?? null)).length;
  // "Dừng bài" ends early: the score counts only the questions answered.
  const answered = responses.filter((r) => r !== null).length;
  const wrong = questions.filter((q, i) => responses[i] != null && !isCorrect(q, responses[i] ?? null));

  function start(next: Question[]) {
    setQuestions(next);
    setResponses(next.map(() => null));
    setIndex(0);
    setPhase("playing");
  }

  async function handleBuild() {
    setError("");
    const parsed = parseEntries(text);
    if (parsed.entries.length === 0) return setError(dict.quiz.error);
    if (parsed.entries.length > MAX_ENTRIES) return setError(dict.quiz.tooMany);
    const picked = KINDS.filter((k) => kinds.has(k));
    if (picked.length === 0) return setError(dict.quiz.noKinds);

    setLoading(true);
    try {
      // Built from Simplified data, then shown in the chosen script. A quiz in
      // progress keeps its script, so answers already given stay valid.
      const entries = simpEntries(conv, parsed.entries);
      const words = entries.map((e) => e.word);
      const files = [...TOKENIZER_FILES, HANVIET_FILE, MEANINGS_FILE, VOCAB_FILE, ...(await exampleFiles(words))];
      if (!(await confirmDownload(files))) return setError(dict.download.declined);
      const [tokenizer, hanviet, meanings, examples, vocab] = await Promise.all([
        loadTokenizer(),
        loadHanviet(),
        loadMeanings(),
        loadExamples(words),
        loadVocab(),
      ]);
      const quiz = buildQuiz(
        { tokenizer, hanviet, meanings, examples, vocab },
        entries,
        picked,
        createRng(randomSeed()),
        order,
      );
      setSkipped(quiz.skipped.map((x) => showSkipped(x, conv)));
      setDuplicates(parsed.duplicates + parsed.entries.length - entries.length);
      if (quiz.questions.length === 0) setError(dict.quiz.noQuestions);
      else start(quiz.questions.map((q) => showQuestion(q, conv)));
    } catch {
      setError(dict.quiz.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!/\.(txt|tsv)$/i.test(file.name)) return setError(dict.quiz.badFile);
    setText(await file.text());
  }

  function respond(r: Response) {
    setResponses((prev) => prev.map((c, n) => (n === index && c === null ? r : c)));
  }

  function advance() {
    if (index + 1 < questions.length) setIndex(index + 1);
    else setPhase("done");
  }

  function toggleKind(k: QuizKind) {
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  // Keys 1–4 pick an option; Enter goes on once the question is answered.
  useEffect(() => {
    if (phase !== "playing" || !current) return;
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select, button")) return;
      const n = Number(e.key);
      if (currentResponse === null && current.kind !== "ordering") {
        if (Number.isInteger(n) && n >= 1 && n <= current.options.length) {
          setResponses((prev) => prev.map((c, i) => (i === index ? n - 1 : c)));
        }
      } else if (currentResponse !== null && e.key === "Enter") {
        e.preventDefault();
        if (index + 1 < questions.length) setIndex(index + 1);
        else setPhase("done");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, current, currentResponse, index, questions.length]);

  const sheetText = useMemo(
    () =>
      printText(questions, [
        dict.quiz.printTitle,
        dict.quiz.printName,
        dict.quiz.printOrdering,
        dict.quiz.hintLabel,
        dict.quiz.answerKey,
        ...Object.values(dict.quiz.prompts),
      ]),
    [questions, dict],
  );

  // Fetch the worksheet's fonts as soon as there is a quiz, so Ctrl+P prints
  // with them too (beforeprint cannot wait for an async load).
  useEffect(() => {
    if (questions.length > 0) void ensurePrintFonts(sheetText);
  }, [questions, sheetText]);

  async function handlePrint() {
    setPrinting(true);
    try {
      await ensurePrintFonts(sheetText);
      window.print();
    } finally {
      setPrinting(false);
    }
  }

  const exportButtons = (
    <div className="flex flex-wrap gap-3">
      <IconButton icon={PrinterIcon} className="btn-secondary" disabled={printing} onClick={handlePrint}>
        {dict.quiz.print}
      </IconButton>
      <IconButton
        icon={DownloadIcon}
        className="btn-secondary"
        onClick={() => downloadText(toTsv(questions, dict.quiz.kinds), "trac_nghiem.tsv", "text/tab-separated-values")}
      >
        {dict.quiz.download}
      </IconButton>
    </div>
  );

  return (
    <>
      <Navbar />
      <main>
        <section className="section print:p-0">
          <div className="container-page print:max-w-none print:p-0">
            <div className="print:hidden">
              <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{dict.quiz.title}</h1>
              <p className="mt-4 text-lg text-ink-700">{dict.quiz.subtitle}</p>

              {phase === "setup" && (
                <div className="card mt-8">
                  <textarea
                    className="hanzi w-full resize-y rounded-lg border border-ink-900/10 p-4 text-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    rows={8}
                    value={text}
                    placeholder={dict.quiz.placeholder}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <div className="mt-2 flex items-center justify-between text-sm text-ink-700/70">
                    <span>
                      {dict.quiz.wordCount}: {entries.length} / {MAX_ENTRIES}
                    </span>
                    {tooMany && <span className="text-red-600">{dict.quiz.tooMany}</span>}
                  </div>
                  <p className="mt-2 text-sm text-ink-700">{dict.quiz.meaningNote}</p>

                  <div className="mt-4 grid gap-4 text-sm text-ink-700 sm:grid-cols-3">
                    <FileInput label={dict.quiz.upload} accept=".txt,.tsv" onFile={handleFile} />
                  </div>

                  <fieldset className="mt-6 text-sm text-ink-700">
                    <legend className="font-medium">{dict.quiz.kindsLabel}</legend>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                      {KINDS.map((k) => (
                        <label key={k} className="flex items-center gap-2">
                          <input type="checkbox" checked={kinds.has(k)} onChange={() => toggleKind(k)} />
                          {dict.quiz.kinds[k]}
                        </label>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-ink-700/70">{dict.quiz.kindsNote}</p>
                  </fieldset>

                  <fieldset className="mt-6 text-sm text-ink-700">
                    <legend className="font-medium">{dict.quiz.orderLabel}</legend>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
                      {ORDERS.map((o) => (
                        <label key={o} className="flex items-center gap-2">
                          <input type="radio" name="quiz-order" checked={order === o} onChange={() => setOrder(o)} />
                          {dict.quiz.orders[o]}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className="mt-6">
                    <button type="button" className="btn-primary" onClick={handleBuild} disabled={loading || !ready}>
                      {loading ? dict.quiz.loading : dict.quiz.button}
                    </button>
                  </div>

                  {!ready && !failed && <p className="mt-4 text-sm text-ink-500">{dict.script.loading}</p>}
                  {failed && <p className="mt-4 text-sm text-red-600">{dict.script.loadFailed}</p>}

                  {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
                  <p className="mt-6 text-xs text-ink-700/70">{dict.quiz.credits}</p>
                </div>
              )}

              {phase === "playing" && current && (
                <div className="mx-auto mt-8 max-w-2xl">
                  {exportButtons}
                  <div className="card mt-4">
                    <div className="flex items-center justify-between text-sm text-ink-700">
                      <span>
                        {dict.quiz.progress
                          .replace("{n}", String(index + 1))
                          .replace("{total}", String(questions.length))}
                      </span>
                      <button type="button" className="underline hover:text-ink-900" onClick={() => setPhase("done")}>
                        {dict.quiz.quit}
                      </button>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-50">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all"
                        style={{ width: `${(index / questions.length) * 100}%` }}
                      />
                    </div>

                    <div className="mt-6">
                      {current.kind === "ordering" ? (
                        <OrderCard
                          key={index}
                          question={current}
                          response={Array.isArray(currentResponse) ? currentResponse : null}
                          onSubmit={respond}
                        />
                      ) : (
                        <QuestionCard
                          key={index}
                          question={current}
                          chosen={typeof currentResponse === "number" ? currentResponse : null}
                          onChoose={respond}
                        />
                      )}
                    </div>

                    {currentResponse !== null && (
                      <div className="mt-6 flex justify-end">
                        <button type="button" className="btn-primary" onClick={advance}>
                          {index + 1 < questions.length ? dict.quiz.next : dict.quiz.finish}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {phase === "done" && (
                <div className="card mx-auto mt-8 max-w-2xl">
                  <h2 className="text-2xl font-bold text-ink-900">{dict.quiz.resultTitle}</h2>
                  <p className="mt-2 text-lg text-ink-700">
                    {dict.quiz.score.replace("{n}", String(score)).replace("{total}", String(answered))}
                  </p>

                  {wrong.length === 0 ? (
                    <p className="mt-4 font-medium text-emerald-600">{dict.quiz.perfect}</p>
                  ) : (
                    <div className="mt-6">
                      <h3 className="font-semibold text-ink-900">{dict.quiz.wrongTitle}</h3>
                      <ul className="mt-3 divide-y divide-ink-900/5 rounded-lg border border-ink-900/10 text-sm">
                        {questions.map((q, i) => {
                          const r = responses[i];
                          if (r == null || isCorrect(q, r)) return null;
                          return (
                            <li key={i} className="px-4 py-3">
                              <p className="text-ink-700">
                                {dict.quiz.kinds[q.kind]}:{" "}
                                <span className="hanzi font-medium text-ink-900">
                                  {q.kind === "ordering" ? q.hint : q.prompt}
                                </span>
                              </p>
                              <p className="mt-1">
                                <span className="text-red-600">
                                  ✗ {dict.quiz.yourAnswer}: <span className="hanzi">{responseText(q, r)}</span>
                                </span>
                                <span className="mx-2 text-ink-700/50">·</span>
                                <span className="text-emerald-600">
                                  ✓ {dict.quiz.rightAnswer}: <span className="hanzi">{answerText(q)}</span>
                                </span>
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    {wrong.length > 0 && (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => start(reshuffle(wrong, createRng(randomSeed()), order))}
                      >
                        {dict.quiz.retryWrong}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => start(reshuffle(questions, createRng(randomSeed()), order))}
                    >
                      {dict.quiz.reshuffle}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setPhase("setup")}>
                      {dict.quiz.edit}
                    </button>
                  </div>
                  <div className="mt-6 border-t border-ink-900/5 pt-6">{exportButtons}</div>
                </div>
              )}

              {phase !== "setup" && (skipped.length > 0 || duplicates > 0) && (
                <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-ink-700">
                  {skipped.length > 0 && (
                    <>
                      <p className="font-semibold text-ink-900">{dict.quiz.skippedTitle}</p>
                      {KINDS.map((k) => {
                        const words = skipped.filter((s) => s.kind === k).map((s) => s.word);
                        if (words.length === 0) return null;
                        return (
                          <p key={k} className="mt-1">
                            {dict.quiz.kinds[k]}: <span className="hanzi">{words.join("、")}</span>
                          </p>
                        );
                      })}
                      <p className="mt-2 text-xs">{dict.quiz.skippedHint}</p>
                    </>
                  )}
                  {duplicates > 0 && (
                    <p className="mt-1">{dict.quiz.duplicates.replace("{n}", String(duplicates))}</p>
                  )}
                </div>
              )}
            </div>

            {phase !== "setup" && <PrintSheet questions={questions} />}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
