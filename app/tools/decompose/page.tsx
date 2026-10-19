"use client";

import { pinyin } from "pinyin-pro";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { SpeakButton } from "@/components/speech/SpeakButton";
import { SpeechToggle } from "@/components/speech/SpeechToggle";
import { ColoredGlyph } from "@/components/decompose/ColoredGlyph";
import { ComponentTree, type GlyphInfo, type PartSelection } from "@/components/decompose/ComponentTree";
import { FamilyList } from "@/components/decompose/FamilyList";
import { NotesBox } from "@/components/decompose/NotesBox";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { loadWubi, type WubiTable } from "@/lib/anki/load";
import { buildReverseIndex, familyOf } from "@/lib/decompose/family";
import { etymologyOf } from "@/lib/decompose/ids";
import { loadDecompose } from "@/lib/decompose/load";
import { buildTree, strokeColors, treeGlyphs } from "@/lib/decompose/tree";
import type { DecomposeData, PartNode } from "@/lib/decompose/types";
import { loadHanviet } from "@/lib/hanviet/load";
import { allCharReadings, type HanvietData } from "@/lib/hanviet/lookup";
import { useDictionary, useHref } from "@/lib/i18n/useLocale";
import { parseCharacters, parseSheetCharacters } from "@/lib/practiceSheet";
import { loadRadicals } from "@/lib/radicals/load";
import type { Radical } from "@/lib/radicals/types";
import type { ScriptConverter } from "@/lib/script/convert";
import { useConverter } from "@/lib/script/useScript";
import { defaultTone3 } from "@/lib/speech/tone";
import { loadStrokes } from "@/lib/strokes/load";
import type { StrokeData } from "@/lib/strokes/types";

const SAMPLE = "清意國";
const MAX_CHARS = 20;

type Tables = {
  decompose: DecomposeData;
  // Extra information: the page still works without these.
  hanviet: HanvietData | null;
  radicals: Radical[] | null;
  wubi: WubiTable | null;
};

/** The parts of the root's own decomposition, with the keys ComponentTree gives them. */
function topParts(tree: PartNode): PartSelection[] {
  if (tree.kind !== "char" || !tree.parts) return [];
  const out: PartSelection[] = [];
  const visit = (node: PartNode, key: string) => {
    if (node.kind === "op") node.children.forEach((c, i) => visit(c, `${key}.${i}`));
    else if (node.kind === "char") out.push({ key, char: node.char, strokes: node.strokes });
  };
  visit(tree.parts, "r");
  return out;
}

/** Glyph → "Name · meaning" for every radical and its other forms. */
function radicalNames(radicals: Radical[] | null): Map<string, string> {
  const out = new Map<string, string>();
  for (const r of radicals ?? []) {
    for (const form of [r.radical, ...r.variants]) out.set(form, `${r.name} · ${r.meaning}`);
  }
  return out;
}

/** Writing the hash keeps the characters on the device (it is never sent to the server). */
function writeHash(chars: string[], current: string) {
  const params = new URLSearchParams({ c: chars.join("") });
  if (current !== chars[0]) params.set("s", current);
  window.history.replaceState(null, "", `#${params}`);
}

