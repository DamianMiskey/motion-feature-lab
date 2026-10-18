import { expect, test } from "@playwright/test";
import { overflow, PAGES, scrollThrough, waitForDemos, watchErrors } from "./helpers";

// Every page, on desktop and on a phone: it loads, every lazy demo mounts,
// nothing throws or gets blocked by the CSP, and nothing is wider than the
// screen (the bug the Draggable carousel once had).
for (const path of PAGES) {
  test(`${path} loads cleanly`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(path);
    await expect(page.locator("h1").first()).toBeVisible();
    await scrollThrough(page);
    await waitForDemos(page);
    expect(errors).toEqual([]);
    expect(await overflow(page), "page is wider than the screen").toBeLessThanOrEqual(0);
  });
}
