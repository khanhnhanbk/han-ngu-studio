import {
  GRID_COLORS,
  TRACE_COLORS,
  getLayout,
  getPinyin,
  rowHeight,
  type SheetOptions,
  type SheetRow,
} from "@/lib/practiceSheet";
import type { StrokeData } from "@/lib/strokes/types";

import { GridBox } from "./GridBox";
import { StrokeStrip } from "./StrokeStrip";

const UI_FONT = "var(--font-be-vietnam), sans-serif";

type Props = {
  rows: SheetRow[];
  options: SheetOptions;
  pageNumber: number;
  pageCount: number;
  labels: { name: string; date: string; strokes: string; noStrokes: string };
  /** Stroke data by character; only needed when showStrokeOrder is on. */
  strokes?: Map<string, StrokeData>;
  /** Phồn thể mode: the Simplified character each Pinyin is read from. */
  simpOf?: ReadonlyMap<string, string>;
};

export function SheetPage({
  rows,
  options,
  pageNumber,
  pageCount,
  labels,
  strokes,
  simpOf,
}: Props) {
  const layout = getLayout(options.boxSize);
  const {
    boxSize,
    boxesPerRow,
    rowsPerPage,
    labelWidth,
    maxTrace,
  } = layout;
  const gridLeft = 8 + labelWidth;
  const fontSize = boxSize * 0.75;
  const pinyinSize = boxSize * 0.25;
  const { border, guide } = GRID_COLORS[options.gridColor];
  const traceColor = TRACE_COLORS[options.traceShade];
  const effectiveTrace = Math.min(options.traceCount, maxTrace);

  // Rows have different heights (the stroke strip is shorter), so place them
  // one after another, then fill the rest of the page with blank rows.
  const placed: { row: SheetRow | null; y: number }[] = [];
  const bottom = 16 + rowsPerPage * boxSize;
  let y = 16;
  for (const row of rows) {
    placed.push({ row, y });
    y += rowHeight(row, boxSize);
  }
  // The epsilon absorbs floating-point error from the half-height strips.
  while (y + boxSize <= bottom + 1e-6) {
    placed.push({ row: null, y });
    y += boxSize;
  }

  return (
    <div className="sheet-page">
      <svg
        viewBox={`0 0 210 297`}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={210} height={297} fill="#fff" />

        <g fontFamily={UI_FONT} fontSize={3.2} fill="#333">
          <text x={8} y={16 - 5}>
            {labels.name}: ______________________
          </text>
          <text x={105} y={16 - 5}>
            {labels.date}: ______________
          </text>
          <text x={210 - 8} y={16 - 5} textAnchor="end" fill="#888">
            {pageNumber} / {pageCount}
          </text>
        </g>

        {placed.map(({ row: item, y }, row) => {
          const char = item?.char ?? null;
          if (item?.kind === "strokes") {
            const data = strokes?.get(item.char);
            return (
              <g key={row}>
                {data && (
                  <text
                    x={8 + labelWidth / 2}
                    y={y + rowHeight(item, boxSize) / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily={UI_FONT}
                    fontSize={2.6}
                    fill="#555"
                  >
                    {data.strokes.length} {labels.strokes}
                  </text>
                )}
                <StrokeStrip
                  data={data}
                  x={gridLeft}
                  y={y}
                  height={rowHeight(item, boxSize)}
                  width={boxesPerRow * boxSize}
                  boxSize={boxSize}
                  border={border}
                  doneColor={traceColor}
                  noDataLabel={labels.noStrokes}
                  fontFamily={UI_FONT}
                />
              </g>
            );
          }
          const isFirst = item?.kind === "first";
          return (
            <g key={row}>
              {char && isFirst && options.showPinyin && (
                <text
                  x={8 + labelWidth / 2}
                  y={y + boxSize / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily={UI_FONT}
                  fontSize={pinyinSize}
                  fill="#111"
                >
                  {getPinyin(simpOf?.get(char) ?? char)}
                </text>
              )}
              {Array.from({ length: boxesPerRow }, (_, col) => {
                const x = gridLeft + col * boxSize;
                const showModel = char && isFirst && col === 0;
                const showTrace = char && isFirst && col > 0 && col <= effectiveTrace;
                const showHint = char && !isFirst && col === 0;
                return (
                  <g key={col}>
                    <GridBox
                      x={x}
                      y={y}
                      size={boxSize}
                      gridType={options.gridType}
                      border={border}
                      guide={guide}
                    />
                    {(showModel || showTrace || showHint) && (
                      <text
                        x={x + boxSize / 2}
                        y={y + boxSize / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontFamily={options.fontFamily}
                        fontSize={fontSize}
                        fill={showModel ? "#000" : traceColor}
                      >
                        {char}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}