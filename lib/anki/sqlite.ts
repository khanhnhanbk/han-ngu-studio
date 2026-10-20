import type { SqlJsStatic } from "sql.js";

import { markLoaded } from "@/lib/data/loaded";

/** sql.js's wasm, self-hosted by `pnpm build:data` (never a CDN). */
export const SQL_WASM_FILE = "/data/vendor/sql-wasm.wasm";
/** Files the .apkg export downloads, for confirmDownload. */
export const APKG_FILES = [SQL_WASM_FILE];

let pending: Promise<SqlJsStatic> | null = null;

/** Load SQLite once per page (lazy: only when the user exports an .apkg). */
export function loadSqlJs(): Promise<SqlJsStatic> {
  if (!pending) {
    pending = import("sql.js")
      .then(({ default: initSqlJs }) => initSqlJs({ locateFile: () => SQL_WASM_FILE }))
      .then((SQL) => {
        markLoaded(SQL_WASM_FILE);
        return SQL;
      })
      .catch((err: unknown) => {
        // Allow a retry on the next click.
        pending = null;
        throw err;
      });
  }
  return pending;
}
