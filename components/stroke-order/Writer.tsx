"use client";

import type HanziWriter from "hanzi-writer";
import { useEffect, useRef, useState } from "react";

import { getDictionary } from "@/lib/i18n";
import type { StrokeData } from "@/lib/strokes/types";

const dict = getDictionary("vi");

type Mode = "watch" | "quiz";

const SPEEDS = [
  { value: 0.5, key: "slow" },
  { value: 1, key: "normal" },
  { value: 2, key: "fast" },
] as const;

const MAX_SIZE = 320;

/** Writer colours from the theme tokens, so dark mode and accents apply. */
function themeColors() {
  const css = getComputedStyle(document.documentElement);
  const rgba = (name: string, alpha = 1) =>
    `rgba(${css.getPropertyValue(name).trim().split(/\s+/).join(",")},${alpha})`;
  return {
    strokeColor: rgba("--ink-900"),
    outlineColor: rgba("--ink-500", 0.25),
    highlightColor: rgba("--brand-400"),
    drawingColor: rgba("--brand-600"),
  };
}

type QuizState = { correct: number; mistakes: number; done: boolean };
const QUIZ_START: QuizState = { correct: 0, mistakes: 0, done: false };

/** Animated stroke order and a "write it yourself" quiz (Hanzi Writer). */
export function Writer({ char, data }: { char: string; data: StrokeData }) {
  const box = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const [size, setSize] = useState(0);
  const [mode, setMode] = useState<Mode>("watch");
  const [speed, setSpeed] = useState(1);
  const [outline, setOutline] = useState(true);
  const outlineRef = useRef(outline);
  const [paused, setPaused] = useState(false);
  const [quiz, setQuiz] = useState<QuizState>(QUIZ_START);
  const [quizRun, setQuizRun] = useState(0);

  // Fit the writer to the available width.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize(Math.min(MAX_SIZE, Math.floor(entry.contentRect.width)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // (Re)create the writer. Hanzi Writer is loaded on demand and reads the
  // stroke data we already fetched, so it never calls its CDN.
  useEffect(() => {
    const el = target.current;
    if (!el || size === 0) return;
    let cancelled = false;
    let writer: HanziWriter | null = null;
    setPaused(false);
    setQuiz(QUIZ_START);
    import("hanzi-writer").then(({ default: HW }) => {
      if (cancelled) return;
      el.innerHTML = "";
      writer = HW.create(el, char, {
        width: size,
        height: size,
        padding: Math.round(size * 0.05),
        showOutline: outlineRef.current,
        showCharacter: mode === "watch",
        strokeAnimationSpeed: speed,
        delayBetweenStrokes: 400 / speed,
        charDataLoader: () => data,
        ...themeColors(),
      });
      writerRef.current = writer;
      if (mode === "watch") {
        void writer.animateCharacter();
      } else {
        void writer.quiz({
          showHintAfterMisses: 3,
          onCorrectStroke: (s) =>
            setQuiz({ correct: s.strokeNum + 1, mistakes: s.totalMistakes, done: false }),
          onMistake: (s) => setQuiz((q) => ({ ...q, mistakes: s.totalMistakes })),
          onComplete: (s) =>
            setQuiz((q) => ({ ...q, mistakes: s.totalMistakes, done: true })),
        });
      }
    });
    return () => {
      cancelled = true;
      if (writer) {
        writer.cancelQuiz();
        void writer.pauseAnimation();
      }
      writerRef.current = null;
      el.innerHTML = "";
    };
  }, [char, data, mode, speed, size, quizRun]);

  // Follow theme changes (dark mode, accent) without restarting.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const writer = writerRef.current;
      if (!writer) return;
      for (const [name, value] of Object.entries(themeColors())) {
        void writer.updateColor(name as keyof ReturnType<typeof themeColors>, value);
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-accent"],
    });
    return () => observer.disconnect();
  }, []);

  function toggleOutline() {
    const next = !outline;
    outlineRef.current = next;
    setOutline(next);
    const writer = writerRef.current;
    if (writer) void (next ? writer.showOutline() : writer.hideOutline());
  }

  function play(loop: boolean) {
    const writer = writerRef.current;
    if (!writer) return;
    setPaused(false);
    void (loop ? writer.loopCharacterAnimation() : writer.animateCharacter());
  }

  function togglePause() {
    const writer = writerRef.current;
    if (!writer) return;
    void (paused ? writer.resumeAnimation() : writer.pauseAnimation());
    setPaused(!paused);
  }

  const t = dict.strokeOrder;
  const tab = (active: boolean) =>
    "rounded-lg px-3 py-1.5 text-sm font-medium transition " +
    (active
      ? "bg-brand-600 text-on-brand"
      : "text-ink-700 hover:bg-brand-50 hover:text-brand-700");

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-1 rounded-xl border border-ink-900/10 p-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "watch"}
          className={tab(mode === "watch")}
          onClick={() => setMode("watch")}
        >
          {t.watch}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "quiz"}
          className={tab(mode === "quiz")}
          onClick={() => setMode("quiz")}
        >
          {t.quiz}
        </button>
      </div>

      <div ref={box} className="w-full max-w-[320px]">
        <div
          className="relative mx-auto touch-none rounded-lg border-2 border-brand-600/70 bg-surface"
          style={{ width: size || undefined, height: size || undefined }}
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full stroke-brand-600/30"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <g strokeWidth={0.4} strokeDasharray="2 2" vectorEffect="non-scaling-stroke">
              <line x1={0} y1={50} x2={100} y2={50} />
              <line x1={50} y1={0} x2={50} y2={100} />
              <line x1={0} y1={0} x2={100} y2={100} />
              <line x1={0} y1={100} x2={100} y2={0} />
            </g>
          </svg>
          <div ref={target} className="relative" />
        </div>
      </div>

      {mode === "watch" ? (
        <div className="flex flex-col items-center gap-3">
          {/* One line at any width: tighter padding, and the pause button
              keeps the width of its longer label when it toggles. */}
          <div className="flex flex-nowrap justify-center gap-2">
            <button type="button" className="btn-primary whitespace-nowrap px-3" onClick={() => play(false)}>
              {t.play}
            </button>
            <button type="button" className="btn-secondary whitespace-nowrap px-3" onClick={() => play(true)}>
              {t.loop}
            </button>
            <button type="button" className="btn-secondary whitespace-nowrap px-3" onClick={togglePause}>
              <span className="grid">
                <span className={`col-start-1 row-start-1 ${paused ? "invisible" : ""}`} aria-hidden={paused}>
                  {t.pause}
                </span>
                <span className={`col-start-1 row-start-1 ${paused ? "" : "invisible"}`} aria-hidden={!paused}>
                  {t.resume}
                </span>
              </span>
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            {t.speed}
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="rounded-lg border border-ink-900/10 bg-surface px-2 py-1.5"
            >
              {SPEEDS.map((s) => (
                <option key={s.key} value={s.value}>
                  {t.speeds[s.key]}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-ink-700" aria-live="polite">
            {quiz.done
              ? t.quizDone.replace("{mistakes}", String(quiz.mistakes))
              : t.quizProgress
                  .replace("{done}", String(quiz.correct))
                  .replace("{total}", String(data.strokes.length))
                  .replace("{mistakes}", String(quiz.mistakes))}
          </p>
          <p className="text-xs text-ink-500">{t.quizHint}</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setQuizRun((n) => n + 1)}
          >
            {t.restart}
          </button>
        </div>
      )}

      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" checked={outline} onChange={toggleOutline} />
        {t.showOutline}
      </label>
    </div>
  );
}