export default function DecomposePage() {
  const vi = useDictionary();
  const t = vi.decompose;
  const href = useHref();
  const [input, setInput] = useState(SAMPLE);
  const [chars, setChars] = useState<string[]>([]);
  // Phồn thể mode: the Simplified character readings are looked up with.
  const [simpOf, setSimpOf] = useState<ReadonlyMap<string, string>>(new Map());
  // The text last opened; re-opened once the converter is ready and when the
  // script switch changes.
  const [request, setRequest] = useState<{ text: string; pick: string } | null>(null);
  const { conv, ready, failed } = useConverter();
  const [current, setCurrent] = useState("");
  const [tables, setTables] = useState<Tables | null>(null);
  const [strokes, setStrokes] = useState<Map<string, StrokeData>>(new Map());
  const [selected, setSelected] = useState<PartSelection | null>(null);
  const [hover, setHover] = useState<number[] | null>(null);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  // Load the tables, then open the characters from a shared link (#c=…&s=…) or the sample.
  useEffect(() => {
    Promise.all([
      loadDecompose(),
      loadHanviet().catch(() => null),
      loadRadicals().catch(() => null),
      loadWubi().catch(() => null),
    ])
      .then(([decompose, hanviet, radicals, wubi]) => {
        setTables({ decompose, hanviet, radicals, wubi });
        const params = new URLSearchParams(window.location.hash.slice(1));
        const text = params.get("c") || SAMPLE;
        setInput(text);
        setRequest({ text, pick: params.get("s") ?? "" });
      })
      .catch(() => setError(t.loadFailed));
  }, [t]);

  useEffect(() => {
    if (tables && ready && request) open(request.text, request.pick, conv);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open() only reads its arguments and stable tables
  }, [tables, ready, request, conv]);

  function open(text: string, pick: string, conv: ScriptConverter) {
    setError("");
    // Phồn thể mode shows Traditional characters whatever was typed.
    const { chars: list, simpOf } =
      conv.script === "trad"
        ? parseSheetCharacters(conv.toShown(text), conv.toSimp(text), true)
        : { chars: parseCharacters(text, true), simpOf: new Map<string, string>() };
    if (list.length === 0) return setError(t.error);
    if (list.length > MAX_CHARS) return setError(t.tooMany);
    const shownPick = conv.toShown(pick);
    const next = list.includes(shownPick) ? shownPick : list[0];
    setSimpOf(simpOf);
    setChars(list);
    setCurrent(next);
    writeHash(list, next);
  }

  function select(char: string) {
    setCurrent(char);
    writeHash(chars, char);
  }

  /** Open a character from a family list, keeping the trail of characters visited. */
  function openFromFamily(char: string) {
    const list = chars.includes(char) ? chars : [...chars, char].slice(-MAX_CHARS);
    setChars(list);
    setInput(list.join(""));
    setCurrent(char);
    writeHash(list, char);
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setRequest({ text: input, pick: "" });
  }

  const data = tables?.decompose;
  const entry = data && current ? data[current] : undefined;

  // Stroke data for the character and every part in its tree (for nested highlighting).
  useEffect(() => {
    if (!data || !current) return;
    const glyphs = data[current] ? treeGlyphs(buildTree(current, data, () => undefined)) : [];
    let live = true;
    loadStrokes([current, ...glyphs])
      .then((map) => live && setStrokes(map))
      .catch(() => live && setStrokes(new Map()));
    return () => {
      live = false;
    };
  }, [data, current]);

  const tree = useMemo(
    () => (data && entry ? buildTree(current, data, (c) => strokes.get(c)?.matches) : null),
    [data, entry, current, strokes],
  );
  const etymology = entry ? etymologyOf(entry) : null;

  // Start with the sound part selected (that is the family worth learning), else the first part.
  useEffect(() => {
    setHover(null);
    if (!tree || !etymology) return setSelected(null);
    const parts = topParts(tree);
    setSelected(parts.find((p) => p.char === etymology.phonetic) ?? parts[0] ?? null);
    // etymology is derived from tree's entry; tree identity is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  const reverseIndex = useMemo(() => (data ? buildReverseIndex(data) : null), [data]);
  // decompose.json keys are in Simplified frequency order; Traditional-only
  // characters come after them unordered. Phồn thể mode ranks a character
  // by its Simplified form instead (們 by 们), so 間 and 開 come before 蕑.
  const rank = useMemo(() => new Map(Object.keys(data ?? {}).map((c, i) => [c, i])), [data]);
  const radicalOf = useMemo(() => radicalNames(tables?.radicals ?? null), [tables]);

  // Readings come from the Simplified form (hanviet.json is keyed by
  // Simplified, and pinyin-pro misreads some Traditional characters).
  const simpChar = (char: string) => simpOf.get(char) ?? conv.toSimp(char);
  const hanvietOf = (char: string) => allCharReadings(tables?.hanviet ?? null, simpChar(char)).join(", ");
  const info = (char: string): GlyphInfo => {
    const sc = simpChar(char);
    const py = pinyin(sc);
    return {
      hanviet: hanvietOf(char),
      pinyin: py === sc ? "" : py,
      radical: radicalOf.get(char) ?? radicalOf.get(char.normalize("NFKC")) ?? "",
    };
  };

  const roles = new Map<string, "semantic" | "phonetic">();
  if (etymology?.type === "p") {
    if (etymology.semantic) roles.set(etymology.semantic, "semantic");
    if (etymology.phonetic) roles.set(etymology.phonetic, "phonetic");
  }

  const strokeData = strokes.get(current);
  const colors = tree && strokeData ? strokeColors(tree, strokeData.strokes.length) : [];
  const highlightList = hover ?? selected?.strokes ?? null;
  const highlight = highlightList ? new Set(highlightList) : null;
  // Phồn thể mode leaves out characters that exist only in Simplified (们, 头).
  const family = useMemo(() => {
    if (!selected || !data || !reverseIndex) return [];
    const members = familyOf(selected.char, reverseIndex, data).filter((m) => m.char !== current);
    if (conv.script === "simp") return members;
    const order = (c: string) => rank.get(conv.toSimp(c)) ?? rank.get(c) ?? Infinity;
    return members.filter((m) => conv.toShown(m.char) === m.char).sort((a, b) => order(a.char) - order(b.char));
  }, [selected, data, reverseIndex, current, conv, rank]);

  const strokeHref = href(`/tools/stroke-order#${new URLSearchParams({ c: current })}`);
  const sheetHref = href(`/tools/practice-sheet#${new URLSearchParams({ chars: current, strokes: "1" })}`);
  const radical = entry?.[1] ?? "";

  return (
    <>
      <Navbar />
      <main>
        <section className="section">
          <div className="container-page">
            <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{t.title}</h1>
            <p className="mt-4 text-lg text-ink-700">{t.subtitle}</p>

            <form className="card mt-8" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-2 text-sm font-medium text-ink-700">
                {t.inputLabel}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    className="hanzi w-full rounded-lg border border-ink-900/10 bg-surface px-4 py-3 text-2xl text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={input}
                    placeholder={t.placeholder}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <button type="submit" className="btn-primary shrink-0" disabled={!tables || !ready}>
                    {tables ? t.button : t.loading}
                  </button>
                </div>
              </label>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              {!ready && !failed && <p className="mt-3 text-sm text-ink-500">{vi.script.loading}</p>}
              {failed && <p className="mt-3 text-sm text-red-600">{vi.script.loadFailed}</p>}

              {chars.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-2" role="tablist">
                  {chars.map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="tab"
                      aria-selected={c === current}
                      onClick={() => select(c)}
                      className={
                        "hanzi h-12 w-12 rounded-lg border text-2xl transition " +
                        (c === current
                          ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-400"
                          : "border-ink-900/10 text-ink-900 hover:border-ink-900/30")
                      }
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {tables && current && (
              <div ref={resultRef} className="scroll-mt-24">
                <div className="card mt-6">
                  {!entry ? (
                    <div className="flex items-center gap-4">
                      <span className="hanzi text-6xl text-ink-900">{current}</span>
                      <SpeakButton word={simpChar(current)} label={current} tone3={defaultTone3(simpChar(current))} size={24} />
                      <p className="text-sm text-ink-700">{t.noData}</p>
                    </div>
                  ) : (
                    <div className="grid gap-8 md:grid-cols-[minmax(0,280px)_1fr]">
                      <div className="min-w-0">
                        {strokeData ? (
                          <ColoredGlyph
                            data={strokeData}
                            colors={colors}
                            highlight={highlight}
                            label={t.glyphLabel.replace("{char}", current)}
                          />
                        ) : (
                          <>
                            <span className="hanzi block text-center text-9xl text-ink-900">{current}</span>
                            <p className="mt-2 text-xs text-ink-500">{t.noStrokes}</p>
                          </>
                        )}
                        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                          <dt className="text-ink-500">{t.pinyin}</dt>
                          <dd className="flex items-center gap-1 font-medium text-ink-900">
                            {pinyin(simpChar(current), { multiple: true, type: "array" }).join(", ")}
                            <SpeakButton word={simpChar(current)} label={current} tone3={defaultTone3(simpChar(current))} size={16} />
                          </dd>
                          <dt className="text-ink-500">{t.hanviet}</dt>
                          <dd className="font-medium text-brand-ink">{hanvietOf(current) || "—"}</dd>
                          <dt className="text-ink-500">{t.strokeCount}</dt>
                          <dd className="font-medium text-ink-900">{strokeData ? strokeData.strokes.length : "—"}</dd>
                          {radical && (
                            <>
                              <dt className="text-ink-500">{t.radical}</dt>
                              <dd className="font-medium text-ink-900">
                                <span className="hanzi">{radical}</span>
                                {radicalOf.get(radical) && ` · ${radicalOf.get(radical)}`}
                              </dd>
                            </>
                          )}
                          {tables.wubi?.[current] && (
                            <>
                              <dt className="text-ink-500">{t.wubi}</dt>
                              <dd className="font-mono font-medium text-ink-900">{tables.wubi[current]}</dd>
                            </>
                          )}
                        </dl>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <a href={strokeHref} className="btn-secondary px-3 py-2">
                            {t.strokeOrder}
                          </a>
                          <a href={sheetHref} className="btn-secondary px-3 py-2">
                            {t.practice}
                          </a>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-ink-900">{t.parts}</h2>
                        <p className="mb-3 mt-1 text-sm text-ink-500">{t.partsHint}</p>
                        {tree && (
                          <ComponentTree
                            key={current}
                            tree={tree}
                            info={info}
                            strokesOf={(c) => strokes.get(c)}
                            roles={roles}
                            selectedKey={selected?.key ?? null}
                            onSelect={setSelected}
                            onHover={setHover}
                          />
                        )}

                        <h2 className="mt-6 text-lg font-semibold text-ink-900">{t.formation}</h2>
                        {etymology?.type ? (
                          <div className="mt-1 text-sm text-ink-700">
                            <p>
                              <span className="font-semibold text-ink-900">{t.formationTypes[etymology.type]}</span>
                              {" · "}
                              {t.formationHelp[etymology.type]}
                            </p>
                            {etymology.type === "p" && (etymology.semantic || etymology.phonetic) && (
                              <ul className="mt-2 space-y-1">
                                {etymology.semantic && (
                                  <li>
                                    {t.semantic}: <span className="hanzi text-lg text-ink-900">{etymology.semantic}</span>{" "}
                                    {info(etymology.semantic).radical || hanvietOf(etymology.semantic)}
                                  </li>
                                )}
                                {etymology.phonetic && (
                                  <li>
                                    {t.phonetic}: <span className="hanzi text-lg text-ink-900">{etymology.phonetic}</span>{" "}
                                    {hanvietOf(etymology.phonetic)}
                                    {pinyin(simpChar(etymology.phonetic)) !== simpChar(etymology.phonetic) &&
                                      ` (${pinyin(simpChar(etymology.phonetic))})`}
                                  </li>
                                )}
                              </ul>
                            )}
                            {etymology.hint && (
                              <p className="mt-2 text-xs text-ink-500">{t.hint.replace("{hint}", etymology.hint)}</p>
                            )}
                          </div>
                        ) : (
                          <p className="mt-1 text-sm text-ink-700">{t.noFormation}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  {entry && selected && (
                    <div className="card min-w-0">
                      <FamilyList
                        key={selected.char}
                        component={selected.char}
                        members={family}
                        hanviet={(c) => allCharReadings(tables.hanviet, simpChar(c))[0] ?? ""}
                        simp={simpChar}
                        onOpen={openFromFamily}
                      />
                    </div>
                  )}
                  <div className="card min-w-0">
                    <NotesBox char={current} />
                  </div>
                </div>
              </div>
            )}

            <p className="mt-6 text-xs text-ink-500">
              {t.credits} {vi.speech.credit} <SpeechToggle />
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
