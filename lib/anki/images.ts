/**
 * Pictures for Anki cards (phase 4a, approved by the owner on 2026-11-09).
 * Search runs only after the learner ticks the consent box on /tools/anki,
 * and sends one short English query per word (never a sentence) to the
 * Openverse API, which lists openly licensed images. The chosen picture is
 * fetched once, shrunk in the browser and packed into the .apkg with its
 * attribution. See CLAUDE.md, HARD RULE 4.
 */

export const OPENVERSE_API = "https://api.openverse.org/v1/images/";
/** Candidates shown per word. */
export const IMAGE_CANDIDATES = 6;
/** Longest side of the picture packed into the deck, in pixels. */
export const IMAGE_MAX_SIDE = 400;

export type ImageCandidate = {
  id: string;
  /** Full-size image on its own site (for the preview; not an API request). */
  url: string;
  /** Openverse thumbnail (CORS-enabled, fetched only for the chosen picture). */
  thumbnail: string;
  title: string;
  creator: string;
  /** "CC BY 2.0", "CC0 1.0", "Public Domain Mark 1.0"… */
  license: string;
  /** Page of the work, for the credit link. */
  landing: string;
};

const SKIP = /^(used in|variant of|old variant|see |also |cl:|surname|abbr\.|abbreviation|erhua|japanese|korean|\(?\w+\)? particle)/i;

/**
 * A short English query from a CC-CEDICT meaning ("to learn; to study" →
 * "learn"): a sense of at most three words once parentheses, brackets,
 * Chinese characters and a leading "to / a / an / the" are gone. Common-noun
 * senses come first ("Apple (company); apple" → "apple", "Shui ethnic group;
 * water" → "water"); a capitalised one only when nothing else fits. Empty
 * when no sense fits (the learner can type one).
 */
export function imageQuery(meaning: string): string {
  const fitting: string[] = [];
  for (const raw of meaning.split(/[;/]/)) {
    const sense = raw
      .replace(/\([^)]*\)|\[[^\]]*\]|"[^"]*"/g, " ")
      .replace(/[\p{Script=Han}|]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!sense || SKIP.test(raw.trim()) || SKIP.test(sense)) continue;
    const words = sense.replace(/^(to|a|an|the) /i, "").replace(/[.,!?]+$/, "").split(" ").filter(Boolean);
    if (words.length === 0 || words.length > 3) continue;
    fitting.push(words.join(" "));
  }
  return fitting.find((q) => !/^\p{Lu}/u.test(q)) ?? fitting[0] ?? "";
}

type OpenverseResult = {
  id?: string;
  url?: string;
  thumbnail?: string;
  title?: string;
  creator?: string;
  license?: string;
  license_version?: string;
  foreign_landing_url?: string;
};

/** "by" + "2.0" → "CC BY 2.0"; "cc0" → "CC0 1.0"; "pdm" → "Public Domain Mark 1.0". */
export function licenseName(code: string, version = ""): string {
  const c = code.toLowerCase();
  if (c === "pdm") return `Public Domain Mark ${version || "1.0"}`.trim();
  if (c === "cc0") return `CC0 ${version || "1.0"}`.trim();
  return `CC ${c.toUpperCase()} ${version}`.trim();
}

/** Parse an Openverse search response, keeping only complete results. */
export function parseOpenverse(json: unknown): ImageCandidate[] {
  const results = (json as { results?: OpenverseResult[] })?.results ?? [];
  const out: ImageCandidate[] = [];
  for (const r of results) {
    if (!r.id || !r.url || !r.thumbnail || !r.license) continue;
    out.push({
      id: r.id,
      url: r.url,
      thumbnail: r.thumbnail,
      title: r.title ?? "",
      creator: r.creator ?? "",
      license: licenseName(r.license, r.license_version ?? ""),
      landing: r.foreign_landing_url ?? "",
    });
  }
  return out;
}

export class RateLimitedError extends Error {}

/** One search on Openverse (one API request). Throws RateLimitedError on HTTP 429. */
export async function searchImages(query: string, fetchImpl: typeof fetch = fetch): Promise<ImageCandidate[]> {
  const params = new URLSearchParams({ q: query, page_size: String(IMAGE_CANDIDATES), mature: "false" });
  const res = await fetchImpl(`${OPENVERSE_API}?${params}`);
  if (res.status === 429) throw new RateLimitedError("rate limited");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseOpenverse(await res.json());
}

/** "“Apples” by X, CC BY 2.0" for the card (plain text; escaped when written). */
export function imageCredit(c: Pick<ImageCandidate, "title" | "creator" | "license">): string {
  const title = c.title ? `“${c.title}”` : "";
  const by = c.creator ? `${title ? " " : ""}by ${c.creator}` : "";
  return `${title}${by}${title || by ? ", " : ""}${c.license}`;
}

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The card's "image" field: the packed file and its credit line. */
export function imageFieldHtml(fileName: string, credit: string): string {
  return `<img src="${escapeHtml(fileName)}"><div class="credit">${escapeHtml(credit)}</div>`;
}

/** Stable media name for a picture ("hns-img-ae9def31….jpg"). */
export function imageFileName(id: string): string {
  return `hns-img-${id.replace(/[^0-9a-f-]/gi, "").slice(0, 36)}.jpg`;
}

/** Scale (w, h) down so the longer side is at most `max`. */
export function fitSize(w: number, h: number, max = IMAGE_MAX_SIDE): { w: number; h: number } {
  const k = Math.min(1, max / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}
