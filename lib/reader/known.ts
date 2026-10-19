/**
 * Words the learner marked as known in Đọc hiểu. Like the Chiết tự memory
 * stories, they stay in this browser's localStorage and are never sent
 * anywhere; TSV export/import backs them up or moves them to another device.
 * Keys are Simplified words (the reader analyses Simplified text), so 學習
 * and 学习 are one entry.
 */
export type KnownWords = Record<string, string>; // word → date marked (YYYY-MM-DD)

export const KNOWN_STORAGE_KEY = "hns-reader-known";
const TSV_HEADER = "word\tdate";

export function readKnown(): KnownWords {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(KNOWN_STORAGE_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: KnownWords = {};
    for (const [k, v] of Object.entries(parsed)) if (k.trim() && typeof v === "string") out[k] = v;
    return out;
  } catch {
    return {};
  }
}

/** Save; returns false when storage is unavailable (private mode, quota). */
export function writeKnown(known: KnownWords): boolean {
  try {
    window.localStorage.setItem(KNOWN_STORAGE_KEY, JSON.stringify(known));
    return true;
  } catch {
    return false;
  }
}

export const today = () => new Date().toISOString().slice(0, 10);

/** Header line, then `word<TAB>date` per word (words have no tabs or newlines). */
export function knownToTsv(known: KnownWords): string {
  return [TSV_HEADER, ...Object.entries(known).map(([w, d]) => `${w}\t${d}`)].join("\n") + "\n";
}

/**
 * Parse knownToTsv output, or any list with one word per line (the date
 * column is optional, so a plain word list from Anki or Excel also works).
 */
export function parseKnownTsv(text: string, date = today()): KnownWords {
  const out: KnownWords = {};
  for (const line of text.replace(/^﻿/, "").split(/\r?\n/)) {
    const [word = "", d = ""] = line.split("\t");
    const w = word.trim();
    if (!w || line === TSV_HEADER || !/\p{Script=Han}/u.test(w)) continue;
    out[w] = /^\d{4}-\d{2}-\d{2}$/.test(d.trim()) ? d.trim() : date;
  }
  return out;
}
