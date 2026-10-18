import { strokeTransform } from "@/lib/strokes/render";
import type { StrokeData } from "@/lib/strokes/types";

import { partColor } from "./colors";

const CELL = 100;

/**
 * The character drawn from its stroke outlines, each stroke in its part's
 * colour. While `highlight` is set, strokes outside it fade out.
 */
export function ColoredGlyph({
  data,
  colors,
  highlight,
  label,
}: {
  data: StrokeData;
  /** Colour index per stroke (null: grey). */
  colors: ReadonlyArray<number | null>;
  highlight: ReadonlySet<number> | null;
  label: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${CELL} ${CELL}`}
      className="aspect-square w-full max-w-[280px] rounded-xl border border-ink-900/15 bg-surface"
      role="img"
      aria-label={label}
    >
      <g className="stroke-ink-500/30" strokeWidth={0.5} strokeDasharray="2 2">
        <line x1={0} y1={CELL / 2} x2={CELL} y2={CELL / 2} />
        <line x1={CELL / 2} y1={0} x2={CELL / 2} y2={CELL} />
        <line x1={0} y1={0} x2={CELL} y2={CELL} />
        <line x1={0} y1={CELL} x2={CELL} y2={0} />
      </g>
      <g transform={strokeTransform(0, 0, CELL)}>
        {data.strokes.map((d, i) => {
          const color = colors[i];
          return (
            <path
              key={i}
              d={d}
              className={`transition-opacity ${color === null || color === undefined ? "fill-ink-500" : ""}`}
              style={{
                fill: color === null || color === undefined ? undefined : partColor(color),
                opacity: highlight && !highlight.has(i) ? 0.12 : 1,
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}
