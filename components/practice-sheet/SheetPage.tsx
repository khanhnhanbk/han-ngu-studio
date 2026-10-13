import {
  BOXES_PER_ROW,
  BOX_SIZE,
  LABEL_WIDTH,
  MARGIN_TOP,
  MARGIN_X,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  ROWS_PER_PAGE,
  getPinyin,
  type SheetOptions,
} from "@/lib/practiceSheet";

const KAI_FONT =
  'var(--font-kai), "KaiTi", "STKaiti", var(--font-hanzi), serif';
const UI_FONT = "var(--font-be-vietnam), sans-serif";

const BORDER_COLOR = "#801a1a";
const GUIDE_COLOR = "#cc6666";
const TRACE_COLOR = "#b0b0b0";

type Props = {
  characters: string[];
  options: SheetOptions;
  pageNumber: number;
  pageCount: number;
  labels: { name: string; date: string };
};

function GridBox({
  x,
  y,
  gridType,
}: {
  x: number;
  y: number;
  gridType: SheetOptions["gridType"];
}) {
  const s = BOX_SIZE;
  const half = s / 2;
  return (
    <g>
      <g stroke={GUIDE_COLOR} strokeWidth={0.18} strokeDasharray="0.8 0.8">
        <line x1={x} y1={y + half} x2={x + s} y2={y + half} />
        <line x1={x + half} y1={y} x2={x + half} y2={y + s} />
        {gridType === "mizi" && (
          <>
            <line x1={x} y1={y} x2={x + s} y2={y + s} />
            <line x1={x} y1={y + s} x2={x + s} y2={y} />
          </>
        )}
      </g>
      <rect
        x={x}
        y={y}
        width={s}
        height={s}
        fill="none"
        stroke={BORDER_COLOR}
        strokeWidth={0.4}
      />
    </g>
  );
}

export function SheetPage({
  characters,
  options,
  pageNumber,
  pageCount,
  labels,
}: Props) {
  const gridLeft = MARGIN_X + LABEL_WIDTH;
  const fontSize = BOX_SIZE * 0.75;

  return (
    <div className="sheet-page">
      <svg
        viewBox={`0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}`}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={PAGE_WIDTH} height={PAGE_HEIGHT} fill="#fff" />

        <g fontFamily={UI_FONT} fontSize={3.2} fill="#333">
          <text x={MARGIN_X} y={MARGIN_TOP - 5}>
            {labels.name}: ______________________
          </text>
          <text x={PAGE_WIDTH / 2} y={MARGIN_TOP - 5}>
            {labels.date}: ______________
          </text>
          <text
            x={PAGE_WIDTH - MARGIN_X}
            y={MARGIN_TOP - 5}
            textAnchor="end"
            fill="#888"
          >
            {pageNumber} / {pageCount}
          </text>
        </g>

        {Array.from({ length: ROWS_PER_PAGE }, (_, row) => {
          const char = characters[row];
          const y = MARGIN_TOP + row * BOX_SIZE;
          return (
            <g key={row}>
              {char && options.showPinyin && (
                <text
                  x={MARGIN_X + LABEL_WIDTH / 2}
                  y={y + BOX_SIZE / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily={UI_FONT}
                  fontSize={4}
                  fill="#111"
                >
                  {getPinyin(char)}
                </text>
              )}
              {Array.from({ length: BOXES_PER_ROW }, (_, col) => {
                const x = gridLeft + col * BOX_SIZE;
                const isModel = col === 0;
                const isTrace = col > 0 && col <= options.traceCount;
                return (
                  <g key={col}>
                    <GridBox x={x} y={y} gridType={options.gridType} />
                    {char && (isModel || isTrace) && (
                      <text
                        x={x + BOX_SIZE / 2}
                        y={y + BOX_SIZE / 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontFamily={KAI_FONT}
                        fontSize={fontSize}
                        fill={isModel ? "#000" : TRACE_COLOR}
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
