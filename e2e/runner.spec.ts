import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

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

test("a finished run goes on the leaderboard, retried with the same Idempotency-Key", async ({ page, scores }) => {
  scores.failNext = 1; // the first attempt fails: the game must retry, with the same key
  await launch(page);
  await expect(page.getByRole("button", { name: "Fly again" })).toBeVisible({ timeout: 45_000 });
  const board = page.getByTestId("leaderboard");
  await expect(board).toContainText("No scores yet");
  await board.getByLabel("Your initials").fill("ab1c");
  await expect(board.getByLabel("Your initials")).toHaveValue("ABC");
  await board.getByRole("button", { name: "Submit score" }).click();
  await expect(board.getByRole("status")).toHaveText("On the board at #1!", { timeout: 10_000 });
  expect(scores.submissions).toHaveLength(2);
  expect(scores.submissions[0]).toMatchObject({ game: "runner", initials: "ABC" });
  expect(scores.submissions[0].value).toBeGreaterThan(0);
  expect(scores.submissions[1].key).toBe(scores.submissions[0].key);
  expect(scores.submissions[0].key).toMatch(/^"[0-9a-f-]{36}"$/);

  // The next run gets a new key, and the initials are remembered.
  await page.getByRole("button", { name: "Fly again" }).click();
  await expect(page.getByRole("button", { name: "Fly again" })).toBeVisible({ timeout: 45_000 });
  await expect(board.getByLabel("Your initials")).toHaveValue("ABC");
  await board.getByRole("button", { name: "Submit score" }).click();
  await expect(board.getByRole("status")).toContainText("On the board");
  expect(scores.submissions[2].key).not.toBe(scores.submissions[0].key);
});
