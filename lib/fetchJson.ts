import { markLoaded } from "@/lib/data/loaded";

/** Fetch a static JSON file once per page (memoised; retried after a failure). */
export function memoJson<T>(url: string): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => {
    if (!pending) {
      pending = fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<T>;
        })
        .then((data) => {
          markLoaded(url);
          return data;
        })
        .catch((err: unknown) => {
          // Allow a retry on the next call.
          pending = null;
          throw err;
        });
    }
    return pending;
  };
}
