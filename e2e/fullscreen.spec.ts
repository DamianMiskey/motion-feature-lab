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
