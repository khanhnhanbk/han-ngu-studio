"use client";

import { useState } from "react";

import { SpeakButton } from "@/components/speech/SpeakButton";
import type { FamilyMember } from "@/lib/decompose/family";
import { useDictionary } from "@/lib/i18n/useLocale";
import { defaultTone3 } from "@/lib/speech/tone";

/** Members shown before "Xem tất cả". */
const PREVIEW = 24;
/** Upper bound even when showing all (一 and 口 are in thousands of characters). */
const MAX_SHOWN = 300;

/** Characters that contain a component; clicking one opens it. */
export function FamilyList({
  component,
  members,
  hanviet,
  simp,
  onOpen,
}: {
  component: string;
  members: FamilyMember[];
  hanviet: (char: string) => string;
  /** Simplified form of a shown character (recordings are keyed that way). */
  simp: (char: string) => string;
  onOpen: (char: string) => void;
}) {
  const t = useDictionary().decompose;
  const [all, setAll] = useState(false);
  const shown = members.slice(0, all ? MAX_SHOWN : PREVIEW);
  const anyPhonetic = members.some((m) => m.phonetic);

  return (
    <div>
      <h3 className="font-semibold text-ink-900">
        {t.family.split("{char}")[0]}
        <span className="hanzi text-xl">{component}</span>
        {t.family.split("{char}")[1]}
      </h3>
      <p className="text-xs text-ink-500">{t.familyCount.replace("{n}", String(members.length))}</p>
      {members.length === 0 ? (
        <p className="mt-2 text-sm text-ink-700">{t.familyEmpty}</p>
      ) : (
        <>
          <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-2">
            {shown.map((m) => (
              <li key={m.char} className="relative">
                <button
                  type="button"
                  onClick={() => onOpen(m.char)}
                  className="relative flex w-full flex-col items-center rounded-lg border border-ink-900/10 bg-surface px-1 py-2 transition hover:border-brand-500 hover:bg-brand-50"
                >
                  {m.phonetic && (
                    <span className="absolute right-1 top-1 rounded bg-brand-50 px-1 text-[10px] font-semibold text-brand-ink">
                      {t.familyPhonetic}
                    </span>
                  )}
                  <span className="hanzi text-2xl text-ink-900">{m.char}</span>
                  <span className="text-xs text-ink-700">{hanviet(m.char) || "—"}</span>
                </button>
                {/* Beside the tile, not inside it: a button cannot hold a button. */}
                <SpeakButton
                  word={simp(m.char)}
                  label={m.char}
                  tone3={defaultTone3(simp(m.char))}
                  size={12}
                  className="absolute left-0.5 top-0.5 p-1"
                />
              </li>
            ))}
          </ul>
          {anyPhonetic && (
            <p className="mt-2 text-xs text-ink-500">
              {t.familyPhoneticHelp.split("{char}")[0]}
              <span className="hanzi">{component}</span>
              {t.familyPhoneticHelp.split("{char}")[1]}
            </p>
          )}
          {members.length > PREVIEW && (
            <button type="button" className="mt-3 text-sm text-brand-ink underline" onClick={() => setAll(!all)}>
              {all ? t.showLess : t.showAll}
            </button>
          )}
        </>
      )}
    </div>
  );
}
