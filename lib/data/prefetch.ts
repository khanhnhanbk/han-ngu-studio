import { mayPrefetch } from "./budget";

/**
 * A function that starts `load` once, ahead of a click (the user focused an
 * input), but only when that needs no "Tải dữ liệu?" prompt for `files`;
 * otherwise the click itself asks first. Errors are ignored here: the real
 * action calls the same memoised loaders, retries and reports them.
 */
export function prefetcher(files: readonly string[], load: () => Promise<unknown>): () => void {
  let started = false;
  return () => {
    if (started) return;
    started = true;
    void mayPrefetch(files)
      .then((ok) => (ok ? load() : undefined))
      .catch(() => undefined);
  };
}
