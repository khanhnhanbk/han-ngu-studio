"use client";

import { LEVEL_STYLE } from "@/components/reader/levels";
import { SpeakButton } from "@/components/speech/SpeakButton";
import { useDictionary, useHref } from "@/lib/i18n/useLocale";
import type { LookupCard, LookupReading } from "@/lib/lookup/card";
import type { HskLevel } from "@/lib/reader/analyze";
import { wordsHash } from "@/lib/reader/handoff";
import type { ScriptConverter } from "@/lib/script/convert";
import { posLabels } from "@/lib/vocab/pos";

/** Hanzii's search page for one word; opened only when the user clicks. */
const hanziiUrl = (word: string) => `https://hanzii.net/search/word/${encodeURIComponent(word)}?hl=vi`;

function Reading({ word, shown, reading, conv }: { word: string; shown: string; reading: LookupReading; conv: ScriptConverter }) {
  const dict = useDictionary();
  const t = dict.lookup;
  const level = (reading.level?.replace(/^HSK /, "") ?? null) as HskLevel | null;
  return (
    <div className="border-t border-ink-900/10 pt-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-2xl text-brand-ink">{reading.pinyin}</span>
        <SpeakButton word={word} label={shown} tone3={reading.tone3} size={20} />
        {level && (
          <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ink-50 px-2 py-0.5 text-xs font-medium text-ink-700">
            <span className={`h-2 w-2 rounded-full ${LEVEL_STYLE[level].bg}`} aria-hidden />
            {reading.level}
          </span>
        )}
        {posLabels(dict.vocab.pos, reading.pos).map((label) => (
          <span key={label} className="rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700">
            {label}
          </span>
        ))}
      </div>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-ink-500">{t.hanviet}</dt>
        <dd className="font-semibold text-ink-900">{reading.hanviet}</dd>
        {reading.classifiers.length > 0 && (
          <>
            <dt className="text-ink-500">{dict.vocab.classifiersTitle}</dt>
            <dd className="text-ink-900">
              {reading.classifiers.map((c, i) => (
                <span key={c.hanzi} className="whitespace-nowrap">
                  {i > 0 && <span className="text-ink-500"> · </span>}
                  <span className="hanzi">{conv.toShown(`一${c.hanzi}`)}{shown}</span> <span className="text-ink-700">{c.pinyin}</span>
                </span>
              ))}
            </dd>
          </>
        )}
      </dl>
      <h3 className="mt-3 text-sm font-semibold text-ink-700">{t.meanings}</h3>
      {reading.senses.length ? (
        <ol className="mt-1 list-decimal space-y-0.5 pl-6 text-ink-900">
          {reading.senses.map((s, i) => (
            <li key={i}>{conv.toShown(s)}</li>
          ))}
        </ol>
      ) : (
        <p className="mt-1 text-sm text-ink-500">{t.noMeaning}</p>
      )}
    </div>
  );
}

/** The "Tra từ" result: readings, English line, examples, related words and links to the other tools. */
export function LookupResult({ card, conv, onLookup }: { card: LookupCard; conv: ScriptConverter; onLookup: (word: string) => void }) {
  const dict = useDictionary();
  const t = dict.lookup;
  const href = useHref();
  const shown = conv.toShown(card.word);
  const chars = Array.from(shown);
  const trad = [...new Set(card.readings.flatMap((r) => r.trad))].filter((f) => f !== shown);
  const single = chars.length === 1;
  const charLink = (path: string) => href(`${path}#${new URLSearchParams({ c: shown })}`);
  const linkClass = "btn-secondary px-3 py-1.5 text-xs";

  if (!card.readings.length) {
    return (
      <div className="card mt-6">
        <p className="text-ink-700">{t.notFound.replace("{word}", shown)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {chars.map((c, i) => (
            <button key={i} type="button" onClick={() => onLookup(c)} className="hanzi btn-secondary px-3 py-1.5 text-xl">
              {c}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <article className="card">
        <header className="flex flex-wrap items-end gap-x-4 gap-y-1">
          <h2 className="hanzi text-5xl text-ink-900">{shown}</h2>
          {trad.length > 0 && conv.script === "simp" && (
            <p className="text-sm text-ink-500">
              {t.traditional}: <span className="hanzi text-lg text-ink-700">{trad.join("、")}</span>
            </p>
          )}
        </header>
        <div className="mt-4 space-y-4">
          {card.readings.map((r, i) => (
            <Reading key={i} word={card.word} shown={shown} reading={r} conv={conv} />
          ))}
        </div>
        {card.english && (
          <p className="mt-4 text-sm text-ink-500">
            <span className="font-semibold text-ink-700">{t.english}: </span>
            {conv.toShown(card.english)}
          </p>
        )}
      </article>

      {card.examples.length > 0 && (
        <section className="card">
          <h3 className="font-semibold text-ink-900">{t.examples}</h3>
          <ul className="mt-3 space-y-3">
            {card.examples.map((ex, i) => (
              <li key={i}>
                <p className="hanzi text-xl text-ink-900">{conv.toShown(ex.hanzi)}</p>
                <p className="text-sm text-ink-700">
                  {ex.vi || ex.en}
                  {ex.machine && <span className="ml-2 rounded bg-ink-50 px-1.5 py-0.5 text-xs text-ink-500">{t.machine}</span>}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {card.startsWith.length > 0 && (
        <section className="card">
          <h3 className="font-semibold text-ink-900">{t.startsWith.replace("{word}", shown)}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {card.startsWith.map((w) => (
              <button key={w} type="button" onClick={() => onLookup(w)} className="hanzi btn-secondary px-3 py-1.5 text-lg">
                {conv.toShown(w)}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h3 className="font-semibold text-ink-900">{t.openIn}</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {single && (
            <>
              <a href={charLink("/tools/decompose")} className={linkClass}>
                {t.decompose}
              </a>
              <a href={charLink("/tools/stroke-order")} className={linkClass}>
                {t.strokeOrder}
              </a>
            </>
          )}
          <a href={href(`/tools/practice-sheet#${new URLSearchParams({ chars: shown, strokes: "1" })}`)} className={linkClass}>
            {t.practiceSheet}
          </a>
          <a href={href(`/tools/anki${wordsHash([shown])}`)} className={linkClass}>
            {t.anki}
          </a>
          <a href={href(`/tools/quiz${wordsHash([shown])}`)} className={linkClass}>
            {t.quiz}
          </a>
        </div>
        <p className="mt-4 text-sm">
          <a href={hanziiUrl(shown)} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 underline-offset-4 hover:underline">
            {t.external} ↗
          </a>
          <span className="ml-2 text-xs text-ink-500">{t.externalNote}</span>
        </p>
      </section>
    </div>
  );
}
