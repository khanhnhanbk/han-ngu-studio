/** Data files fetched successfully during this visit (site paths, "/data/…"). */
const loaded = new Set<string>();

export function markLoaded(path: string): void {
  loaded.add(path);
}

export function isLoaded(path: string): boolean {
  return loaded.has(path);
}
