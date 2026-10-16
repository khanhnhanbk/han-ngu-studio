import type { StrokeData } from "./types";

/**
 * Hanzi Writer data lives in a 1024-unit box with the y axis pointing up:
 * y = 900 is the top edge and y = -124 the bottom edge.
 */
export const STROKE_BOX = 1024;
const STROKE_TOP = 900;

/** SVG transform that draws stroke paths into a `size` box at (x, y). */
export function strokeTransform(x: number, y: number, size: number): string {
  const s = size / STROKE_BOX;
  return `translate(${x} ${y + STROKE_TOP * s}) scale(${s} ${-s})`;
}

export type StrokeStep = {
  /** Strokes already written before this step. */
  done: string[];
  /** The stroke added in this step. */
  current: string;
};

/** Cumulative stroke-by-stroke steps: step k shows strokes 1..k. */
export function strokeSteps(data: StrokeData): StrokeStep[] {
  return data.strokes.map((current, i) => ({
    done: data.strokes.slice(0, i),
    current,
  }));
}
