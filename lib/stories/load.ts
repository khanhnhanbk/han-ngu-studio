import { memoJson } from "@/lib/fetchJson";

/**
 * Short stories for the story reader ("Truyện đọc"): our own content, built
 * by `pnpm build:data` from assets/stories/<id>.json.
 */
export type StoryStatus = "draft" | "reviewed";

export type StoryEntry = {
  id: string;
  /** HSK 3.0 level the story is written for ("1", "2", …). */
  level: string;
  title: string;
  titleVi: string;
  topic: string;
  status: StoryStatus;
  newWords: string[];
};

export type Story = StoryEntry & {
  /** One sentence per line: [Chinese (Simplified), Vietnamese]. */
  sentences: Array<[string, string]>;
  /** Culture note, in Vietnamese. */
  culture: string;
};

export const STORY_INDEX_FILE = "/data/stories/index.json";
export const storyFile = (id: string) => `/data/stories/${id}.json`;

export const loadStoryIndex = memoJson<StoryEntry[]>(STORY_INDEX_FILE);

const stories = new Map<string, () => Promise<Story>>();

/** Load one story (memoised per id). */
export function loadStory(id: string): Promise<Story> {
  let load = stories.get(id);
  if (!load) {
    load = memoJson<Story>(storyFile(id));
    stories.set(id, load);
  }
  return load();
}

/** A story id from a "#story=<id>" hash, or "" (only slugs are accepted). */
export function storyIdFromHash(hash: string): string {
  const id = new URLSearchParams(hash.replace(/^#/, "")).get("story") ?? "";
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id) ? id : "";
}

/** The reader text of a story: one sentence per line. */
export const storyText = (story: Story) => story.sentences.map(([zh]) => zh).join("\n");
