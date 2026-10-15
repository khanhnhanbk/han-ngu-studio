import type { HanvietData } from "./lookup";

let pending: Promise<HanvietData> | null = null;

/** Fetch the Hán Việt table once (memoised; retried after a failure). */
export function loadHanviet(): Promise<HanvietData> {
  if (!pending) {
    pending = fetch("/data/hanviet.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<HanvietData>;
      })
      .catch((err: unknown) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}
