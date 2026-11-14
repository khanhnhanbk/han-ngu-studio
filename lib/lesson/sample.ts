import sample from "./sample.json";
import type { TableRow } from "./table";

/** The lesson a first visit to Soạn bài starts with. */
export const SAMPLE_TEXT = "A：你好！你叫什么名字？\nB：我叫李明。我是大学生，我喜欢学习汉语。\nA：认识你很高兴！我们做朋友吧。";
export const SAMPLE_WORDS = "名字\n大学生\n喜欢\n学习\n汉语\n认识\n高兴\n朋友";

/**
 * Its word table in Giản thể, built ahead of time by the same pipeline as the
 * "Bảng từ" tab (lib/lesson/sample.test.ts fails when the two differ;
 * `UPDATE_SAMPLES=1 pnpm test` rewrites it), so the page shows it without
 * downloading the dictionaries (~1.4 MB) on open.
 */
export const SAMPLE_ROWS: readonly TableRow[] = sample;
