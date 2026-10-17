/** A non-blank input line; `idx` is its original 1-based line number. */
export type Sentence = {
  idx: number;
  text: string;
};

/** One line of the ordered output. */
export type OutputRow = {
  idx: number;
  text: string;
  /** Words in this sentence that are not yet known. */
  newWords: string[];
};
