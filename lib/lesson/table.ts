/**
 * The lesson's word table in the forms teachers paste elsewhere: Word /
 * Google Docs (HTML table), Google Sheets / Excel (tab-separated), Zalo
 * (numbered lines), Quizlet and Wordwall (term, tab, definition).
 */
export type TableRow = {
  word: string;
  pinyin: string;
  hanviet: string;
  /** Vietnamese meaning, or the English one when there is none. */
  meaning: string;
  hsk: string;
};

export type TableHeaders = Record<keyof TableRow, string> & { no: string };

/** Room for a meaning in a printed / pasted table cell. */
export const MEANING_MAX = 60;

/**
 * A short meaning for the table: senses ("; " in CVDICT, "/" in CC-CEDICT)
 * are kept in order while they fit in `max` characters; a first sense that is
 * already too long is cut with an ellipsis. The teacher can still edit it.
 */
export function briefMeaning(meaning: string, max = MEANING_MAX): string {
  const senses = meaning
    // CC-CEDICT reading tags ("您[nin2]") mean nothing on paper.
    .replace(/\[[A-Za-z0-9: ]+\]/g, "")
    .split(/\s*[;；/]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  let out = "";
  for (const sense of senses) {
    const next = out ? `${out}; ${sense}` : sense;
    if (Array.from(next).length > max) break;
    out = next;
  }
  if (out) return out;
  const first = Array.from(senses[0] ?? "");
  return first.length > max
    ? first
        .slice(0, max - 1)
        .join("")
        .trimEnd() + "…"
    : first.join("");
}

const flat = (s: string) => s.replace(/[\t\r\n]+/g, " ").trim();

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const COLS = ["word", "pinyin", "hanviet", "meaning", "hsk"] as const;

/** Tab-separated with a header row: pastes into Google Sheets / Excel as columns. */
export function tableTsv(rows: readonly TableRow[], h: TableHeaders): string {
  const lines = [[h.no, ...COLS.map((c) => h[c])].join("\t")];
  rows.forEach((r, i) =>
    lines.push([String(i + 1), ...COLS.map((c) => flat(r[c]))].join("\t")),
  );
  return lines.join("\n") + "\n";
}

/**
 * An HTML table with inline borders: Word and Google Docs keep it as a table
 * when it is pasted (they read the text/html part of the clipboard).
 */
export function tableHtml(
  rows: readonly TableRow[],
  h: TableHeaders,
  title = "",
): string {
  const cell = "border:1px solid #999;padding:4px 8px;vertical-align:top";
  const th = (s: string) =>
    `<th style="${cell};text-align:left">${escapeHtml(s)}</th>`;
  const td = (s: string, big = false) =>
    `<td style="${cell}${big ? ";font-size:18pt" : ""}">${escapeHtml(flat(s))}</td>`;
  const head = `<tr>${[h.no, ...COLS.map((c) => h[c])].map(th).join("")}</tr>`;
  const body = rows
    .map(
      (r, i) =>
        `<tr>${td(String(i + 1))}${COLS.map((c) => td(r[c], c === "word")).join("")}</tr>`,
    )
    .join("");
  const caption = title ? `<p><b>${escapeHtml(title)}</b></p>` : "";
  return `${caption}<table style="border-collapse:collapse">${head}${body}</table>`;
}

/** Numbered lines for a chat message: "1. 学习 (xuéxí) – học tập". */
export function tableText(rows: readonly TableRow[], title = ""): string {
  const lines = rows.map((r, i) => {
    const pinyin = flat(r.pinyin) ? ` (${flat(r.pinyin)})` : "";
    const meaning = flat(r.meaning) ? ` – ${flat(r.meaning)}` : "";
    return `${i + 1}. ${flat(r.word)}${pinyin}${meaning}`;
  });
  return (title ? `${title}\n` : "") + lines.join("\n") + "\n";
}

/**
 * Quizlet / Wordwall import: one card per line, term, tab, definition
 * ("学习\txuéxí – học tập"), Quizlet's default import separators.
 */
export function tableQuizlet(rows: readonly TableRow[]): string {
  return (
    rows
      .map((r) => {
        const def = [flat(r.pinyin), flat(r.meaning)]
          .filter(Boolean)
          .join(" – ");
        return `${flat(r.word)}\t${def}`;
      })
      .join("\n") + "\n"
  );
}

/** CSV (RFC 4180 quoting) with a BOM, so Excel opens the Vietnamese and Chinese text correctly. */
export function tableCsv(rows: readonly TableRow[], h: TableHeaders): string {
  const q = (s: string) =>
    /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  const lines = [[h.no, ...COLS.map((c) => h[c])].map(q).join(",")];
  rows.forEach((r, i) =>
    lines.push(
      [String(i + 1), ...COLS.map((c) => r[c].replace(/[\r\n]+/g, " ").trim())]
        .map(q)
        .join(","),
    ),
  );
  return "﻿" + lines.join("\r\n") + "\r\n";
}
