"use client";

import { useState } from "react";

import { getDictionary } from "@/lib/i18n";
import { isCorrect } from "@/lib/quiz/build";
import { orderedSentence } from "@/lib/quiz/export";
import type { OrderQuestion } from "@/lib/quiz/types";

const dict = getDictionary("vi");

/**
 * Sentence ordering: tap the shuffled words to build the sentence, tap a
 * placed word to take it back, then check. Shows the right sentence after.
 */
export function OrderCard({
  question,
  response,
  onSubmit,
}: {
  question: OrderQuestion;
  response: string[] | null;
  onSubmit: (tokens: string[]) => void;
}) {
  // Indices into question.tokens, in the order the learner placed them.
  const [placed, setPlaced] = useState<number[]>([]);
  const answered = response !== null;
  const correct = isCorrect(question, response);
  const chip = "hanzi rounded-lg border-2 px-3 py-1.5 text-2xl text-ink-900 transition";

  return (
    <div>
      <p className="text-sm font-medium text-ink-700">{dict.quiz.prompts.ordering}</p>
      <p className="mt-3 text-center text-lg text-ink-900">
        {question.hint}
        {question.machine && <span className="ml-2 inline-block rounded-full bg-ink-900/5 px-2 py-0.5 text-xs text-ink-700">{dict.quiz.machineTag}</span>}
      </p>

      <div
        className={`mt-6 flex min-h-16 flex-wrap items-center gap-2 rounded-xl border-2 border-dashed p-3 ${
          answered ? (correct ? "border-emerald-500 bg-emerald-500/10" : "border-red-500 bg-red-500/10") : "border-ink-900/15"
        }`}
      >
        {placed.length === 0 && <span className="text-sm text-ink-700/70">{dict.quiz.orderPlaceholder}</span>}
        {placed.map((t, i) => (
          <button
            key={`${t}-${i}`}
            type="button"
            disabled={answered}
            onClick={() => setPlaced(placed.filter((_, n) => n !== i))}
            className={`${chip} border-brand-500 bg-brand-50`}
          >
            {question.tokens[t]}
          </button>
        ))}
        {placed.length > 0 && <span className="hanzi text-2xl text-ink-900">{question.end}</span>}
      </div>
      {!answered && placed.length > 0 && <p className="mt-1 text-xs text-ink-700/70">{dict.quiz.orderUndo}</p>}

      {!answered && (
        <div className="mt-4 flex flex-wrap gap-2">
          {question.tokens.map((token, t) =>
            placed.includes(t) ? null : (
              <button
                key={t}
                type="button"
                onClick={() => setPlaced([...placed, t])}
                className={`${chip} border-ink-900/10 bg-surface hover:border-brand-500`}
              >
                {token}
              </button>
            ),
          )}
        </div>
      )}

      {!answered && (
        <div className="mt-6">
          <button
            type="button"
            className="btn-primary"
            disabled={placed.length !== question.tokens.length}
            onClick={() => onSubmit(placed.map((t) => question.tokens[t]))}
          >
            {dict.quiz.check}
          </button>
        </div>
      )}

      {answered && (
        <div role="status" className="mt-4 text-sm">
          <p className={`font-medium ${correct ? "text-emerald-600" : "text-red-600"}`}>
            {correct ? dict.quiz.correct : dict.quiz.orderWrong}
          </p>
          {!correct && (
            <p className="mt-1 text-ink-700">
              {dict.quiz.rightSentence}: <span className="hanzi text-lg text-ink-900">{orderedSentence(question)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
