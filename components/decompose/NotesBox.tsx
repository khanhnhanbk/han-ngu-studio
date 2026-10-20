"use client";

import { useEffect, useState } from "react";

import { FileInput } from "@/components/FileInput";
import { loadMnemonics, suggestionFor, type Mnemonics } from "@/lib/decompose/mnemonics";
import { notesToTsv, parseNotesTsv, readNotes, withNote, writeNotes, type Notes } from "@/lib/decompose/notes";
import { downloadText } from "@/lib/download";
import { useDictionary } from "@/lib/i18n/useLocale";

/**
 * The learner's memory story for one character, kept in this browser only,
 * with our suggested story ("Mẹo nhớ gợi ý") above it. `simpChar` is the
 * Simplified form used to look the suggestion up (Phồn thể mode).
 */
export function NotesBox({ char, simpChar = char }: { char: string; simpChar?: string }) {
  const t = useDictionary().decompose;
  const [notes, setNotes] = useState<Notes>({});
  const [status, setStatus] = useState("");
  const [mnemonics, setMnemonics] = useState<Mnemonics | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  // localStorage exists only in the browser, so read it after mounting.
  useEffect(() => setNotes(readNotes()), []);
  // Small file (about 30 KB); without it the box simply shows no suggestion.
  useEffect(() => {
    loadMnemonics()
      .then(setMnemonics)
      .catch(() => setMnemonics(null));
  }, []);
  useEffect(() => {
    setStatus("");
    setShowSuggestion(false);
  }, [char]);

  const suggestion = suggestionFor(mnemonics, simpChar);
  const own = notes[char] ?? "";

  function save(next: Notes, message: string) {
    setNotes(next);
    setStatus(writeNotes(next) ? message : t.notesUnsaved);
  }

  async function handleImport(file: File | undefined) {
    if (!file) return;
    const imported = parseNotesTsv(await file.text());
    const n = Object.keys(imported).length;
    if (n === 0) {
      setStatus(t.importEmpty);
      return;
    }
    save({ ...readNotes(), ...imported }, t.imported.replace("{n}", String(n)));
  }

  const count = Object.keys(notes).length;

  return (
    <div>
      <h3 className="font-semibold text-ink-900">{t.notes}</h3>
      <p className="mt-1 text-sm text-ink-700">
        {t.notesHint.split("{char}")[0]}
        <span className="hanzi">{char}</span>
        {t.notesHint.split("{char}")[1]}
      </p>
      {suggestion && (own === "" || showSuggestion) && (
        <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm">
          <p className="flex flex-wrap items-center gap-2 font-medium text-ink-900">
            {t.suggestion}
            {!suggestion.reviewed && (
              <span className="rounded-full bg-ink-900/5 px-2 py-0.5 text-xs font-normal text-ink-700">
                {t.suggestionDraft}
              </span>
            )}
          </p>
          <p className="mt-1 text-ink-700">{suggestion.story}</p>
          <button
            type="button"
            className="btn-secondary mt-2 px-3 py-1.5 text-sm"
            onClick={() => {
              save(withNote(notes, char, suggestion.story), t.notesSaved);
              setShowSuggestion(false);
            }}
          >
            {t.useSuggestion}
          </button>
        </div>
      )}
      {suggestion && own !== "" && !showSuggestion && (
        <button
          type="button"
          className="mt-2 text-sm text-brand-ink underline decoration-dotted underline-offset-2"
          onClick={() => setShowSuggestion(true)}
        >
          {t.showSuggestion}
        </button>
      )}
      <textarea
        className="mt-3 min-h-28 w-full rounded-lg border border-ink-900/10 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
        value={own}
        placeholder={t.notesPlaceholder}
        aria-label={t.notes}
        onChange={(e) => save(withNote(notes, char, e.target.value), t.notesSaved)}
      />
      <p className="mt-1 min-h-5 text-xs text-ink-500" aria-live="polite">
        {status}
      </p>
      <p className="mt-2 text-xs text-ink-500">{t.notesPrivacy}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-700">
        <button
          type="button"
          className="btn-secondary px-3 py-2"
          disabled={count === 0}
          onClick={() => downloadText(notesToTsv(notes), "cau-chuyen-ghi-nho.tsv", "text/tab-separated-values")}
        >
          {t.exportNotes}
        </button>
        <FileInput buttonLabel={t.importNotes} accept=".tsv,.txt" onFile={handleImport} showName={false} />
      </div>
      <p className="mt-2 text-xs text-ink-500">{t.notesCount.replace("{n}", String(count))}</p>
    </div>
  );
}
