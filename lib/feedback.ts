import { REPO_URL } from "@/lib/links";

/**
 * A "new GitHub issue" link, pre-filled with what the reader is commenting on
 * (a story id, a character and its suggested memory trick). Nothing is sent
 * until the reader opens the link and submits the issue on GitHub; the
 * learner's own notes are never put in it.
 */
export function feedbackUrl(title = "", body = ""): string {
  const params = new URLSearchParams();
  if (title) params.set("title", title);
  if (body) params.set("body", body);
  const query = params.toString();
  return `${REPO_URL}/issues/new${query ? `?${query}` : ""}`;
}
