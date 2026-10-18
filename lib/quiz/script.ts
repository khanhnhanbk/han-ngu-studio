import { createAligner, type ScriptConverter } from "@/lib/script/convert";

import type { Question, QuizEntry, Skipped } from "./types";

/**
 * Entries for buildQuiz: words go in Simplified (every data file is keyed by
 * Simplified), de-duplicated after conversion. The user's own meanings are
 * kept as typed. Giản thể mode returns the entries unchanged.
 */
export function simpEntries(conv: ScriptConverter, entries: readonly QuizEntry[]): QuizEntry[] {
  if (conv.script === "simp") return [...entries];
  const seen = new Set<string>();
  const out: QuizEntry[] = [];
  for (const e of entries) {
    const word = conv.toSimp(e.word);
    if (seen.has(word)) continue;
    seen.add(word);
    out.push({ ...e, word });
  }
  return out;
}

/** Choice kinds whose prompt / options are Chinese text (the rest are meanings, Pinyin, Hán Việt). */
const HAN_PROMPT = new Set(["hanToMeaning", "hanToPinyin", "hanToHanviet", "cloze"]);
const HAN_OPTIONS = new Set(["meaningToHan", "cloze"]);

/**
 * Show a question built from Simplified data in the chosen script. Hints
 * (translations), meanings, Pinyin and Hán Việt are never converted. An
 * ordering question converts its whole sentence, then slices it back into
 * words, so each word keeps its context (头发 → 頭髮, not 頭發).
 */
export function showQuestion(q: Question, conv: ScriptConverter): Question {
  if (conv.script === "simp") return q;
  const word = conv.toShown(q.word);
  if (q.kind === "ordering") {
    const simp = q.answer.join("") + q.end;
    const take = createAligner(simp, conv.toShown(simp));
    const answer = q.answer.map(take);
    const end = take(q.end);
    // tokens is a shuffle of answer: give each the shown form of a matching word.
    const left = q.answer.map((w, i) => ({ w, shown: answer[i] }));
    const tokens = q.tokens.map((t) => {
      const i = left.findIndex((x) => x.w === t);
      return i < 0 ? conv.toShown(t) : left.splice(i, 1)[0].shown;
    });
    return { ...q, word, answer, end, tokens };
  }
  return {
    ...q,
    word,
    prompt: HAN_PROMPT.has(q.kind) ? conv.toShown(q.prompt) : q.prompt,
    options: HAN_OPTIONS.has(q.kind) ? q.options.map((o) => conv.toShown(o)) : q.options,
  };
}

export function showSkipped(s: Skipped, conv: ScriptConverter): Skipped {
  return conv.script === "simp" ? s : { ...s, word: conv.toShown(s.word) };
}
