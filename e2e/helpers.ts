import type { Page } from "@playwright/test";
import { features } from "@/lib/features";

export const PAGES = ["/", ...features.filter((f) => f.ready).map((f) => `/${f.slug}`)];

// Console errors that come from a library or the headless browser, not from
// the lab. Anything else logged as an error fails the test.
const IGNORED = [
  /WebGL/i, // software rendering in headless browsers reports driver warnings as errors
  /GPU stall/i,
];

/** Collects uncaught exceptions and console errors (CSP violations included). */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`exception: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !IGNORED.some((r) => r.test(m.text()))) errors.push(`console: ${m.text()}`);
  });
  return errors;
}

/**
 * Waits for fades to finish before an accessibility scan. GSAP animates
 * opacity with inline styles, and an element caught half-transparent makes
 * axe report false contrast failures (its colours are blended with what's
 * behind it). On a slow machine those fades run much longer than their
 * nominal duration (GSAP's lag smoothing). "Settled" means the inline
 * opacities stopped changing; some pages animate opacity on purpose and
 * never settle, so after 6 s the scan goes ahead anyway.
 */
export async function waitForStillness(page: Page) {
  const snapshot = () => page.evaluate(() => [...document.querySelectorAll<HTMLElement>("[style*=opacity]")].map((el) => el.style.opacity).join(","));
  const deadline = Date.now() + 6_000;
  let last = await snapshot();
  while (Date.now() < deadline) {
    await page.waitForTimeout(300);
    const now = await snapshot();
    if (now === last) return;
    last = now;
  }
}

/** Scrolls to the bottom in steps, so every lazy demo (WhenVisible) mounts. */
export async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
  });
}

/**
 * Lazy demos show "Loading …" placeholders until their chunk arrives. Then
 * wait for the network to go quiet and a moment more: libraries such as
 * Rapier compile their WebAssembly after the chunk lands, and a failure there
 * (a CSP block, say) would otherwise arrive after the test had finished.
 */
export async function waitForDemos(page: Page) {
  await page.waitForFunction(() => !document.body.innerText.match(/^Loading .+…$/m), undefined, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1_000);
}

/**
 * How far the page is wider than the device. Not scrollWidth - innerWidth:
 * on a phone the browser widens its layout viewport to fit too-wide content,
 * which would hide the very overflow being measured.
 */
export async function overflow(page: Page) {
  const width = page.viewportSize()!.width;
  return (await page.evaluate(() => document.documentElement.scrollWidth)) - width;
}
