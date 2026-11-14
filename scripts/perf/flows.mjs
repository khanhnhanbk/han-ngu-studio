// Time-to-result flows: how long a person waits after a click, on an emulated
// mid-range phone (Pixel 7 screen, CPU 4x slower via CDP, ~4G network).
// Times are taken inside the page (performance.now() from the click/paste to
// the first animation frame where the result is on screen), so Playwright's
// own overhead is left out. Flow A crosses a page change and is timed from Node.
import { readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import { chromium, devices } from "playwright-core";
import { median } from "./stats.mjs";

const here = new URL("./fixtures/", import.meta.url);
const HANDOUT = readFileSync(new URL("handout.txt", here), "utf8");
const READER_TEXT = readFileSync(new URL("reader.txt", here), "utf8").trim();
/** The handout's word lines ("1. 商店 shāngdiàn – cửa hàng"), without the numbering. */
const HANDOUT_WORDS = HANDOUT.split("\n")
  .filter((l) => /^\d+\.\s/.test(l))
  .map((l) => l.replace(/^\d+\.\s*/, ""));
const HANDOUT_TEXT = HANDOUT.split("\n")
  .filter((l) => /：/.test(l))
  .join("\n");
const TWENTY_WORDS = HANDOUT_WORDS.slice(0, 20).join("\n");
const TWENTY_CHARS = Array.from("我你他好人大小中国学生日月水火山口手心爱").join("\n");

/** ~4G as in the plan: 9 Mbps down, 1.5 Mbps up, 60 ms round trip. */
export const NETWORK = { latency: 60, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8 };
export const CPU_SLOWDOWN = 4;
export const DEVICE = "Pixel 7";

const TIMEOUT = 90_000;

/** Runs in the page before any of its scripts. */
function instrument() {
  const perf = {
    t0: null,
    armed: false,
    printed: null,
    downloads: [],
    prompts: 0,
    arm() {
      this.armed = true;
      this.t0 = null;
    },
    since() {
      return performance.now() - this.t0;
    },
  };
  window.__perf = perf;
  const start = () => {
    if (!perf.armed) return;
    perf.armed = false;
    perf.t0 = performance.now();
  };
  // pointerdown is the first event of a tap or click.
  addEventListener("pointerdown", start, true);
  window.print = () => {
    perf.printed = performance.now();
  };
  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.download) perf.downloads.push({ at: performance.now(), name: this.download });
    return click.call(this);
  };
  // "Tải dữ liệu?" (large-download prompt): answer yes at once and count it,
  // so the time is the site's, not a person's reading time.
  const watch = () =>
    new MutationObserver(() => {
      const dialog = document.querySelector('[role="alertdialog"]');
      const yes = dialog?.querySelector(".btn-primary");
      if (yes && !yes.dataset.perfClicked) {
        yes.dataset.perfClicked = "1";
        perf.prompts++;
        yes.click();
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.documentElement) watch();
  else addEventListener("DOMContentLoaded", watch);
}

async function throttle(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, ...NETWORK });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_SLOWDOWN });
}

/** Waits for `fn` (run in the page every frame) to return a number: the ms since __perf.t0. */
async function until(page, fn, arg) {
  try {
    const handle = await page.waitForFunction(fn, arg, { polling: "raf", timeout: TIMEOUT });
    return await handle.jsonValue();
  } catch (e) {
    if (process.env.PERF_DEBUG) console.log("[perf] state at timeout:", await page.evaluate(() => JSON.stringify(window.__perf)).catch(() => "?"));
    throw e;
  }
}

/** The element is in the DOM and React has hydrated it (event handlers attached). */
async function hydrated(locator) {
  await locator.waitFor({ state: "visible", timeout: TIMEOUT });
  await locator.evaluate(
    (el) =>
      new Promise((resolve) => {
        const check = () =>
          Object.keys(el).some((k) => k.startsWith("__reactProps")) ? resolve() : requestAnimationFrame(check);
        check();
      }),
  );
}

async function arm(page) {
  await page.evaluate(() => window.__perf.arm());
}

const pasteBox = (page) => page.getByPlaceholder("Ctrl+A, Ctrl+C trong Word", { exact: false });
const wordsBox = (page) => page.locator('textarea[placeholder^="学习"]');
const textBox = (page) => page.getByPlaceholder("Dán đoạn hội thoại hoặc bài đọc trong giáo trình…");

