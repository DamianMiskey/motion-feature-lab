import { expect, type Page, test } from "@playwright/test";

// Stacker, played by an autopilot: it watches how far the sliding slab is
// from a perfect drop (mirrored on the page as data-offset) and presses Space
// at the right moment.

const offset = async (page: Page) => Number(await page.getByRole("application").getAttribute("data-offset"));

async function play(page: Page) {
  await page.goto("/stacker");
  await page.locator("article section").nth(2).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Play" }).click({ timeout: 30_000 });
  await expect(page.getByRole("application")).toBeFocused();
}

async function dropWhen(page: Page, ok: (o: number) => boolean) {
  // Each new slab starts at the far end (offset ≈ ±4.2). Until a frame has
  // drawn it, the page still shows the last slab's offset, so wait for the
  // fresh one before lining up.
  await expect.poll(async () => Math.abs(await offset(page)), { timeout: 5_000 }).toBeGreaterThan(2);
  for (let i = 0; i < 400; i++) {
    if (ok(await offset(page))) { await page.keyboard.press("Space"); return; }
    await page.waitForTimeout(5);
  }
  throw new Error("never lined up");
}

test("perfect drops build the tower and score Perfects", async ({ page }) => {
  await play(page);
  for (let n = 1; n <= 5; n++) {
    await dropWhen(page, (o) => Math.abs(o) < 0.05);
    await expect(page.getByLabel(`Height ${n}`)).toBeVisible();
  }
  await expect(page.locator(".pop")).toContainText("Perfect");
});

test("an offset drop trims the slab; a drop that misses ends the game", async ({ page }) => {
  await play(page);
  await dropWhen(page, (o) => o > 0.8 && o < 1.2); // lands, a third hangs over
  await expect(page.getByLabel("Height 1")).toBeVisible();
  await dropWhen(page, (o) => o > 3.5); // nowhere near the tower
  await expect(page.getByRole("heading", { name: /Height 1/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play again" })).toBeVisible();
});
