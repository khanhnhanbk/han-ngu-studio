/**
 * The learner's own memory stories, one per character. They stay in this
 * browser's localStorage and are never sent anywhere; TSV export/import is
 * the way to back them up or move them to another device.
 */
export type Notes = Record<string, string>;

export const NOTES_STORAGE_KEY = "hns-mnemonics";
const TSV_HEADER = "char\tnote";

export function readNotes(): Notes {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(NOTES_STORAGE_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Notes = {};
    for (const [k, v] of Object.entries(parsed)) if (typeof v === "string" && v) out[k] = v;
    return out;
  } catch {
    return {};
  }
}

/** Save; returns false when storage is unavailable (private mode, quota). */
export function writeNotes(notes: Notes): boolean {
  try {
    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch {
    return false;
  }
}

/** Set or clear (empty text) one character's note, returning a new object. */
export function withNote(notes: Notes, char: string, text: string): Notes {
  const out = { ...notes };
  if (text.trim()) out[char] = text;
  else delete out[char];
  return out;
}

const escape = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/\t/g, "\\t").replace(/\r/g, "\\r").replace(/\n/g, "\\n");

const unescape = (s: string) =>
  s.replace(/\\(.)/g, (_, c: string) => (c === "t" ? "\t" : c === "n" ? "\n" : c === "r" ? "\r" : c));

/** Header line, then one `char<TAB>note` line per note; tabs and newlines escaped. */
export function notesToTsv(notes: Notes): string {
  const lines = Object.entries(notes).map(([char, note]) => `${char}\t${escape(note)}`);
  return [TSV_HEADER, ...lines].join("\n") + "\n";
}

/** Parse notesToTsv output. Lines without a single character before the tab are skipped. */
export function parseNotesTsv(text: string): Notes {
  const out: Notes = {};
  for (const line of text.replace(/^﻿/, "").split(/\r?\n/)) {
    const tab = line.indexOf("\t");
    if (tab < 0) continue;
    const char = line.slice(0, tab).trim();
    const note = unescape(line.slice(tab + 1));
    if (Array.from(char).length !== 1 || !note.trim()) continue;
    out[char] = note;
  }
  return out;
}
