import { describe, expect, it } from "vitest";

import { feedbackUrl } from "./feedback";
import { REPO_URL } from "./links";

describe("feedbackUrl", () => {
  it("opens a new GitHub issue, pre-filled when asked", () => {
    expect(feedbackUrl()).toBe(`${REPO_URL}/issues/new`);
    const url = new URL(feedbackUrl("Góp ý mẹo nhớ: 休", "Chữ: 休\n"));
    expect(url.pathname.endsWith("/issues/new")).toBe(true);
    expect(url.searchParams.get("title")).toBe("Góp ý mẹo nhớ: 休");
    expect(url.searchParams.get("body")).toBe("Chữ: 休\n");
  });
});
