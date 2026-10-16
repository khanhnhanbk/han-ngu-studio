/** One character's stroke data, as shipped by hanzi-writer-data. */
export type StrokeData = {
  /** SVG outline path per stroke, in writing order. */
  strokes: string[];
  /** Centre line of each stroke as [x, y] points (used for animation/quiz). */
  medians: number[][][];
  /** Indices of the strokes that belong to the radical, when known. */
  radStrokes?: number[];
};

export type StrokeShard = Record<string, StrokeData>;
