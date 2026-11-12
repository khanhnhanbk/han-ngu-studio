/**
 * Lessons made in Soạn bài (lesson builder), kept only in this browser
 * (localStorage, owner decision 2026-11-12). Nothing is sent anywhere; a
 * JSON file moves them to another device or keeps a backup.
 */
export type Lesson = {
  id: string;
  name: string;
  /** One word per line, as the teacher typed or picked them. */
  words: string;
  /** The text the words came from (dialogue, reading); may be empty. */
  text: string;
  updatedAt: number;
};

export const LESSONS_KEY = "hns-lessons";
/** "format" of the backup file, so other JSON files are refused. */
export const LESSONS_FILE_FORMAT = "han-ngu-studio-lessons";
export const MAX_LESSONS = 200;

const isLesson = (v: unknown): v is Lesson => {
  if (!v || typeof v !== "object") return false;
  const l = v as Record<string, unknown>;
  return (
    typeof l.id === "string" &&
    l.id !== "" &&
    typeof l.name === "string" &&
    typeof l.words === "string" &&
    typeof l.text === "string" &&
    typeof l.updatedAt === "number"
  );
};

/** Valid lessons from parsed JSON, newest first, ids unique (first one wins). */
export function cleanLessons(value: unknown): Lesson[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: Lesson[] = [];
  for (const v of value) {
    if (!isLesson(v) || seen.has(v.id)) continue;
    seen.add(v.id);
    out.push({ id: v.id, name: v.name, words: v.words, text: v.text, updatedAt: v.updatedAt });
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_LESSONS);
}

export function readLessons(): Lesson[] {
  try {
    return cleanLessons(JSON.parse(window.localStorage.getItem(LESSONS_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

/** False when the browser refuses (private mode, storage full). */
export function writeLessons(lessons: readonly Lesson[]): boolean {
  try {
    window.localStorage.setItem(LESSONS_KEY, JSON.stringify(lessons));
    return true;
  } catch {
    return false;
  }
}

export function newLessonId(now: number = Date.now()): string {
  return `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newLesson(name: string, now: number = Date.now()): Lesson {
  return { id: newLessonId(now), name, words: "", text: "", updatedAt: now };
}

/** The backup file's text. */
export function lessonsFile(lessons: readonly Lesson[]): string {
  return JSON.stringify({ format: LESSONS_FILE_FORMAT, version: 1, lessons }, null, 2);
}

/** Lessons from a backup file, or null when it is not one. */
export function parseLessonsFile(text: string): Lesson[] | null {
  try {
    const data = JSON.parse(text) as { format?: unknown; lessons?: unknown };
    if (data?.format !== LESSONS_FILE_FORMAT) return null;
    return cleanLessons(data.lessons);
  } catch {
    return null;
  }
}

/** Imported lessons added to the current ones; an imported lesson with the same id replaces it. */
export function mergeLessons(current: readonly Lesson[], imported: readonly Lesson[]): Lesson[] {
  const ids = new Set(imported.map((l) => l.id));
  return cleanLessons([...imported, ...current.filter((l) => !ids.has(l.id))]);
}
