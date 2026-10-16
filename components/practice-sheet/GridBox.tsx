import type { SheetOptions } from "@/lib/practiceSheet";

export function GridBox({
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