/** Open Soạn bài and start an empty lesson (setup, not timed). */
async function newLesson(page, base) {
  await page.goto(new URL("/lesson", base).href);
  await hydrated(pasteBox(page));
  await page.getByRole("button", { name: "+ Bài mới" }).click();
  await page.waitForFunction(() => document.querySelector('textarea[placeholder^="学习"]')?.value === "");
}

async function lessonWithWords(page, base, words) {
  await newLesson(page, base);
  await wordsBox(page).fill(words);
  // The embedded tools pick up the words once typing has paused for 600 ms.
  await page.waitForTimeout(900);
}

/** Waits for a file download (link click with `download`), or the "text was shrunk" question on slides. */
async function downloadOrAsk(page, askButton) {
  return until(
    page,
    (ask) => {
      const p = window.__perf;
      if (p.downloads.length) return { ms: p.downloads[0].at - p.t0, asked: false };
      const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === ask);
      if (btn) return { ms: p.since(), asked: true };
      return null;
    },
    askButton,
  );
}

async function fileInfo(download) {
  const path = await download.path();
  return { name: download.suggestedFilename(), bytes: path ? (await stat(path)).size : null };
}

export const FLOWS = [
  {
    id: "A",
    name: "Trang chủ → bấm Soạn bài → ô dán sẵn sàng",
    target: 2500,
    async run(page, base) {
      await page.goto(base);
      // On a phone the Navbar's "Soạn bài" sits in the menu; the first visible link to /lesson is the page's own button.
      const link = page.locator('a[href="/lesson"]:visible').first();
      await link.waitFor({ timeout: TIMEOUT });
      const label = (await link.textContent())?.trim();
      await link.scrollIntoViewIfNeeded();
      const t0 = Date.now();
      await link.click();
      await page.waitForURL("**/lesson", { timeout: TIMEOUT });
      await hydrated(pasteBox(page));
      return { ms: Date.now() - t0, note: `link “${label}”` };
    },
  },
  {
    id: "B1",
    name: "Soạn bài: dán cả bài ~30 từ → bảng từ đầy đủ",
    target: 1000,
    async run(page, base) {
      await newLesson(page, base);
      const box = pasteBox(page);
      const ms0 = await box.evaluate((el, text) => {
        window.__perf.t0 = performance.now();
        const data = new DataTransfer();
        data.setData("text/plain", text);
        el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
        return 0;
      }, HANDOUT);
      const ms = await until(page, () => {
        const words = document.querySelector('textarea[placeholder^="学习"]')?.value.split("\n").filter((l) => l.trim());
        // The panel holds the screen table and a print-only copy; count the first.
        const rows = document.querySelector("#lesson-panel table")?.querySelectorAll("tbody tr").length;
        return words?.length && rows === words.length ? window.__perf.since() : null;
      });
      const rows = await page.locator("#lesson-panel table").first().locator("tbody tr").count();
      return { ms: ms + ms0, note: `${rows} rows` };
    },
  },
  {
    id: "B2",
    name: "Soạn bài: Lấy từ trong đoạn văn → danh sách từ",
    target: 1000,
    async run(page, base) {
      await newLesson(page, base);
      await textBox(page).fill(HANDOUT_TEXT);
      await arm(page);
      await page.getByRole("button", { name: "Lấy từ trong đoạn văn →" }).click();
      const ms = await until(page, () => {
        const note = [...document.querySelectorAll('[aria-live="polite"]')].map((n) => n.textContent).join(" ");
        return /Đã thêm|Không có từ mới/.test(note) ? window.__perf.since() : null;
      });
      const words = (await wordsBox(page).inputValue()).split("\n").filter(Boolean).length;
      return { ms, note: `${words} words` };
    },
  },
  {
    id: "B3",
    name: "Soạn bài: tải .pptx mẫu “Ba trang mỗi từ”, 20 từ",
    target: 3000,
    async run(page, base) {
      await lessonWithWords(page, base, TWENTY_WORDS);
      await page.getByRole("tab", { name: "Slide" }).click();
      await page.getByRole("radio", { name: /Ba trang mỗi từ/ }).check();
      const event = page.waitForEvent("download", { timeout: TIMEOUT });
      await arm(page);
      await page.getByRole("button", { name: "Tải slide (.pptx)" }).click();
      const got = await downloadOrAsk(page, "Vẫn tải về (.pptx)");
      if (got.asked) await page.getByRole("button", { name: "Vẫn tải về (.pptx)" }).click();
      const file = await fileInfo(await event);
      return {
        ms: got.ms,
        note: `${file.name} ${Math.round(file.bytes / 1024)} KB${got.asked ? "; timed to the “text was shrunk” question, deck already made" : ""}`,
      };
    },
  },
  {
    id: "B4",
    name: "Soạn bài: tải .apkg 20 từ, có giọng đọc, không ảnh",
    target: 5000,
    async run(page, base) {
      await lessonWithWords(page, base, TWENTY_WORDS);
      await page.getByRole("tab", { name: "Thẻ Anki" }).click();
      const build = page.getByRole("button", { name: "Tạo bộ thẻ", exact: true });
      await build.waitFor({ timeout: TIMEOUT });
      await page.waitForFunction(
        () => [...document.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Tạo bộ thẻ" && !b.disabled),
        null,
        { timeout: TIMEOUT },
      );
      await arm(page);
      await build.click();
      const apkg = page.getByRole("button", { name: "Tải bộ thẻ Anki (.apkg)" });
      const buildMs = await until(page, () =>
        [...document.querySelectorAll("button")].some((b) => b.textContent?.includes("Tải bộ thẻ Anki (.apkg)") && !b.disabled)
          ? window.__perf.since()
          : null,
      );
      const audio = page.getByRole("checkbox", { name: /Kèm giọng đọc người thật/ });
      if (!(await audio.isChecked())) await audio.check();
      const event = page.waitForEvent("download", { timeout: TIMEOUT });
      await arm(page);
      await apkg.click();
      const ms = await until(page, () => {
        const p = window.__perf;
        return p.downloads.length ? p.downloads[0].at - p.t0 : null;
      });
      const file = await fileInfo(await event);
      return { ms, note: `${file.name} ${Math.round(file.bytes / 1024)} KB; “Tạo bộ thẻ” before it took ${Math.round(buildMs)} ms` };
    },
  },
  {
    id: "B5",
    name: "Soạn bài: Phiếu tập viết 20 chữ → hộp thoại in",
    target: 3000,
    async run(page, base) {
      await lessonWithWords(page, base, TWENTY_CHARS);
      await arm(page);
      await page.getByRole("tab", { name: "Phiếu tập viết" }).click();
      const print = page.getByRole("button", { name: "In / Tải PDF" });
      const readyMs = await until(page, () =>
        [...document.querySelectorAll("button")].some((b) => b.textContent?.trim() === "In / Tải PDF" && !b.disabled)
          ? window.__perf.since()
          : null,
      );
      await print.click();
      const ms = await until(page, () => (window.__perf.printed ? window.__perf.printed - window.__perf.t0 : null));
      return { ms, note: `from opening the tab; print button ready after ${Math.round(readyMs)} ms` };
    },
  },
  {
    id: "C",
    name: "Đọc hiểu: 300 chữ → tô màu HSK xong",
    target: 1500,
    tapTarget: 200,
    async run(page, base) {
      await page.goto(new URL("/tools/reader", base).href);
      const read = page.getByRole("button", { name: "Đọc", exact: true });
      await hydrated(read);
      await page.waitForFunction(
        () => [...document.querySelectorAll("button")].some((b) => b.textContent?.trim() === "Đọc" && !b.disabled),
        null,
        { timeout: TIMEOUT },
      );
      await page.getByPlaceholder("Dán văn bản tiếng Trung vào đây…").fill(READER_TEXT);
      await arm(page);
      await read.click();
      const ms = await until(page, () => {
        const list = [...document.querySelectorAll("main button[aria-label]")].filter(
          (b) => (b.getAttribute("aria-label") ?? "").split(", ").length >= 3,
        );
        return list.length > 50 && list[0].getAttribute("aria-label").startsWith("今天") ? window.__perf.since() : null;
      });
      // Tap one word → its card. (Mark the 7th word so Playwright can click it.)
      const count = await page.evaluate(() => {
        const list = [...document.querySelectorAll("main button[aria-label]")].filter(
          (b) => (b.getAttribute("aria-label") ?? "").split(", ").length >= 3,
        );
        list[6].setAttribute("data-perf-tap", "1");
        return list.length;
      });
      await arm(page);
      await page.locator('[data-perf-tap="1"]').click();
      const tapMs = await until(page, () => {
        // The Navbar's settings panel is also a (hidden) dialog: wait for a visible one.
        const card = [...document.querySelectorAll('[role="dialog"]')].some((d) => d.getBoundingClientRect().height > 0);
        return card ? window.__perf.since() : null;
      });
      return { ms, tapMs, note: `${count} words` };
    },
  },
  {
    id: "D",
    name: "Tra từ: tra một từ → kết quả",
    target: 1000,
    async run(page, base) {
      await page.goto(new URL("/tools/lookup", base).href);
      const input = page.getByLabel("Từ hoặc chữ cần tra");
      await hydrated(input);
      await input.fill("商店");
      await arm(page);
      await page.getByRole("button", { name: "Tra", exact: true }).click();
      const ms = await until(page, () =>
        document.querySelector("h2.hanzi")?.textContent === "商店" ? window.__perf.since() : null,
      );
      return { ms, note: "商店" };
    },
  },
  {
    id: "E",
    name: "Thứ tự nét: tra một chữ → hoạt hình bắt đầu",
    target: 1000,
    async run(page, base) {
      await page.goto(new URL("/tools/stroke-order", base).href);
      const input = page.getByLabel("Chữ Hán cần tra (tối đa 20 chữ)");
      await hydrated(input);
      // The page draws its sample first; mark that drawing so only the new one counts.
      await page.waitForFunction(() => document.querySelector("svg clipPath"), null, { timeout: TIMEOUT });
      await page.evaluate(() => document.querySelectorAll("svg").forEach((s) => s.setAttribute("data-perf-old", "1")));
      await input.fill("爱");
      await arm(page);
      await page.getByRole("button", { name: "Tra", exact: true }).click();
      const ms = await until(page, () =>
        document.querySelector("svg:not([data-perf-old]) clipPath") ? window.__perf.since() : null,
      );
      return { ms, note: "爱 (Hanzi Writer drawing created, animateCharacter called)" };
    },
  },
];

async function attempt(flow, page, base) {
  try {
    return await flow.run(page, base);
  } catch (e) {
    return { error: String(e?.message ?? e).split("\n")[0] };
  }
}

/**
 * Each run: a fresh browser context (empty cache and storage) runs the flow
 * once ("cold"), then a second page in the same context runs it again ("warm").
 */
export async function runFlows({ baseUrl, runs, only, chromePath, log }) {
  const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ["--no-sandbox"] });
  const results = [];
  try {
    for (const flow of FLOWS.filter((f) => !only || only.includes(f.id))) {
      const cold = [];
      const warm = [];
      for (let i = 0; i < runs; i++) {
        const context = await browser.newContext({ ...devices[DEVICE], acceptDownloads: true, locale: "vi-VN" });
        await context.addInitScript(instrument);
        for (const [kind, list] of [
          ["cold", cold],
          ["warm", warm],
        ]) {
          log(`flow ${flow.id} ${kind} run ${i + 1}/${runs}`);
          const page = await context.newPage();
          await throttle(page);
          const r = await attempt(flow, page, baseUrl);
          r.prompts = await page.evaluate(() => window.__perf?.prompts ?? 0).catch(() => 0);
          list.push(r);
          log(`  → ${r.error ? `error: ${r.error}` : `${Math.round(r.ms)} ms${r.tapMs ? `, tap ${Math.round(r.tapMs)} ms` : ""}`}`);
          await page.close();
        }
        await context.close();
      }
      const summary = (list) => ({
        ms: median(list.map((r) => r.ms)),
        tapMs: median(list.map((r) => r.tapMs)),
        errors: list.filter((r) => r.error).length,
      });
      results.push({
        id: flow.id,
        name: flow.name,
        target: flow.target,
        tapTarget: flow.tapTarget ?? null,
        cold: { ...summary(cold), runs: cold },
        warm: { ...summary(warm), runs: warm },
      });
    }
  } finally {
    await browser.close();
  }
  return results;
}
