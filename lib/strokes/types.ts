/** One character's stroke data, as shipped by hanzi-writer-data. */
export type StrokeData = {
  /** SVG outline path per stroke, in writing order. */
  strokes: string[];
  /** Centre line of each stroke as [x, y] points (used for animation/quiz). */
  medians: number[][][];
  /** Indices of the strokes that belong to the radical, when known. */
  radStrokes?: number[];
  /**
   * Per stroke, its path in the character's Make Me a Hanzi decomposition
   * (null when unassigned). Added by build-data.mjs; Hanzi Writer ignores it.
   */
  matches?: Array<number[] | null>;
};

export type StrokeShard = Record<string, StrokeData>;
