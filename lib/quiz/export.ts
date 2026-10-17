import type { Question, QuizKind } from "./types";

export const LETTERS = ["A", "B", "C", "D"] as const;

/** The sentence an ordering question rebuilds, with its end punctuation. */
export function orderedSentence(q: Extract<Question, { kind: "ordering" }>): string {
  return q.answer.join("") + q.end;
}

/**
 * TSV for spreadsheets and quiz apps (Quizizz, Kahoot… after a column
 * check): type, question, hint, A–D, answer. An ordering question lists its
 * shuffled words in "question" and the full sentence as the answer. Tabs and
 * line breaks inside a field become spaces so each question stays one row.
 */
export function toTsv(questions: readonly Question[], kindLabels: Record<QuizKind, string>): string {
  const clean = (s: string) => s.replace(/[\t\r\n]+/g, " ");
  const rows = [["type", "question", "hint", "A", "B", "C", "D", "answer"]];
  for (const q of questions) {
    if (q.kind === "ordering") {
      rows.push([kindLabels[q.kind], `${q.tokens.join(" / ")} ${q.end}`.trim(), q.hint, "", "", "", "", orderedSentence(q)]);
    } else {
      const options = LETTERS.map((_, i) => q.options[i] ?? "");
      rows.push([kindLabels[q.kind], q.prompt, q.hint ?? "", ...options, LETTERS[q.answer]]);
    }
  }
  return rows.map((r) => r.map(clean).join("\t")).join("\n") + "\n";
}
