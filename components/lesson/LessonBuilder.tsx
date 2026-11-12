"use client";

import { useEffect, useMemo, useState } from "react";

import { AnkiTool } from "@/components/anki/AnkiTool";
import { FileInput } from "@/components/FileInput";
import { Footer } from "@/components/Footer";
import { DownloadIcon } from "@/components/icons/download";
import { IconButton } from "@/components/icons/trigger";
import { Navbar } from "@/components/Navbar";
import { PracticeSheetTool } from "@/components/practice-sheet/PracticeSheetTool";
import { QuizTool } from "@/components/quiz/QuizTool";
import { confirmDownload } from "@/lib/data/budget";
import { downloadText } from "@/lib/download";
import { useDictionary } from "@/lib/i18n/useLocale";
import { appendWords, extractWords } from "@/lib/lesson/extract";
import { docxText, entryLine, parseEntries, splitPaste } from "@/lib/lesson/paste";
import {
  lessonsFile,
  mergeLessons,
  newLesson,
  parseLessonsFile,
  readLessons,
  writeLessons,
  type Lesson,
} from "@/lib/lesson/store";
import { useConverter } from "@/lib/script/useScript";
import { loadTokenizer, TOKENIZER_FILES } from "@/lib/segment/load";

import { WordTable } from "./WordTable";

const TABS = ["table", "anki", "quiz", "practiceSheet"] as const;
type Tab = (typeof TABS)[number];

const SAMPLE_TEXT = "A：你好！你叫什么名字？\nB：我叫李明。我是大学生，我喜欢学习汉语。\nA：认识你很高兴！我们做朋友吧。";
const SAMPLE_WORDS = "名字\n大学生\n喜欢\n学习\n汉语\n认识\n高兴\n朋友";

/**
 * Soạn bài: one lesson (name, text, word list) feeds every output, so the
 * teacher types the words once. Lessons live in this browser only
 * (lib/lesson/store.ts); the tools below are the same ones as on their own
 * pages, shown without their page frame.
 */
