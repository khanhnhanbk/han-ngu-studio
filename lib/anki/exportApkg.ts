import type { SqlJsStatic } from "sql.js";

import { buildApkg, rowToNote, type ApkgMedia } from "./apkg";
import type { Column, DeckRow } from "./buildDeck";

/**
 * Browser side of the .apkg export: sql.js and its wasm load only when the
 * user exports (the wasm is served from public/vendor/, matching the pinned
 * sql.js version; see apkgVendor.test.ts).
 */
export const SQL_WASM_URL = "/vendor/sql-wasm-1.14.2.wasm";

let sql: Promise<SqlJsStatic> | null = null;

function loadSql(): Promise<SqlJsStatic> {
  sql ??= import("sql.js")
    .then(({ default: initSqlJs }) => initSqlJs({ locateFile: () => SQL_WASM_URL }))
    .catch((err: unknown) => {
      sql = null;
      throw err;
    });
  return sql;
}

/** An image the user attached to a card, ready for the deck. */
export type CardImage = { data: Uint8Array; ext: string; url: string };

const MAX_SIDE = 1024;
const KEEP_BYTES = 300 * 1024;
const KEEP_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

/**
 * Read an image the user picked, pasted or dropped. Small images keep their
 * file; larger ones are scaled to at most 1024 px and saved as JPEG on a
 * white background, so a deck of photos stays small enough for phones. GIFs
 * are kept as they are (they may be animated).
 */
export async function prepareImage(file: Blob): Promise<CardImage> {
  const keepExt = KEEP_TYPES[file.type];
  if (!file.type.startsWith("image/")) throw new Error("not an image");
  const bitmap = await createImageBitmap(file);
  try {
    const small = bitmap.width <= MAX_SIDE && bitmap.height <= MAX_SIDE && file.size <= KEEP_BYTES;
    if (keepExt && (small || keepExt === "gif")) {
      return { data: new Uint8Array(await file.arrayBuffer()), ext: keepExt, url: URL.createObjectURL(file) };
    }
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) throw new Error("encode failed");
    return { data: new Uint8Array(await blob.arrayBuffer()), ext: "jpg", url: URL.createObjectURL(blob) };
  } finally {
    bitmap.close();
  }
}

async function contentName(image: CardImage): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", image.data as BufferSource);
  const hex = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  // Named by content: a changed picture never clashes with one Anki already has.
  return `hns-${hex.slice(0, 16)}.${image.ext}`;
}

/** Build the .apkg for the rows shown (images keyed by row index). */
export async function exportApkg(
  rows: readonly DeckRow[],
  columns: readonly Column[],
  images: ReadonlyMap<number, CardImage>,
  deckName: string,
): Promise<Uint8Array> {
  const SQL = await loadSql();
  const media: ApkgMedia[] = [];
  const seen = new Set<string>();
  const notes = [];
  for (const [i, row] of rows.entries()) {
    const image = images.get(i);
    let name: string | undefined;
    if (image) {
      name = await contentName(image);
      if (!seen.has(name)) {
        seen.add(name);
        media.push({ name, data: image.data });
      }
    }
    notes.push(rowToNote(row, columns, name));
  }
  return buildApkg(SQL, { deckName, notes, media });
}
