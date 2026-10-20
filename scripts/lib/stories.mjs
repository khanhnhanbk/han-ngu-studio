// Story reader content (assets/stories/<id>.json): checks shared by
// pnpm build:data and lib/stories/stories.test.ts.

export const STORY_LEVELS = ["1", "2", "3", "4", "5", "6"];
export const STORY_STATUSES = ["draft", "reviewed"];
export const MAX_CULTURE = 700;

/**
 * Check one story. `known(word)` says whether the dictionary can explain a
 * new word (HSK list or CC-CEDICT). Returns a list of error messages.
 */
export function checkStory(story, known) {
  const errors = [];
  const where = `stories/${story?.id ?? "?"}`;
  const text = (v) => typeof v === "string" && v.trim() !== "";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(story.id ?? "")) errors.push(`${where}: id must be a lowercase slug`);
  if (!STORY_LEVELS.includes(story.level)) errors.push(`${where}: level must be one of ${STORY_LEVELS.join(", ")}`);
  if (!STORY_STATUSES.includes(story.status)) errors.push(`${where}: status must be draft or reviewed`);
  for (const key of ["title", "titleVi", "topic", "culture"]) if (!text(story[key])) errors.push(`${where}: missing ${key}`);
  if (text(story.culture) && Array.from(story.culture).length > MAX_CULTURE)
    errors.push(`${where}: culture note longer than ${MAX_CULTURE} characters`);

  const sentences = Array.isArray(story.sentences) ? story.sentences : [];
  if (sentences.length < 4 || sentences.length > 20) errors.push(`${where}: needs 4–20 sentences`);
  sentences.forEach((s, i) => {
    if (!Array.isArray(s) || s.length !== 2 || !text(s[0]) || !text(s[1]))
      errors.push(`${where}: sentence ${i + 1} must be [Chinese, Vietnamese]`);
    else if (/[\r\n]/.test(s[0]) || /[\r\n]/.test(s[1])) errors.push(`${where}: sentence ${i + 1} has a line break`);
  });

  const zh = sentences.map((s) => (Array.isArray(s) ? s[0] : "")).join("\n");
  const words = Array.isArray(story.newWords) ? story.newWords : [];
  if (words.length < 3 || words.length > 8) errors.push(`${where}: needs 3–8 new words`);
  if (new Set(words).size !== words.length) errors.push(`${where}: duplicate new word`);
  for (const w of words) {
    if (!zh.includes(w)) errors.push(`${where}: new word ${w} is not in the text`);
    if (!known(w)) errors.push(`${where}: new word ${w} is not in the dictionary`);
  }
  return errors;
}

/** The library list: everything but the text. */
export function storyIndexEntry(story) {
  const { id, level, title, titleVi, topic, status, newWords } = story;
  return { id, level, title, titleVi, topic, status, newWords };
}
