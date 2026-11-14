// Page-load measurements with Lighthouse (lab data, run from this machine).
// Mobile uses Lighthouse's default simulated throttling (slow 4G, 4x CPU);
// desktop uses its desktop preset. Nothing is sent anywhere but the site.
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import { median } from "./stats.mjs";

export const PAGES = ["/", "/lesson", "/tools/reader", "/tools/anki", "/tools/stroke-order", "/tools/lookup"];

const METRICS = {
  score: (lhr) => Math.round((lhr.categories.performance.score ?? 0) * 100),
  ttfb: (lhr) => lhr.audits["server-response-time"].numericValue,
  fcp: (lhr) => lhr.audits["first-contentful-paint"].numericValue,
  lcp: (lhr) => lhr.audits["largest-contentful-paint"].numericValue,
  tbt: (lhr) => lhr.audits["total-blocking-time"].numericValue,
  cls: (lhr) => lhr.audits["cumulative-layout-shift"].numericValue,
  bytes: (lhr) => lhr.audits["total-byte-weight"].numericValue,
};

function largest(lhr, n = 5) {
  const items = lhr.audits["network-requests"]?.details?.items ?? [];
  return [...items]
    .sort((a, b) => (b.transferSize ?? 0) - (a.transferSize ?? 0))
    .slice(0, n)
    .map((r) => ({ url: r.url, type: r.resourceType, transferSize: r.transferSize ?? 0 }));
}

/** Lighthouse on every page, `runs` times each; the median of each metric is reported. */
export async function runLighthouse({ baseUrl, runs, preset, chromePath, log }) {
  const chrome = await chromeLauncher.launch({
    chromePath,
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });
  const results = [];
  try {
    for (const path of PAGES) {
      const url = new URL(path, baseUrl).href;
      const perRun = [];
      for (let i = 0; i < runs; i++) {
        log(`lighthouse ${preset} ${path} run ${i + 1}/${runs}`);
        const flags = { port: chrome.port, output: "json", logLevel: "error", onlyCategories: ["performance"] };
        const { lhr } = await lighthouse(url, flags, preset === "desktop" ? desktopConfig : undefined);
        if (lhr.runtimeError) {
          perRun.push({ error: `${lhr.runtimeError.code}: ${lhr.runtimeError.message}` });
          continue;
        }
        const m = Object.fromEntries(Object.entries(METRICS).map(([k, f]) => [k, f(lhr)]));
        perRun.push({ ...m, largest: largest(lhr) });
      }
      const ok = perRun.filter((r) => !r.error);
      const med = ok.length ? Object.fromEntries(Object.keys(METRICS).map((k) => [k, median(ok.map((r) => r[k]))])) : null;
      // The largest requests of the run whose score is closest to the median score.
      const typical = med ? ok.reduce((a, b) => (Math.abs(b.score - med.score) < Math.abs(a.score - med.score) ? b : a)) : null;
      results.push({
        path,
        median: med,
        largest: typical?.largest ?? [],
        runs: perRun.map(({ largest: _l, ...rest }) => rest),
      });
    }
  } finally {
    await chrome.kill();
  }
  return results;
}
