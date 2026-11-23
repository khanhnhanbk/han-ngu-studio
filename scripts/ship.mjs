// `pnpm ship [pr-number]`: the whole after-PR routine in one command.
// 1. wait for the PR's checks (Vercel preview) to pass, 2. squash-merge and
// delete the branch, 3. switch to an up-to-date main, 4. wait until Vercel's
// Production deployment is on the new main sha, 5. check that the live
// /, /en, /lesson, /sitemap.xml return 200. Prints one line per step, every
// wait has a timeout; exit 1 on any failure (nothing is retried blindly).
// Default PR = the one for the current branch. Run `pnpm check` before opening the PR.
import { execFileSync } from "node:child_process";

const REPO = "khanhnhanbk/han-ngu-studio";
const SITE = "https://han-ngu-studio.vercel.app";
const PAGES = ["/", "/en", "/lesson", "/sitemap.xml"];
const CHECKS_TIMEOUT = 10 * 60_000;
const DEPLOY_TIMEOUT = 6 * 60_000;
const POLL = 15_000;

const t0 = Date.now();
const secs = () => `${Math.round((Date.now() - t0) / 1000)}s`;
const sh = (cmd, args, opts = {}) => execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
const gh = (...args) => sh("gh", args);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function fail(msg) {
  console.log(`FAIL ${msg} (${secs()})`);
  process.exit(1);
}

async function main() {
  const pr = JSON.parse(gh("pr", "view", ...(process.argv[2] ? [process.argv[2]] : []), "--json", "number,state,title,url"));
  if (pr.state !== "OPEN") fail(`PR #${pr.number} is ${pr.state}`);
  console.log(`ship: PR #${pr.number} ${pr.title}`);

  // 1. Checks. gh pr checks exits 8 while pending, 1 on failure.
  for (const until = Date.now() + CHECKS_TIMEOUT; ; ) {
    let rows;
    try {
      rows = JSON.parse(gh("pr", "checks", String(pr.number), "--json", "name,bucket"));
    } catch (e) {
      rows = JSON.parse(e.stdout || "[]");
    }
    const bad = rows.filter((r) => r.bucket === "fail" || r.bucket === "cancel");
    if (bad.length) fail(`checks failed: ${bad.map((r) => r.name).join(", ")} → ${pr.url}`);
    const pending = rows.filter((r) => r.bucket === "pending");
    if (rows.length && !pending.length) {
      console.log(`ok   checks: ${rows.map((r) => r.name).join(", ")} (${secs()})`);
      break;
    }
    if (Date.now() > until) fail(`checks still pending after ${CHECKS_TIMEOUT / 60_000} min`);
    console.log(`...  waiting for checks: ${pending.map((r) => r.name).join(", ") || "not started"} (${secs()})`);
    await sleep(POLL);
  }

  // 2–3. Merge, then local main.
  gh("pr", "merge", String(pr.number), "--squash", "--delete-branch");
  sh("git", ["checkout", "-q", "main"]);
  sh("git", ["pull", "-q", "--ff-only"]);
  const sha = sh("git", ["rev-parse", "HEAD"]);
  console.log(`ok   merged → main ${sha.slice(0, 7)} (${secs()})`);

  // 4. Production deployment on that sha.
  for (const until = Date.now() + DEPLOY_TIMEOUT; ; ) {
    const dep = JSON.parse(gh("api", `repos/${REPO}/deployments?sha=${sha}&environment=Production`, "--jq", ".[0] // null"));
    const state = dep ? gh("api", `repos/${REPO}/deployments/${dep.id}/statuses`, "--jq", ".[0].state // \"pending\"") : "not created";
    if (state === "success") {
      console.log(`ok   Production deployed ${sha.slice(0, 7)} (${secs()})`);
      break;
    }
    if (state === "failure" || state === "error") fail(`Production deployment ${state}; see https://vercel.com/dashboard`);
    if (Date.now() > until) fail(`Production deployment still "${state}" after ${DEPLOY_TIMEOUT / 60_000} min`);
    console.log(`...  waiting for Production deployment: ${state} (${secs()})`);
    await sleep(POLL);
  }

  // 5. Live pages.
  const results = await Promise.all(
    PAGES.map(async (p) => [p, await fetch(SITE + p, { redirect: "manual", signal: AbortSignal.timeout(20_000) }).then((r) => r.status, (e) => String(e.name))]),
  );
  for (const [p, status] of results) console.log(`${status === 200 ? "ok  " : "FAIL"} ${SITE}${p} ${status}`);
  if (results.some(([, s]) => s !== 200)) fail("live pages");
  console.log(`ship: done in ${secs()}`);
}

main().catch((e) => fail(String(e.stderr || e.message || e).split("\n")[0]));
