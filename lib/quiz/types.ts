/** Question types, in the order the page lists them. */
export const KINDS = ["hanToMeaning", "meaningToHan", "hanToPinyin", "hanToHanviet"] as const;
export type QuizKind = (typeof KINDS)[number];

/** One line of input: a word, optionally followed by Tab and the user's own meaning. */
export type QuizEntry = { word: string; meaning?: string };

export type Question = {
  kind: QuizKind;
  word: string;
  prompt: string;
  options: string[];
  /** Index of the correct option. */
  answer: number;
};

/** A word left out of one question type: no data, or no distinct wrong answer. */
export type Skipped = { word: string; kind: QuizKind };
