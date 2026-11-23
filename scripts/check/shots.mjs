// Screenshots for PRs and acceptance (`pnpm shots`, after `pnpm run build`).
// Starts `next start` on a free port and takes full-page PNGs in the system
// Chrome (playwright-core, never `playwright install`) of: home, /lesson with
// scripts/perf/fixtures/handout.txt pasted, and every tool in TOOL_GROUPS
// (read from lib/links.ts). Each page at 1440 desktop and 390 phone, light and
// dark (prefers-color-scheme; the site's default theme mode is "system").
// Output: shots/<page>-<desktop|phone>-<light|dark>.png (gitignored).
// Exit 1 on status != 200, console error or page error (the analytics 404 is
// ignored, as in smoke.mjs). Optional args: page paths to shoot only those,
// e.g. `pnpm shots /lesson /tools/anki`.
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { Launcher } from "chrome-launcher";
import { chromium } from "playwright-core";

const ROOT = new URL("../../", import.meta.url);
const OUT = new URL("shots/", ROOT).pathname;
const PAGE_TIMEOUT = 30_000;
const SERVER_TIMEOUT = 30_000;
const PARALLEL = 4;
const KNOWN_ERROR_URL = "/_vercel/insights/script.js";
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, isMobile: false },
  { name: "phone", width: 390, height: 844, isMobile: true },
];
const SCHEMES = ["light", "dark"];
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

/** TOOL_GROUPS hrefs in menu order, read from lib/links.ts so new tools are picked up. */
function toolGroupPaths() {
  const src = readFileSync(new URL("lib/links.ts", ROOT), "utf8");
  const hrefs = Object.fromEntries([...src.matchAll(/^\s+(\w+): "(\/tools\/[^"]+)",$/gm)].map((m) => [m[1], m[2]]));
  const block = src.match(/TOOL_GROUPS[^=]*=\s*\(\s*\[([\s\S]*?)\]\s*as const/)?.[1];
  if (!block) throw new Error("TOOL_GROUPS not found in lib/links.ts");
  return [...block.matchAll(/tools: \[([^\]]*)\]/g)].flatMap((g) =>
    [...g[1].matchAll(/"(\w+)"/g)].map((m) => {
      if (!hrefs[m[1]]) throw new Error(`no HREF for tool ${m[1]}`);
      return hrefs[m[1]];
    }),
  );
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

function shotName(path) {
  return path === "/" ? "home" : path.replace(/^\//, "").replace(/^tools\//, "").replaceAll("/", "-");
}

/** Same paste as the smoke flow: new lesson, paste the handout, wait for the word table. */
async function pasteHandout(page) {
  const box = page.getByPlaceholder("Ctrl+A, Ctrl+C trong Word", { exact: false });
  await box.waitFor({ state: "visible", timeout: PAGE_TIMEOUT });
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
  await page.waitForFunction(
    () => {
      const words = document.querySelector('textarea[placeholder^="学习"]')?.value.split("\n").filter((l) => l.trim());
      const n = document.querySelector("#lesson-panel table")?.querySelectorAll("tbody tr").length;
      return words?.length && n === words.length;
    },
    null,
    { timeout: PAGE_TIMEOUT },
  );
}

/** One page, one viewport, one scheme → one PNG. Returns the problems seen. */
async function shoot(browser, base, path, vp, scheme) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile,
    hasTouch: vp.isMobile,
    deviceScaleFactor: 1,
    colorScheme: scheme,
  });
  const page = await context.newPage();
  const problems = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    if ((msg.location()?.url ?? "").includes(KNOWN_ERROR_URL)) return;
    problems.push(`console error: ${msg.text().slice(0, 200)}`);
  });
  page.on("pageerror", (err) => problems.push(`page error: ${String(err.message ?? err).slice(0, 200)}`));
  try {
    const res = await page.goto(new URL(path, base).href, { waitUntil: "load", timeout: PAGE_TIMEOUT });
    if (res?.status() !== 200) problems.unshift(`status ${res?.status()}`);
    await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
    if (path === "/lesson") await pasteHandout(page);
    // Let fonts and entry animations settle.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}${shotName(path)}-${vp.name}-${scheme}.png`, fullPage: true });
  } catch (e) {
    problems.push(String(e.message ?? e).split("\n")[0]);
  } finally {
    await context.close();
  }
  return problems;
}

async function main() {
  const chromePath = process.env.CHROME_PATH || Launcher.getFirstInstallation();
  if (!chromePath) throw new Error("Chrome not found; set CHROME_PATH=/path/to/chrome");
  const only = process.argv.slice(2);
  const paths = only.length ? only : ["/", "/lesson", ...toolGroupPaths()];
  if (!only.length) rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

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
  let count = 0;
  const t0 = Date.now();
  try {
    await waitForServer(base, server);
    console.log(`shots: ${paths.length} pages × ${VIEWPORTS.length * SCHEMES.length} → shots/`);
    browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ["--no-sandbox"] });
    const jobs = paths.flatMap((path) => VIEWPORTS.flatMap((vp) => SCHEMES.map((scheme) => ({ path, vp, scheme }))));
    await Promise.all(
      Array.from({ length: PARALLEL }, async () => {
        for (let job = jobs.shift(); job; job = jobs.shift()) {
          const problems = await shoot(browser, base, job.path, job.vp, job.scheme);
          const label = `${job.path} ${job.vp.name} ${job.scheme}`;
          if (problems.length) failed++;
          else count++;
          console.log(`${problems.length ? "FAIL" : "ok  "} ${label}${problems.length ? ` — ${problems.join("; ")}` : ""}`);
        }
      }),
    );
  } catch (e) {
    failed++;
    console.log(`FAIL shots setup — ${e.message ?? e}`);
    if (serverErr) console.log(serverErr.slice(-1000));
  } finally {
    await browser?.close().catch(() => {});
    kill();
  }
  console.log(`shots: ${count} PNGs${failed ? `, ${failed} failed` : ""} in ${((Date.now() - t0) / 1000).toFixed(1)}s → shots/`);
  process.exit(failed ? 1 : 0);
}

main();
