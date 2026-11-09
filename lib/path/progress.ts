/**
 * "Đã học" ticks on the Lộ trình 1000 chữ page. Like the known words of Đọc
 * hiểu, they stay in this browser's localStorage and are never sent
 * anywhere; TSV export/import moves them to another device.
 */
export type PathProgress = Record<string, string>; // character → date ticked (YYYY-MM-DD)

export const PROGRESS_STORAGE_KEY = "hns-path-progress";
const TSV_HEADER = "char\tdate";

export function readProgress(): PathProgress {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: PathProgress = {};
    for (const [k, v] of Object.entries(parsed)) if (Array.from(k).length === 1 && typeof v === "string") out[k] = v;
    return out;
  } catch {
    return {};
  }
}

/** Save; returns false when storage is unavailable (private mode, quota). */
export function writeProgress(progress: PathProgress): boolean {
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

/** Tick or untick one character, returning a new object. */
export function toggled(progress: PathProgress, char: string, date: string): PathProgress {
  const out = { ...progress };
  if (Object.hasOwn(out, char)) delete out[char];
  else out[char] = date;
  return out;
}

export function progressToTsv(progress: PathProgress): string {
  return [TSV_HEADER, ...Object.entries(progress).map(([c, d]) => `${c}\t${d}`)].join("\n") + "\n";
}

/** Parse progressToTsv output; a line without a date gets `date`. Lines that are not one character are skipped. */
export function parseProgressTsv(text: string, date: string): PathProgress {
  const out: PathProgress = {};
  for (const line of text.replace(/^﻿/, "").split(/\r?\n/)) {
    const [char = "", d = ""] = line.split("\t").map((s) => s.trim());
    if (!char || char === "char" || Array.from(char).length !== 1) continue;
    out[char] = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : date;
  }
  return out;
}
