import { expect, test } from "./fixtures";

// Every game has a full-screen button. Wherever the browser allows real full
// screen it's used; otherwise (iPhone) the game takes over the viewport. Either
// way the game must fill the screen, the page behind must not scroll, and
// Escape or the button must bring it back.
for (const path of ["/game", "/marble", "/stacker", "/runner"]) {
  test(`${path}: full screen and back`, async ({ page }) => {
    await page.goto(path);
    const button = page.getByRole("button", { name: "Full screen", exact: true });
    await button.scrollIntoViewIfNeeded();
    const stage = page.locator('[data-fullscreen]');
    await button.click();
    await expect(stage).not.toHaveAttribute("data-fullscreen", "off");
    const viewport = page.viewportSize()!;
    await expect.poll(async () => (await stage.boundingBox())?.height).toBeGreaterThanOrEqual(viewport.height - 2);
    const box = (await stage.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(viewport.width - 2);
    // The canvas follows the frame's new size.
    await expect.poll(async () => (await stage.locator("canvas").boundingBox())?.height ?? 0).toBeGreaterThan(viewport.height * 0.9);
    await page.getByRole("button", { name: "Exit full screen" }).click();
    await expect(stage).toHaveAttribute("data-fullscreen", "off");
    await expect.poll(async () => (await stage.boundingBox())?.height).toBeLessThan(viewport.height);
  });
}

test("takeover mode (as on iPhone): fills the screen, page can't scroll, Escape leaves", async ({ page }) => {
  // Pretend the browser has no element full screen, as iPhone Safari.
  await page.addInitScript(() => Object.defineProperty(Document.prototype, "fullscreenEnabled", { get: () => false }));
  await page.goto("/runner");
  const button = page.getByRole("button", { name: "Full screen", exact: true });
  await button.scrollIntoViewIfNeeded();
  await button.click();
  const stage = page.locator('[data-fullscreen]');
  await expect(stage).toHaveAttribute("data-fullscreen", "takeover");
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");
  const box = (await stage.boundingBox())!;
  expect(box.y).toBeLessThanOrEqual(1);
  await page.keyboard.press("Escape");
  await expect(stage).toHaveAttribute("data-fullscreen", "off");
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
});

test.describe("on a phone", () => {
  // A touch screen with motion sensors: the games offer tilt steering.
  test.use({ viewport: { width: 412, height: 839 }, hasTouch: true, isMobile: true });

  for (const [path, label] of [["/runner", "Tilt to steer"], ["/marble", "Tilt to play"]] as const) {
    test(`${path}: tilt steering is inside the game, also in full screen`, async ({ page }) => {
      await page.goto(path);
      await page.locator("article section").nth(2).scrollIntoViewIfNeeded();
      const stage = page.locator("[data-fullscreen]");
      const tilt = page.getByRole("button", { name: label });
      await expect(tilt).toBeVisible({ timeout: 30_000 });
      const inside = async () => {
        const s = (await stage.boundingBox())!, t = (await tilt.boundingBox())!;
        return t.x >= s.x && t.y >= s.y && t.x + t.width <= s.x + s.width && t.y + t.height <= s.y + s.height;
      };
      expect(await inside()).toBe(true);
      // Reachable above the start panel: a real tap lands on it, nothing covers it.
      const box = (await tilt.boundingBox())!;
      expect(await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.textContent, [box.x + box.width / 2, box.y + box.height / 2])).toBe(label);
      await page.getByRole("button", { name: "Full screen", exact: true }).tap();
      await expect(stage).not.toHaveAttribute("data-fullscreen", "off");
      await expect(tilt).toBeVisible();
      expect(await inside()).toBe(true);
    });
  }
});
