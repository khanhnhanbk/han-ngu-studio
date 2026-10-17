import type { Radical } from "./types";

let pending: Promise<Radical[]> | null = null;

/** Fetch the radical table once (memoised; retried after a failure). */
export function loadRadicals(): Promise<Radical[]> {
  if (!pending) {
    pending = fetch("/data/radicals.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Radical[]>;
      })
      .catch((err: unknown) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}
