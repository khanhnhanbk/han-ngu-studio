"use client";

import { useDictionary } from "@/lib/i18n/useLocale";
import { LETTERS, orderedSentence } from "@/lib/quiz/export";
import type { Question } from "@/lib/quiz/types";

/**
 * The worksheet window.print() puts on paper: numbered questions, then the
 * answer key on a new page. Hidden on screen.
 */
export function PrintSheet({ questions }: { questions: readonly Question[] }) {
  const dict = useDictionary();
  return (
    <div className="quiz-print hidden text-ink-900 print:block">
      <h1 className="text-2xl font-bold">{dict.quiz.printTitle}</h1>
      <p className="mt-2 text-sm">{dict.quiz.printName}</p>

      <ol className="mt-6 space-y-5">
        {questions.map((q, i) => (
          <li key={i} className="break-inside-avoid">
            <p className="text-sm text-ink-700">
              {i + 1}. {q.kind === "ordering" ? dict.quiz.printOrdering : dict.quiz.prompts[q.kind]}
            </p>
            {q.kind === "ordering" ? (
              <>
                <p className="mt-1 text-sm">
                  {dict.quiz.hintLabel}: {q.hint}
                </p>
                <p className="hanzi mt-1 text-xl">
                  {q.tokens.join(" / ")} {q.end}
                </p>
                <p className="mt-3 border-b border-ink-900/40" />
              </>
            ) : (
              <>
                <p className="hanzi mt-1 text-xl">{q.prompt}</p>
                {q.hint && (
                  <p className="mt-1 text-sm">
                    {dict.quiz.hintLabel}: {q.hint}
                  </p>
                )}
                <ol className="mt-1 grid grid-cols-2 gap-x-6 gap-y-1">
                  {q.options.map((o, n) => (
                    <li key={n} className="hanzi">
                      {LETTERS[n]}. {o}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </li>
        ))}
      </ol>

      <div className="break-before-page">
        <h2 className="pt-6 text-xl font-bold">{dict.quiz.answerKey}</h2>
        <ol className="mt-4 columns-2 gap-8 text-sm">
          {questions.map((q, i) => (
            <li key={i} className="hanzi break-inside-avoid">
              {i + 1}. {q.kind === "ordering" ? orderedSentence(q) : `${LETTERS[q.answer]}. ${q.options[q.answer]}`}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
