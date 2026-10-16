import { stripCellSize } from "@/lib/practiceSheet";
import { strokeSteps, strokeTransform } from "@/lib/strokes/render";
import type { StrokeData } from "@/lib/strokes/types";

type Props = {
  data: StrokeData | undefined;
  /** Top-left corner of the strip (start of the grid, not the label). */
  x: number;
  y: number;
  /** Strip height in mm. */
  height: number;
  /** Width available for the cells in mm. */
  width: number;
  boxSize: number;
  border: string;
  /** Colour of strokes written in earlier steps. */
  doneColor: string;
  noDataLabel: string;
  fontFamily: string;
};

/**
 * Stroke-by-stroke cells: cell k shows strokes 1..k, stroke k in black.
 * Plain bordered cells, without the 米/田 guide lines, to keep them clean.
 */
export function StrokeStrip({
  data,
  x,
  y,
  height,
  width,
  boxSize,
  border,
  doneColor,
  noDataLabel,
  fontFamily,
}: Props) {
  if (!data) {
    return (
      <text
        x={x}
        y={y + height / 2}
        dominantBaseline="central"
        fontFamily={fontFamily}
        fontSize={2.6}
        fill="#888"
      >
        {noDataLabel}
      </text>
    );
  }
  const steps = strokeSteps(data);
  const cell = stripCellSize(boxSize, width, steps.length);
  const top = y + (height - cell) / 2;
  return (
    <g>
      {steps.map((step, i) => {
        const cx = x + i * cell;
        return (
          <g key={i}>
            <rect
              x={cx}
              y={top}
              width={cell}
              height={cell}
              fill="none"
              stroke={border}
              strokeWidth={0.3}
            />
            <g transform={strokeTransform(cx, top, cell)}>
              {step.done.map((d, j) => (
                <path key={j} d={d} fill={doneColor} />
              ))}
              <path d={step.current} fill="#000" />
            </g>
          </g>
        );
      })}
    </g>
  );
}
