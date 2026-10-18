import { memoJson } from "@/lib/fetchJson";

import { isLoaded } from "./loaded";

/** { "/data/…" or "opencc:…": gzip bytes }, written by scripts/build-data.mjs. */
export type Sizes = Record<string, number>;

/** Ask before an action downloads more than this (compressed). */
export const THRESHOLD = 2 * 1024 * 1024;

const PREF_KEY = "download-prompt";

const loadSizes = memoJson<Sizes>("/data/sizes.json");

/** Bytes still to download for `keys`: each distinct key not yet available. */
export function pendingBytes(sizes: Sizes, keys: Iterable<string>, available: (key: string) => boolean): number {
  let bytes = 0;
  for (const key of new Set(keys)) {
    if (!available(key) && Object.hasOwn(sizes, key)) bytes += sizes[key];
  }
  return bytes;
}

/** "2,4 MB", as the prompt shows it. */
export function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toLocaleString("vi-VN", { maximumFractionDigits: 1, minimumFractionDigits: mb < 10 ? 1 : 0 })} MB`;
}

export function parsePromptsOff(raw: string | null): boolean {
  return raw === "off";
}

function promptsOff(): boolean {
  try {
    return parsePromptsOff(window.localStorage.getItem(PREF_KEY));
  } catch {
    return false;
  }
}

function turnPromptsOff(): void {
  try {
    window.localStorage.setItem(PREF_KEY, "off");
  } catch {
    // Not saved; the user is asked again next time.
  }
}

/**
 * Whether the browser already has this file in its HTTP cache (from an
 * earlier visit). "only-if-cached" reads the cache without touching the
 * network; any error (unsupported browser) counts as not cached.
 */
async function inHttpCache(key: string): Promise<boolean> {
  if (!key.startsWith("/")) return false;
  try {
    const res = await fetch(key, { cache: "only-if-cached", mode: "same-origin" });
    void res.body?.cancel();
    return res.ok;
  } catch {
    return false;
  }
}

/* A tiny store: confirmDownload() publishes a request, DownloadPrompt answers it. */

export type DownloadRequest = {
  bytes: number;
  answer: (accept: boolean, dontAsk: boolean) => void;
};

let current: DownloadRequest | null = null;
let queue: Promise<unknown> = Promise.resolve();
const listeners = new Set<() => void>();

export function subscribeDownload(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function currentDownload(): DownloadRequest | null {
  return current;
}

function emit() {
  for (const l of listeners) l();
}

function ask(bytes: number): Promise<boolean> {
  // One prompt at a time; a second request waits for the first answer.
  const next = queue.then(
    () =>
      new Promise<boolean>((resolve) => {
        current = {
          bytes,
          answer: (accept, dontAsk) => {
            if (accept && dontAsk) turnPromptsOff();
            current = null;
            emit();
            resolve(accept);
          },
        };
        emit();
      }),
  );
  queue = next.catch(() => undefined);
  return next;
}

/**
 * Resolve to true when the data for `keys` may be downloaded: it is small
 * (≤ THRESHOLD after leaving out files already fetched or cached), prompts
 * are turned off, the sizes are unknown, or the user agrees. Never blocks a
 * tool because of its own failure.
 */
export async function confirmDownload(keys: Iterable<string>): Promise<boolean> {
  const list = Array.from(new Set(keys)).filter((k) => !isLoaded(k));
  if (list.length === 0 || promptsOff() || listeners.size === 0) return true;
  let sizes: Sizes;
  try {
    sizes = await loadSizes();
  } catch {
    return true;
  }
  // Only probe the cache when the total could be over the limit.
  if (pendingBytes(sizes, list, () => false) <= THRESHOLD) return true;
  const cached = await Promise.all(list.map(inHttpCache));
  const have = new Set(list.filter((_, i) => cached[i]));
  const bytes = pendingBytes(sizes, list, (k) => have.has(k));
  if (bytes <= THRESHOLD) return true;
  return ask(bytes);
}

/** Bytes `keys` would download this visit, for messages (no cache probe). */
export async function downloadSize(keys: Iterable<string>): Promise<number> {
  try {
    return pendingBytes(await loadSizes(), keys, isLoaded);
  } catch {
    return 0;
  }
}
