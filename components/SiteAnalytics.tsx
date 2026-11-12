"use client";

import { Analytics } from "@vercel/analytics/next";

/**
 * Page-view counts (Vercel Web Analytics, free Hobby tier; owner decision
 * 2026-11-12): which page was opened, from which site, on what kind of
 * device. No cookies, no accounts. Words and characters travel between pages
 * in the URL hash, so the hash and query string are cut off before anything
 * is sent: the text a user types never leaves the device (HARD RULE 4).
 */
export function SiteAnalytics() {
  return <Analytics beforeSend={(event) => ({ ...event, url: event.url.split(/[?#]/)[0] })} />;
}
