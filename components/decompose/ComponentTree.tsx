"use client";

import { useState } from "react";

import type { PartNode } from "@/lib/decompose/types";
import { getDictionary } from "@/lib/i18n";
import { strokeTransform } from "@/lib/strokes/render";
import type { StrokeData } from "@/lib/strokes/types";

import { partColor } from "./colors";

const t = getDictionary("vi").decompose;

/** What the tree shows next to a glyph. */
export type GlyphInfo = {
  hanviet: string;
  pinyin: string;
  /** "Thủy · Nước" when the glyph is a radical or one of its forms. */
  radical: string;
};

export type PartSelection = { key: string; char: string; strokes: number[] | null };

type Props = {
  info: (char: string) => GlyphInfo;
  /** Stroke outlines, so parts such as 龶 show even when no font has them. */
  strokesOf: (char: string) => StrokeData | undefined;
  /** Root-level roles from the etymology: glyph → "semantic" | "phonetic". */
  roles: ReadonlyMap<string, "semantic" | "phonetic">;
  selectedKey: string | null;
  onSelect: (part: PartSelection) => void;
  onHover: (strokes: number[] | null) => void;
};

/** A part drawn from its stroke outlines, else as text. */
function Glyph({ char, data, color }: { char: string; data: StrokeData | undefined; color: string | undefined }) {
  if (!data) {
    return (
      <span className="hanzi w-8 text-center text-3xl leading-none text-ink-900" style={color ? { color } : undefined}>
        {char}
      </span>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className="h-8 w-8 shrink-0" role="img" aria-label={char}>
      <g transform={strokeTransform(0, 0, 100)} className={color ? undefined : "fill-ink-900"} style={color ? { fill: color } : undefined}>
        {data.strokes.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}

/**
 * Levels shown open at first, except the sound part (Gợi âm), which is
 * learnt as a whole; deeper parts open on demand.
 */
const OPEN_DEPTH = 1;

function CharRow({
  node,
  path,
  depth,
  props,
}: {
  node: Extract<PartNode, { kind: "char" }>;
  path: string;
  depth: number;
  props: Props;
}) {
  const role = depth === 0 ? props.roles.get(node.char) : undefined;
  const [open, setOpen] = useState(depth < OPEN_DEPTH && role !== "phonetic");
  const { hanviet, pinyin, radical } = props.info(node.char);
  const selected = props.selectedKey === path;
  const hover = () => props.onHover(node.strokes);
  const leave = () => props.onHover(null);

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-pressed={selected}
          onClick={() => props.onSelect({ key: path, char: node.char, strokes: node.strokes })}
          onMouseEnter={hover}
          onMouseLeave={leave}
          onFocus={hover}
          onBlur={leave}
          className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
            selected ? "border-brand-500 bg-brand-50" : "border-ink-900/10 bg-surface hover:border-brand-500"
          }`}
        >
          {node.color !== null && (
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: partColor(node.color) }}
              aria-hidden
            />
          )}
          <Glyph
            char={node.char}
            data={props.strokesOf(node.char)}
            color={node.color !== null ? partColor(node.color) : undefined}
          />
          <span className="min-w-0 text-sm">
            <span className="block font-semibold text-ink-900">
              {hanviet || "—"}
              {pinyin && <span className="ml-2 font-normal text-ink-700">{pinyin}</span>}
            </span>
            {radical && <span className="block text-xs text-ink-700">{t.radical}: {radical}</span>}
            {!node.parts && !radical && <span className="block text-xs text-ink-500">{t.basicPart}</span>}
          </span>
          {role && (
            <span className="ml-auto shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-ink">
              {role === "semantic" ? t.semantic : t.phonetic}
            </span>
          )}
        </button>
        {node.parts && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="shrink-0 rounded-lg px-2 py-2 text-sm text-ink-700 hover:bg-ink-50 hover:text-ink-900"
          >
            {open ? t.collapse : t.expand}
          </button>
        )}
      </div>
      {node.parts && open && (
        <div className="ml-4 mt-2">
          <PartBlock node={node.parts} path={`${path}.p`} depth={depth + 1} props={props} />
        </div>
      )}
    </div>
  );
}

function PartBlock({ node, path, depth, props }: { node: PartNode; path: string; depth: number; props: Props }) {
  if (node.kind === "char") return <CharRow node={node} path={path} depth={depth} props={props} />;
  if (node.kind === "unknown") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-ink-900/15 px-3 py-2 text-sm text-ink-500">
        {node.color !== null && (
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: partColor(node.color) }} aria-hidden />
        )}
        <span className="hanzi text-2xl leading-none">？</span>
        {t.unknownPart}
      </div>
    );
  }
  return (
    <div>
      {/* The operator glyph (⿰…) is missing from many fonts: show its name only. */}
      <p className="text-xs font-medium text-ink-700">{t.structures[node.op] ?? ""}</p>
      <ul className="mt-1 space-y-2 border-l-2 border-ink-900/10 pl-3">
        {node.children.map((child, i) => (
          <li key={i}>
            <PartBlock node={child} path={`${path}.${i}`} depth={depth} props={props} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The parts of a character, recursively; the root itself is not repeated. */
export function ComponentTree({ tree, ...props }: Props & { tree: PartNode }) {
  if (tree.kind !== "char" || !tree.parts) return <p className="text-sm text-ink-700">{t.basicPart}</p>;
  return <PartBlock node={tree.parts} path="r" depth={0} props={props} />;
}
