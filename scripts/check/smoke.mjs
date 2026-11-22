// Smoke test for `pnpm check` (runs after `pnpm run build`).
// Starts `next start` on a free port, opens every page once as a first-time
// visitor in the system Chrome (playwright-core, never `playwright install`)
// and fails on: status != 200, console errors, uncaught page errors, broken
// images, or the large-download prompt appearing. Then one real flow:
// /lesson → paste the perf handout → the word table has rows.
// Page list = /sitemap.xml served by the build (SITEMAP_PATHS, vi + /en) plus
// the HIDDEN_TOOLS pages read from lib/links.ts (both languages).
// Prints one line per page; exit 1 on any failure; the server is always killed.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { Launcher } from "chrome-launcher";
import { chromium } from "playwright-core";

const ROOT = new URL("../../", import.meta.url);
const PAGE_TIMEOUT = 20_000;
const SERVER_TIMEOUT = 30_000;
const PARALLEL = 4;
/** The only error we accept: analytics exists only on Vercel, so its script 404s locally. */
const KNOWN_ERROR_URL = "/_vercel/insights/script.js";

const HANDOUT = readFileSync(new URL("scripts/perf/fixtures/handout.txt", ROOT), "utf8");

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

/** Hidden tool hrefs, read from lib/links.ts so a new hidden tool is picked up. */
function hiddenToolPaths() {
  const src = readFileSync(new URL("lib/links.ts", ROOT), "utf8");
  const hrefs = Object.fromEntries([...src.matchAll(/^\s+(\w+): "(\/tools\/[^"]+)",$/gm)].map((m) => [m[1], m[2]]));
  const ids = src.match(/HIDDEN_TOOLS[^=]*=\s*\(\s*\[([^\]]*)\]/)?.[1];
  if (!ids) throw new Error("HIDDEN_TOOLS not found in lib/links.ts");
  return [...ids.matchAll(/"(\w+)"/g)].map((m) => {
    if (!hrefs[m[1]]) throw new Error(`no HREF for hidden tool ${m[1]}`);
    return hrefs[m[1]];
  });
}

async function pagePaths(base) {
  const xml = await (await fetch(new URL("/sitemap.xml", base))).text();
  const fromSitemap = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  if (fromSitemap.length < 10) throw new Error(`sitemap.xml lists only ${fromSitemap.length} pages`);
  const hidden = hiddenToolPaths().flatMap((p) => [p, `/en${p}`]);
  return [...new Set([...fromSitemap, ...hidden])];
}

async function waitForServer(base, server) {
  const until = Date.now() + SERVER_TIMEOUT;
  while (Date.now() < until) {
    if (server.exitCode !== null) throw new Error(`next start exited with code ${server.exitCode}`);
    try {
      if ((await fetch(base)).ok) return;
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`server not ready after ${SERVER_TIMEOUT / 1000}s`);
}

/** Collects console errors, page errors and failed image loads for one page. */
function watch(page) {
  const problems = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    if ((msg.location()?.url ?? "").includes(KNOWN_ERROR_URL)) return;
    problems.push(`console error: ${msg.text().slice(0, 200)}`);
  });
  page.on("pageerror", (err) => problems.push(`page error: ${String(err.message ?? err).slice(0, 200)}`));
  page.on("response", (res) => {
    if (res.request().resourceType() === "image" && res.status() >= 400) problems.push(`image ${res.status()}: ${res.url()}`);
  });
  return problems;
}

async function checkPage(context, base, path) {
  const page = await context.newPage();
  const problems = watch(page);
  try {
    const res = await page.goto(new URL(path, base).href, { waitUntil: "load", timeout: PAGE_TIMEOUT });
    if (res?.status() !== 200) problems.unshift(`status ${res?.status()}`);
    // Give hydration and lazy fetches a moment to report errors.
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
    const broken = await page.evaluate(() =>
      [...document.images].filter((img) => img.complete && img.currentSrc && img.naturalWidth === 0).map((img) => img.currentSrc),
    );
    for (const src of broken) problems.push(`broken image: ${src}`);
    if (await page.locator('[role="alertdialog"]').count()) problems.push("large-download prompt shown on first visit");
  } catch (e) {
    problems.push(String(e.message ?? e).split("\n")[0]);
  } finally {
    await page.close();
  }
  return problems;
}

