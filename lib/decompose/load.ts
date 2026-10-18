import type { DecomposeData } from "./types";

let pending: Promise<DecomposeData> | null = null;

/** Fetch the decomposition table once (memoised; retried after a failure). */
export function loadDecompose(): Promise<DecomposeData> {
  if (!pending) {
    pending = fetch("/data/decompose.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<DecomposeData>;
      })
      .catch((err: unknown) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}
