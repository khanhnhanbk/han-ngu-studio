import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { SQL_WASM_URL } from "./exportApkg";

describe("vendored sql.js wasm", () => {
  it("matches the installed sql.js version byte for byte", () => {
    const root = join(__dirname, "../..");
    const pkg = JSON.parse(readFileSync(join(root, "node_modules/sql.js/package.json"), "utf-8")) as { version: string };
    expect(SQL_WASM_URL).toBe(`/vendor/sql-wasm-${pkg.version}.wasm`);
    const shipped = readFileSync(join(root, "public", SQL_WASM_URL));
    expect(shipped.equals(readFileSync(join(root, "node_modules/sql.js/dist/sql-wasm.wasm")))).toBe(true);
  });
});