/** /lesson → paste the handout → the word table shows one row per word. */
async function checkLessonFlow(context, base) {
  const page = await context.newPage();
  const problems = watch(page);
  try {
    await page.goto(new URL("/lesson", base).href, { waitUntil: "load", timeout: PAGE_TIMEOUT });
    const box = page.getByPlaceholder("Ctrl+A, Ctrl+C trong Word", { exact: false });
    await box.waitFor({ state: "visible", timeout: PAGE_TIMEOUT });
    // Wait for React to attach its handlers before pasting.
    await box.evaluate(
      (el) =>
        new Promise((resolve) => {
          const check = () => (Object.keys(el).some((k) => k.startsWith("__reactProps")) ? resolve() : requestAnimationFrame(check));
          check();
        }),
    );
    await page.getByRole("button", { name: "+ Bài mới" }).click();
    await box.evaluate((el, text) => {
      const data = new DataTransfer();
      data.setData("text/plain", text);
      el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    }, HANDOUT);
    const rows = await page
      .waitForFunction(
        () => {
          const words = document.querySelector('textarea[placeholder^="学习"]')?.value.split("\n").filter((l) => l.trim());
          const n = document.querySelector("#lesson-panel table")?.querySelectorAll("tbody tr").length;
          return words?.length && n === words.length ? n : null;
        },
        null,
        { timeout: PAGE_TIMEOUT },
      )
      .then((h) => h.jsonValue());
    if (!(rows > 0)) problems.push("word table is empty");
    return { problems, note: `${rows} rows` };
  } catch (e) {
    problems.push(String(e.message ?? e).split("\n")[0]);
    return { problems, note: "" };
  } finally {
    await page.close();
  }
}

async function main() {
  const chromePath = process.env.CHROME_PATH || Launcher.getFirstInstallation();
  if (!chromePath) throw new Error("Chrome not found; set CHROME_PATH=/path/to/chrome");
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const nextBin = new URL("node_modules/.bin/next", ROOT).pathname;
  const server = spawn(nextBin, ["start", "-p", String(port), "-H", "127.0.0.1"], {
    cwd: ROOT.pathname,
    stdio: ["ignore", "ignore", "pipe"],
    detached: true,
  });
  let serverErr = "";
  server.stderr.on("data", (d) => (serverErr += d));
  const kill = () => {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      /* already gone */
    }
  };
  process.on("exit", kill);
  for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => process.exit(130));

  let browser;
  let failed = 0;
  const t0 = Date.now();
  try {
    await waitForServer(base, server);
    const paths = await pagePaths(base);
    console.log(`smoke: ${paths.length} pages + lesson flow on ${base}`);
    browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ["--no-sandbox"] });
    // A fresh context per page = a first visit (empty localStorage: audio off, no saved lessons).
    const queue = [...paths];
    await Promise.all(
      Array.from({ length: PARALLEL }, async () => {
        for (let path = queue.shift(); path; path = queue.shift()) {
          const context = await browser.newContext();
          const problems = await checkPage(context, base, path);
          await context.close();
          if (problems.length) failed++;
          console.log(`${problems.length ? "FAIL" : "ok  "} ${path}${problems.length ? ` — ${problems.join("; ")}` : ""}`);
        }
      }),
    );
    const context = await browser.newContext();
    const flow = await checkLessonFlow(context, base);
    await context.close();
    if (flow.problems.length) failed++;
    console.log(`${flow.problems.length ? "FAIL" : "ok  "} flow /lesson paste handout → word table ${flow.note}${flow.problems.length ? ` — ${flow.problems.join("; ")}` : ""}`);
  } catch (e) {
    failed++;
    console.log(`FAIL smoke setup — ${e.message ?? e}`);
    if (serverErr) console.log(serverErr.slice(-1000));
  } finally {
    await browser?.close().catch(() => {});
    kill();
  }
  console.log(`smoke: ${failed ? `${failed} failed` : "all ok"} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  process.exit(failed ? 1 : 0);
}

main();
