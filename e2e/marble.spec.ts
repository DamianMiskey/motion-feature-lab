import { expect, type Page, test } from "@playwright/test";
import { LEVELS, shortestPath, toBoard } from "@/app/marble/levels";

// Marble Maze, played by an autopilot: the same breadth-first search the unit
// tests use finds the route, and the test steers the marble along its corners
// with the arrow keys, reading the marble's position from the page.

// The marble's position, or null once the board is gone (the level is won).
const ball = async (page: Page) => {
  const value = await page.getByRole("application").getAttribute("data-ball", { timeout: 1_000 }).catch(() => null);
  return value ? value.split(",").map(Number) : null;
};

async function startLevel1(page: Page) {
  await page.goto("/marble");
  await page.locator("article section").nth(2).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Play" }).click({ timeout: 45_000 });
  await expect(page.getByRole("application")).toBeFocused();
  await page.waitForTimeout(3300); // 3, 2, 1, Go
}

test("the arrow keys tilt the board: right rolls the marble right", async ({ page }) => {
  await startLevel1(page);
  const [x0] = (await ball(page))!;
  await page.keyboard.down("ArrowRight");
  // Wait for it rather than for a fixed time: physics runs at the frame
  // rate, which drops when the test machine is busy.
  await expect.poll(async () => (await ball(page))![0], { timeout: 8_000 }).toBeGreaterThan(x0 + 0.5);
  await page.keyboard.up("ArrowRight");
});

test("level 1 can be finished, and is scored with Rive stars", async ({ page }) => {
  test.setTimeout(120_000);
  await startLevel1(page);
  const level = LEVELS[0];
  const route = shortestPath(level)!;
  // Keep only the corners: where the route changes direction, and the goal.
  const corners = route.filter((p, i) => {
    const prev = route[i - 1], next = route[i + 1];
    return !prev || !next || (prev.row === p.row) !== (p.row === next.row);
  }).slice(1).map((p) => toBoard(level, p.row, p.col));

  const held = new Set<string>();
  const hold = async (keys: string[]) => {
    for (const k of [...held]) if (!keys.includes(k)) { await page.keyboard.up(k); held.delete(k); }
    for (const k of keys) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); }
  };
  const won = page.getByRole("heading", { name: "Made it!" });
  route: for (const target of corners) {
    for (let step = 0; step < 150; step++) {
      const position = await ball(page);
      if (!position || (await won.isVisible())) break route;
      const [x, z] = position;
      const dx = target.x - x, dz = target.z - z;
      if (Math.hypot(dx, dz) < 0.3) break;
      // Steer along the axis with further to go; near the corner, ease off.
      const keys = Math.abs(dx) > Math.abs(dz) ? [dx > 0 ? "ArrowRight" : "ArrowLeft"] : [dz > 0 ? "ArrowDown" : "ArrowUp"];
      await hold(keys);
      await page.waitForTimeout(Math.hypot(dx, dz) < 1 ? 40 : 100);
      if (Math.hypot(dx, dz) < 1) await hold([]);
    }
  }
  await hold([]);
  await expect(won).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("img", { name: /out of 5 stars/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Next maze" })).toBeVisible();
});
