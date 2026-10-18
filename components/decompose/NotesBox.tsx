"use client";

import { useEffect, useState } from "react";

import { FileInput } from "@/components/FileInput";
import { notesToTsv, parseNotesTsv, readNotes, withNote, writeNotes, type Notes } from "@/lib/decompose/notes";
import { downloadText } from "@/lib/download";
import { getDictionary } from "@/lib/i18n";

const t = getDictionary("vi").decompose;

/** The learner's memory story for one character, kept in this browser only. */
export function NotesBox({ char }: { char: string }) {
  const [notes, setNotes] = useState<Notes>({});
  const [status, setStatus] = useState("");

  // localStorage exists only in the browser, so read it after mounting.
  useEffect(() => setNotes(readNotes()), []);
  useEffect(() => setStatus(""), [char]);

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
      <textarea
        className="mt-3 min-h-28 w-full rounded-lg border border-ink-900/10 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-brand-500"
        value={notes[char] ?? ""}
        placeholder={t.notesPlaceholder}
        aria-label={t.notes}
        onChange={(e) => save(withNote(notes, char, e.target.value), t.notesSaved)}
      />
      <p className="mt-1 min-h-5 text-xs text-ink-500" aria-live="polite">
        {status}
      </p>
      <p className="mt-2 text-xs text-ink-500">{t.notesPrivacy}</p>
      <div className="mt-3 flex flex-wrap items-end gap-3 text-sm text-ink-700">
        <button
          type="button"
          className="btn-secondary px-3 py-2"
          disabled={count === 0}
          onClick={() => downloadText(notesToTsv(notes), "cau-chuyen-ghi-nho.tsv", "text/tab-separated-values")}
        >
          {t.exportNotes}
        </button>
        <FileInput label={t.importNotes} accept=".tsv,.txt" onFile={handleImport} showName={false} />
      </div>
      <p className="mt-2 text-xs text-ink-500">{t.notesCount.replace("{n}", String(count))}</p>
    </div>
  );
}
