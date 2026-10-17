"use client";

import { getDictionary } from "@/lib/i18n";
import type { Question } from "@/lib/quiz/types";

const dict = getDictionary("vi");

/** Kinds whose prompt is a Chinese word (the rest show a meaning). */
const HAN_PROMPT = new Set<Question["kind"]>(["hanToMeaning", "hanToPinyin", "hanToHanviet"]);

/**
 * One multiple-choice question. Once an option is chosen the answer is
 * revealed: the right option is marked ✓, a wrong choice ✗.
 */
export function QuestionCard({
  question,
  chosen,
  onChoose,
}: {
  question: Question;
  chosen: number | null;
  onChoose: (index: number) => void;
}) {
  const answered = chosen !== null;
  const hanOptions = question.kind === "meaningToHan";

  return (
    <div>
      <p className="text-sm font-medium text-ink-700">{dict.quiz.prompts[question.kind]}</p>
      <p
        className={`mt-3 text-center text-ink-900 ${
          HAN_PROMPT.has(question.kind) ? "hanzi text-5xl font-semibold" : "text-xl font-medium"
        }`}
      >
        {question.prompt}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {question.options.map((option, i) => {
          const isAnswer = i === question.answer;
          const isChosen = i === chosen;
          let style = "border-ink-900/10 hover:border-brand-500 hover:bg-brand-50";
          if (answered) {
            if (isAnswer) style = "border-emerald-500 bg-emerald-500/10";
            else if (isChosen) style = "border-red-500 bg-red-500/10";
            else style = "border-ink-900/10 opacity-60";
          }
          return (
            <button
              key={option}
              type="button"
              disabled={answered}
              onClick={() => onChoose(i)}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-ink-900 transition ${style}`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-50 text-sm font-semibold text-ink-700">
                {answered && isAnswer ? "✓" : answered && isChosen ? "✗" : i + 1}
              </span>
              <span className={hanOptions ? "hanzi text-2xl" : ""}>{option}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <p
          role="status"
          className={`mt-4 text-sm font-medium ${chosen === question.answer ? "text-emerald-600" : "text-red-600"}`}
        >
          {chosen === question.answer ? dict.quiz.correct : dict.quiz.wrong}
        </p>
      )}
    </div>
  );
}
