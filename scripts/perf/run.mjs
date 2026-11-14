#!/usr/bin/env node
// pnpm perf [--url https://…] [--runs 3] [--label baseline] [--only lighthouse|flows] [--flows A,B1] [--pages /lesson,/tools/lookup] [--out docs/perf]
// Measures page load (Lighthouse) and time-to-result flows (Playwright) of the
// site and writes docs/perf/<date>-<label>.{json,md}. Uses an installed Chrome
// (CHROME_PATH, or the one chrome-launcher finds). Lab numbers from this machine
// only: nothing about visitors is collected.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { Launcher } from "chrome-launcher";
import { CPU_SLOWDOWN, DEVICE, NETWORK, runFlows } from "./flows.mjs";
import { runLighthouse } from "./lighthouse.mjs";
import { toMarkdown } from "./report.mjs";

const { values } = parseArgs({
  options: {
    url: { type: "string", default: "https://han-ngu-studio.vercel.app" },
    runs: { type: "string", default: "3" },
    label: { type: "string", default: "run" },
    only: { type: "string" },
    flows: { type: "string" },
    pages: { type: "string" },
    out: { type: "string", default: "docs/perf" },
    where: { type: "string", default: "máy của người chạy lệnh" },
  },
});

const runs = Math.max(1, Number.parseInt(values.runs, 10) || 3);
const baseUrl = values.url.replace(/\/+$/, "") + "/";
const chromePath = process.env.CHROME_PATH || Launcher.getFirstInstallation();
if (!chromePath) {
  console.error("Không tìm thấy Chrome. Đặt CHROME_PATH=/đường/dẫn/tới/chrome rồi chạy lại.");
  process.exit(1);
}
const log = (m) => console.log(`[perf] ${m}`);
const version = async (pkg) =>
  JSON.parse(await readFile(new URL(`../../node_modules/${pkg}/package.json`, import.meta.url), "utf8")).version;
const { execFileSync } = await import("node:child_process");
const browser = execFileSync(chromePath, ["--version"]).toString().trim();
const date = new Date().toISOString().slice(0, 10);

const result = {
  meta: {
    label: values.label,
    date,
    startedAt: new Date().toISOString(),
    baseUrl,
    runs,
    where: values.where,
    browser,
    lighthouseVersion: await version("lighthouse"),
    playwrightVersion: await version("playwright-core"),
    device: DEVICE,
    cpuSlowdown: CPU_SLOWDOWN,
    network: `${(NETWORK.downloadThroughput * 8) / 1024 / 1024} Mbps xuống, ${(NETWORK.uploadThroughput * 8) / 1024 / 1024} Mbps lên, ${NETWORK.latency} ms RTT`,
    command: `pnpm perf ${process.argv.slice(2).map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(" ")}`.trim(),
  },
};

const pages = values.pages ? values.pages.split(",").map((p) => p.trim()) : undefined;
if (values.only !== "flows") {
  result.lighthouse = {
    mobile: await runLighthouse({ baseUrl, runs, preset: "mobile", chromePath, log, pages }),
    desktop: await runLighthouse({ baseUrl, runs: 1, preset: "desktop", chromePath, log, pages }),
  };
}
if (values.only !== "lighthouse") {
  const only = values.flows ? values.flows.split(",").map((f) => f.trim()) : null;
  result.flows = await runFlows({ baseUrl, runs, only, chromePath, log });
}
result.meta.finishedAt = new Date().toISOString();

await mkdir(values.out, { recursive: true });
const file = `${values.out}/${date}-${values.label}`;
await writeFile(`${file}.json`, JSON.stringify(result, null, 2) + "\n");
await writeFile(`${file}.md`, toMarkdown(result));
log(`wrote ${file}.md and ${file}.json`);
