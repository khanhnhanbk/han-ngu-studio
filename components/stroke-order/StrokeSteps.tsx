import { strokeSteps, strokeTransform } from "@/lib/strokes/render";
import type { StrokeData } from "@/lib/strokes/types";

const CELL = 100;

/** On-screen stroke-by-stroke diagram: cell k shows strokes 1..k. */
export function StrokeSteps({
  data,
  label,
}: {
  data: StrokeData;
  /** Accessible name for one cell, e.g. "Nét". */
  label: string;
}) {
  return (
    <ol className="flex flex-wrap gap-2">
      {strokeSteps(data).map((step, i) => (
        <li key={i} className="flex flex-col items-center gap-1">
          <svg
            viewBox={`0 0 ${CELL} ${CELL}`}
            className="h-14 w-14 rounded border border-ink-900/15 bg-surface sm:h-16 sm:w-16"
            role="img"
            aria-label={`${label} ${i + 1}`}
          >
            <g className="stroke-ink-500/30" strokeWidth={1} strokeDasharray="3 3">
              <line x1={0} y1={CELL / 2} x2={CELL} y2={CELL / 2} />
              <line x1={CELL / 2} y1={0} x2={CELL / 2} y2={CELL} />
              <line x1={0} y1={0} x2={CELL} y2={CELL} />
              <line x1={0} y1={CELL} x2={CELL} y2={0} />
            </g>
            <g transform={strokeTransform(0, 0, CELL)}>
              {step.done.map((d, j) => (
                <path key={j} d={d} className="fill-ink-500/50" />
              ))}
              <path d={step.current} className="fill-brand-ink" />
            </g>
          </svg>
          <span className="text-xs text-ink-500">{i + 1}</span>
        </li>
      ))}
    </ol>
  );
}
