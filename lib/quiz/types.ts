/** Question types, in the order the page lists them. */
export const KINDS = [
  "hanToMeaning",
  "meaningToHan",
  "hanToPinyin",
  "hanToHanviet",
  "cloze",
  "ordering",
] as const;
export type QuizKind = (typeof KINDS)[number];
export type ChoiceKind = Exclude<QuizKind, "ordering">;

/** Question order: all mixed, or grouped by type in KINDS order. */
export const ORDERS = ["random", "byKind"] as const;
export type QuizOrder = (typeof ORDERS)[number];

/** One line of input: a word, optionally followed by Tab and the user's own meaning. */
export type QuizEntry = { word: string; meaning?: string };

/** Pick one of 2–4 options. */
export type ChoiceQuestion = {
  kind: ChoiceKind;
  word: string;
  /** The word, a meaning, or (cloze) the sentence with the word blanked as "＿＿". */
  prompt: string;
  /** Cloze only: the sentence's translation, which settles which option fits. */
  hint?: string;
  options: string[];
  /** Index of the correct option. */
  answer: number;
};

/** Put a sentence's words back in order. */
export type OrderQuestion = {
  kind: "ordering";
  word: string;
  /** The sentence's translation. */
  hint: string;
  /** The words in shuffled order (never the original order). */
  tokens: string[];
  /** Trailing punctuation, shown fixed at the end ("。"). */
  end: string;
  /** The words in the original order. */
  answer: string[];
};

export type Question = ChoiceQuestion | OrderQuestion;

/** What the learner picked: an option index, or the words in their order. */
export type Response = number | string[];

/** A word left out of one question type: no data, or no distinct wrong answer. */
export type Skipped = { word: string; kind: QuizKind };
