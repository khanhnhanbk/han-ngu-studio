import {
  GRID_COLORS,
  TRACE_COLORS,
  getLayout,
  getPinyin,
  type SheetOptions,
  type SheetRow,
} from "@/lib/practiceSheet";

const KAI_FONT =
  'var(--font-kai), "KaiTi", "STKaiti", var(--font-hanzi), serif';
const UI_FONT = "var(--font-be-vietnam), sans-serif";

type Props = {
  rows: SheetRow[];
  options: SheetOptions;
  pageNumber: number;
  pageCount: number;
  labels: { name: string; date: string };
};

function GridBox({
  x,
  y,
  size,
  gridType,
  border,
  guide,
}: {
  x: number;
  y: number;
  size: number;
  gridType: SheetOptions["gridType"];
  border: string;
  guide: string;
}) {
  const half = size / 2;
  return (
    <g>
      <g stroke={guide} strokeWidth={0.18} strokeDasharray="0.8 0.8">
        <line x1={x} y1={y + half} x2={x + size} y2={y + half} />
        <line x1={x + half} y1={y} x2={x + half} y2={y + size} />
        {gridType === "mizi" && (
          <>
            <line x1={x} y1={y} x2={x + size} y2={y + size} />
            <line x1={x} y1={y + size} x2={x + size} y2={y} />
          </>
        )}
      </g>
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill="none"
        stroke={border}
        strokeWidth={0.4}
      />
    </g>
  );
}

export function SheetPage({
  rows,
  options,
  pageNumber,
  pageCount,
  labels,
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

        {Array.from({ length: rowsPerPage }, (_, row) => {
          const item = rows[row];
          const y = 16 + row * boxSize;
          const char = item?.char ?? null;
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
                  {getPinyin(char)}
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
                        fontFamily={KAI_FONT}
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