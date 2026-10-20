// Suggested memory stories (assets/dictionary/mnemonics.tsv): checks shared by
// pnpm build:data and lib/decompose/mnemonics.test.ts.

/** Longest story, in characters (code points). */
export const MAX_STORY = 160;
export const STATUSES = ["draft", "reviewed"];

// IDS operators, keep in sync with ARITY in lib/decompose/ids.ts.
const ARITY = { "⿰": 2, "⿱": 2, "⿲": 3, "⿳": 3, "⿴": 2, "⿵": 2, "⿶": 2, "⿷": 2, "⿸": 2, "⿹": 2, "⿺": 2, "⿻": 2 };

/**
 * The top-level parts of an IDS that are single known characters: "⿰氵青" →
 * [氵, 青]; nested groups ("⿱⿱爫冖友" → [友]) and unknown parts (？) are left out.
 */
export function topLevelParts(ids) {
  const glyphs = Array.from(ids);
  if (!ARITY[glyphs[0]]) return [];
  let pos = 1;
  // Returns the glyph for a single-character part, null for a nested group.
  const node = () => {
    const g = glyphs[pos++];
    if (g === undefined) throw new Error(`incomplete IDS: ${ids}`);
    if (!ARITY[g]) return g;
    for (let i = 0; i < ARITY[g]; i++) node();
    return null;
  };
  const parts = [];
  for (let i = 0; i < ARITY[glyphs[0]]; i++) {
    const part = node();
    if (part && part !== "？") parts.push(part);
  }
  return parts;
}

/**
 * Check the rows ({ char, story, status }) against decompose.json entries
 * (`decompose[char][0]` is the IDS). Returns a list of error messages.
 * An empty story is allowed (no suggestion for that character).
 */
export function checkMnemonics(rows, decompose) {
  const errors = [];
  const seen = new Set();
  for (const { char, story, status } of rows) {
    const where = `mnemonics.tsv ${char}`;
    if (Array.from(char).length !== 1) errors.push(`${where}: not a single character`);
    if (seen.has(char)) errors.push(`${where}: duplicate`);
    seen.add(char);
    if (!STATUSES.includes(status)) errors.push(`${where}: status must be ${STATUSES.join(" or ")}`);
    const entry = decompose[char];
    if (!entry) {
      errors.push(`${where}: not in decompose.json`);
      continue;
    }
    if (!story) continue;
    if (/[\t\r\n]/.test(story)) errors.push(`${where}: tab or line break in story`);
    if (Array.from(story).length > MAX_STORY) errors.push(`${where}: longer than ${MAX_STORY} characters`);
    if (!story.includes(char)) errors.push(`${where}: story does not show the character itself`);
    for (const part of topLevelParts(entry[0])) {
      if (part !== char && !story.includes(part)) errors.push(`${where}: story does not mention part ${part}`);
    }
  }
  return errors;
}
