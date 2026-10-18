import { expect, type Page, test } from "@playwright/test";
import { scrollThrough, waitForDemos } from "./helpers";

// The behaviour the demos promise, driven the way a visitor would: mouse,
// wheel, keyboard. Each test was a manual check during the build.

const transformXY = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return { x: Math.round(m.m41), y: Math.round(m.m42) };
  });

async function openDemo(page: Page, path: string, selector: string) {
  await page.goto(path);
  await scrollThrough(page);
  await waitForDemos(page);
  await page.locator(selector).first().scrollIntoViewIfNeeded();
}

test.describe("Draggable", () => {
  test("a thrown card lands on the 60 px grid", async ({ page }) => {
    await openDemo(page, "/gsap-draggable", ".throw-card");
    const box = (await page.locator(".throw-card").first().boundingBox())!;
    await page.mouse.move(box.x + 30, box.y + 30);
    await page.mouse.down();
    await page.mouse.move(box.x + 150, box.y + 90, { steps: 6 });
    await page.mouse.up();
    await expect.poll(async () => {
      const { x, y } = await transformXY(page, ".throw-card");
      return x % 60 === 0 && y % 60 === 0 && x > 0;
    }, { timeout: 5_000 }).toBe(true);
  });

  test("the dial answers the arrow keys", async ({ page }) => {
    await openDemo(page, "/gsap-draggable", ".knob");
    const dial = page.getByRole("slider", { name: "Level" });
    await dial.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(dial).toHaveAttribute("aria-valuenow", "40");
    await page.keyboard.press("End");
    await expect(dial).toHaveAttribute("aria-valuenow", "100");
  });

  test("the carousel moves with its buttons", async ({ page }) => {
    await openDemo(page, "/gsap-draggable", ".slide-track");
    await page.getByRole("button", { name: "Next slide" }).click();
    await expect(page.getByText(/Slide 2 of 5/)).toBeVisible();
  });

  test.describe("with reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("a dropped card snaps instantly, without a glide", async ({ page }) => {
      await openDemo(page, "/gsap-draggable", ".throw-card");
      const box = (await page.locator(".throw-card").first().boundingBox())!;
      await page.mouse.move(box.x + 30, box.y + 30);
      await page.mouse.down();
      await page.mouse.move(box.x + 113, box.y + 47, { steps: 5 });
      await page.mouse.up();
      expect(await transformXY(page, ".throw-card")).toEqual({ x: 60, y: 0 });
    });
  });
});

test.describe("Observer", () => {
  const status = (page: Page) => page.locator("[aria-live=polite]").first();

  test("one wheel gesture moves one slide, however long it is", async ({ page }) => {
    await openDemo(page, "/gsap-observer", "[aria-roledescription=carousel]");
    const gallery = page.locator("[aria-roledescription=carousel]");
    await gallery.hover();
    await page.mouse.wheel(0, 120);
    await expect(status(page)).toContainText("Slide 2 of 5");
    // The rest of a long trackpad swipe arrives mid-transition: ignored.
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 60);
    await page.waitForTimeout(1_200);
    await expect(status(page)).toContainText("Slide 2 of 5");
    // Once the transition is over, the next gesture moves one more slide.
    await page.mouse.wheel(0, 120);
    await expect(status(page)).toContainText("Slide 3 of 5");
  });

  test("arrow keys move it too", async ({ page }) => {
    await openDemo(page, "/gsap-observer", "[aria-roledescription=carousel]");
    await page.locator("[aria-roledescription=carousel]").focus();
    await page.keyboard.press("ArrowDown");
    await expect(status(page)).toContainText("Slide 2 of 5");
  });
});

test.describe("Rive keyboard & text input", () => {
  test("the canvases are focusable and the form is mirrored for assistive technology", async ({ page }) => {
    await openDemo(page, "/rive-input", "canvas");
    await expect(page.locator("canvas[tabindex='0']")).toHaveCount(3, { timeout: 20_000 });
    // Semantics mode adds hidden DOM nodes for the file's fields.
    await page.locator("canvas").nth(2).scrollIntoViewIfNeeded();
    await expect(page.getByRole("textbox", { name: "Email" })).toBeAttached({ timeout: 20_000 });
  });
});

test.describe("Motion settings", () => {
  test("the Reduce setting is remembered across a reload", async ({ page }) => {
    await page.goto("/motion");
    await page.getByLabel("Animation").selectOption("reduce");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduce");
  });
});

test.describe("Tower Toppler", () => {
  test.setTimeout(120_000);

  test("a round can be played with the keyboard and is scored with stars", async ({ page }) => {
    await page.goto("/game");
    await page.locator("article section").nth(2).scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Play" }).click({ timeout: 45_000 });
    const aim = page.getByRole("application");
    await expect(aim).toBeFocused();
    await expect(page.getByRole("img", { name: "6 balls left" })).toBeVisible();
    // Aim a little low at the base of the pyramid and throw every ball.
    await page.keyboard.press("ArrowDown");
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Space");
      await page.waitForTimeout(700);
    }
    await expect(page.getByRole("img", { name: "0 balls left" })).toBeVisible();
    // The round ends a few seconds after the last ball and shows Rive's stars.
    await expect(page.getByRole("img", { name: /out of 5 stars/ })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/of 15 blocks down/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Next level" })).toBeVisible();
  });
});