export function LessonBuilder() {
  const dict = useDictionary();
  const d = dict.lesson;
  const { conv } = useConverter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentId, setCurrentId] = useState<string>("");
  const [tab, setTab] = useState<Tab>("table");
  const [saveFailed, setSaveFailed] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);

  // Load the saved lessons once (SSR-safe); the first visit gets a sample lesson.
  useEffect(() => {
    const saved = readLessons();
    if (saved.length) {
      setLessons(saved);
      setCurrentId(saved[0].id);
      return;
    }
    const sample = {
      ...newLesson(d.sampleName),
      text: SAMPLE_TEXT,
      words: SAMPLE_WORDS,
    };
    setLessons([sample]);
    setCurrentId(sample.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on mount
  }, []);

  const current = lessons.find((l) => l.id === currentId) ?? lessons[0];
  // A word line may carry the teacher's own Pinyin and meaning ("早 zǎo – sớm").
  const entries = useMemo(() => parseEntries(current?.words ?? "").entries, [current?.words]);
  const words = useMemo(() => entries.map((e) => e.word), [entries]);
  // The tools restart with the new words once typing pauses, not on every key.
  const [settledWords, setSettledWords] = useState<string[]>([]);
  const wordsKey = words.join("\n");
  useEffect(() => {
    const timer = window.setTimeout(() => setSettledWords(words), 600);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- wordsKey stands for words
  }, [wordsKey]);
  const toolKey = `${current?.id}:${settledWords.join("|")}`;

  function save(next: Lesson[]) {
    setLessons(next);
    setSaveFailed(!writeLessons(next));
  }

  function update(patch: Partial<Pick<Lesson, "name" | "text" | "words">>) {
    if (!current) return;
    const changed = { ...current, ...patch, updatedAt: Date.now() };
    save(lessons.map((l) => (l.id === current.id ? changed : l)));
  }

  function addLesson() {
    const lesson = newLesson(d.defaultName.replace("{n}", String(lessons.length + 1)));
    save([lesson, ...lessons]);
    setCurrentId(lesson.id);
    setNote("");
  }

  function deleteLesson() {
    if (!current || !window.confirm(d.deleteConfirm.replace("{name}", current.name))) return;
    const rest = lessons.filter((l) => l.id !== current.id);
    const next = rest.length ? rest : [newLesson(d.defaultName.replace("{n}", "1"))];
    save(next);
    setCurrentId(next[0].id);
    setNote("");
  }

  async function restore(file: File | undefined) {
    setNote("");
    if (!file) return;
    const imported = parseLessonsFile(await file.text());
    if (!imported) return setNote(d.restoreBad);
    save(mergeLessons(lessons, imported));
    if (imported[0]) setCurrentId(imported[0].id);
    setNote(d.restoreDone.replace("{n}", String(imported.length)));
  }

  /**
   * "Dán cả bài": sort a whole pasted handout into the lesson text and the
   * word list. Added to what the lesson already has; a new lesson also takes
   * its name from the first line.
   */
  function takePaste(raw: string) {
    if (!current) return;
    const got = splitPaste(raw);
    if (!got.text && got.words.length === 0) {
      setSkipped([]);
      return setNote(d.paste.none);
    }
    const have = new Set(words);
    const added = got.words.filter((e) => !have.has(e.word));
    const fresh = !current.text.trim() && words.length === 0;
    update({
      name: fresh && got.title ? got.title : current.name,
      text: [current.text.trim(), got.text].filter(Boolean).join("\n"),
      words: [current.words.trim(), ...added.map(entryLine)].filter(Boolean).join("\n"),
    });
    setSkipped(got.skipped);
    setNote(
      d.paste.done
        .replace("{w}", String(added.length))
        .replace("{s}", String(got.text ? got.text.split("\n").length : 0))
        .replace("{k}", String(got.skipped.length)),
    );
  }

  async function takeDocx(file: File | undefined) {
    if (!file) return;
    const text = docxText(new Uint8Array(await file.arrayBuffer()));
    if (text === null) {
      setSkipped([]);
      return setNote(d.paste.badFile);
    }
    takePaste(text);
  }

  async function extract() {
    if (!current?.text.trim()) return;
    setNote("");
    setBusy(true);
    try {
      if (!(await confirmDownload(TOKENIZER_FILES))) return setNote(dict.download.declined);
      const tokenizer = await loadTokenizer();
      // The tokenizer works on Simplified text; words are shown in the current script.
      const found = extractWords(tokenizer, conv.toSimp(current.text)).map((w) => conv.toShown(w));
      const merged = appendWords(words, found);
      const added = merged.length - words.length;
      if (added) update({ words: merged.join("\n") });
      setNote(added ? d.extractDone.replace("{n}", String(added)) : d.extractNone);
    } catch {
      setNote(d.loadFailed);
    } finally {
      setBusy(false);
    }
  }

  const field = "w-full rounded-lg border border-ink-900/10 bg-surface p-3 focus:outline-none focus:ring-2 focus:ring-brand-500";

  return (
    <>
      <div className="print:hidden">
        <Navbar />
      </div>
      <main>
        <section className="section print:p-0">
          <div className="container-page print:max-w-none print:p-0">
            <div className="print:hidden">
              <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{d.title}</h1>
              <p className="mt-4 max-w-3xl text-lg text-ink-700">{d.subtitle}</p>

              <div className="mt-8 grid gap-6 lg:grid-cols-[16rem_1fr]">
                <aside className="card h-fit">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold text-ink-900">{d.lessons}</h2>
                    <button type="button" className="btn-primary px-3 py-1.5 text-sm" onClick={addLesson}>
                      + {d.newLesson}
                    </button>
                  </div>
                  <ul className="mt-3 flex max-h-72 flex-col gap-1 overflow-y-auto">
                    {lessons.map((l) => (
                      <li key={l.id}>
                        <button
                          type="button"
                          aria-current={l.id === current?.id ? "true" : undefined}
                          className={`w-full truncate rounded-lg px-3 py-2 text-left text-sm ${
                            l.id === current?.id ? "bg-brand-100 font-semibold text-ink-900" : "text-ink-700 hover:bg-ink-900/5"
                          }`}
                          onClick={() => {
                            setCurrentId(l.id);
                            setNote("");
                            setSkipped([]);
                          }}
                        >
                          {l.name || "—"}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-col gap-2 border-t border-ink-900/10 pt-4 text-sm">
                    <IconButton
                      icon={DownloadIcon}
                      className="btn-secondary justify-center px-3 py-2"
                      onClick={() => downloadText(lessonsFile(lessons), "soan-bai.json", "application/json")}
                    >
                      {d.backup}
                    </IconButton>
                    <FileInput
                      buttonLabel={d.restore}
                      accept=".json,application/json"
                      onFile={restore}
                      showName={false}
                      fullWidth
                    />
                    <p className="text-xs text-ink-700/80">{d.storageNote}</p>
                    {saveFailed && <p className="text-xs text-red-600">{d.saveFailed}</p>}
                  </div>
                </aside>

                {current && (
                  <div className="card min-w-0">
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="font-medium text-ink-900">{d.name}</span>
                        <input className={field} value={current.name} onChange={(e) => update({ name: e.target.value })} />
                      </label>
                      <button type="button" className="btn-secondary px-3 py-3 text-sm text-red-600" onClick={deleteLesson}>
                        {d.delete}
                      </button>
                    </div>

                    <div className="mt-4 rounded-xl border border-dashed border-brand-400 bg-brand-50 p-4">
                      <label className="flex flex-col gap-1">
                        <span className="font-medium text-ink-900">{d.paste.label}</span>
                        <textarea
                          className={`${field} resize-none`}
                          rows={2}
                          value=""
                          placeholder={d.paste.placeholder}
                          onChange={() => undefined}
                          onPaste={(e) => {
                            e.preventDefault();
                            takePaste(e.clipboardData.getData("text/plain"));
                          }}
                        />
                      </label>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <FileInput
                          buttonLabel={d.paste.docx}
                          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onFile={(f) => void takeDocx(f)}
                          showName={false}
                        />
                        <p className="text-sm text-ink-700">{d.paste.hint}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="flex flex-col gap-1">
                        <span className="font-medium text-ink-900">{d.textLabel}</span>
                        <textarea
                          className={`${field} hanzi resize-y text-lg`}
                          rows={8}
                          value={current.text}
                          placeholder={d.textPlaceholder}
                          onChange={(e) => update({ text: e.target.value })}
                        />
                        <button
                          type="button"
                          className="btn-secondary mt-2 w-fit px-3 py-2 text-sm"
                          disabled={busy || !current.text.trim()}
                          onClick={() => void extract()}
                        >
                          {busy ? d.extracting : `${d.extract} →`}
                        </button>
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="flex items-baseline justify-between gap-2 font-medium text-ink-900">
                          {d.wordsLabel}
                          <span className="text-sm font-normal text-ink-500">
                            {d.wordCount.replace("{n}", String(words.length))}
                          </span>
                        </span>
                        <textarea
                          className={`${field} hanzi resize-y text-lg`}
                          rows={8}
                          value={current.words}
                          placeholder={"学习\n朋友 péngyou – bạn bè"}
                          onChange={(e) => update({ words: e.target.value })}
                        />
                      </label>
                    </div>
                    {note && (
                      <p className="mt-3 text-sm text-ink-700" aria-live="polite">
                        {note}
                      </p>
                    )}
                    {skipped.length > 0 && (
                      <details className="mt-2 text-sm text-ink-700">
                        <summary className="cursor-pointer font-medium text-brand-ink">
                          {d.paste.showSkipped.replace("{k}", String(skipped.length))}
                        </summary>
                        <ul className="mt-2 max-h-48 list-disc space-y-1 overflow-y-auto pl-5">
                          {skipped.map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
              </div>

              {current && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-ink-900">{d.outputs}</h2>
                  <div role="tablist" aria-label={d.outputs} className="mt-3 flex flex-wrap gap-2 border-b border-ink-900/10">
                    {TABS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        id={`lesson-tab-${id}`}
                        aria-selected={tab === id}
                        aria-controls="lesson-panel"
                        className={`-mb-px rounded-t-lg border-b-2 px-4 py-2 font-medium ${
                          tab === id ? "border-brand-600 text-ink-900" : "border-transparent text-ink-500 hover:text-ink-900"
                        }`}
                        onClick={() => setTab(id)}
                      >
                        {d.tabs[id]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {current && (
              <div id="lesson-panel" role="tabpanel" aria-labelledby={`lesson-tab-${tab}`} className="mt-6 print:mt-0">
                {/* A new key remounts the tool with the lesson's current words. */}
                {tab === "table" && <WordTable key={current.id} words={words} entries={entries} lessonName={current.name} />}
                {tab === "anki" && <AnkiTool key={toolKey} initialWords={settledWords} embedded />}
                {tab === "quiz" && <QuizTool key={toolKey} initialWords={settledWords} embedded />}
                {tab === "practiceSheet" && <PracticeSheetTool key={toolKey} initialWords={settledWords} embedded />}
              </div>
            )}
          </div>
        </section>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </>
  );
}
