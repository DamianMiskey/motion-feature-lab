import { expect, type Page, test } from "@playwright/test";

// Starfield Runner in a real browser: it launches, the score climbs, the
// keys steer the ship, and standing still ends in a crash (by design: a ship
// that doesn't move lasts about two seconds).

const ship = async (page: Page) => (await page.getByRole("application").getAttribute("data-ship"))!.split(",").map(Number);

async function launch(page: Page) {
  await page.goto("/runner");
  await page.locator("article section").nth(2).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Launch" }).click({ timeout: 30_000 });
  await expect(page.getByRole("application")).toBeFocused();
}

test("the arrow keys steer the ship", async ({ page }) => {
  await launch(page);
  await expect.poll(async () => (await page.getByRole("application").getAttribute("data-ship")) !== null).toBe(true);
  const [x0] = await ship(page);
  await page.keyboard.down("ArrowLeft");
  await expect.poll(async () => (await ship(page))[0], { timeout: 5_000 }).toBeLessThan(x0 - 1);
  await page.keyboard.up("ArrowLeft");
});

test("the score climbs, and a ship that never moves crashes", async ({ page }) => {
  await launch(page);
  const score = page.locator("span.text-3xl span");
  await expect.poll(async () => Number(await score.textContent()), { timeout: 5_000 }).toBeGreaterThan(10);
  await expect(page.getByRole("heading", { name: /^Score \d+$/ })).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole("button", { name: "Fly again" })).toBeVisible();
});
