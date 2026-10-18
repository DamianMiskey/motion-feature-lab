import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { PAGES, scrollThrough, waitForDemos } from "./helpers";

// Automated accessibility checks (axe-core, WCAG 2.2 A and AA rules) on every
// page with its demos mounted. Automated tools catch roughly a third of real
// problems: contrast, names, roles, landmarks. Keyboard and screen-reader
// behaviour still needs the interaction tests and a human.
// Both colour schemes: the tokens differ, so contrast has to pass in each.
for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} mode`, () => {
    test.use({ colorScheme });
    for (const path of PAGES) {
      test(`${path} has no axe violations`, async ({ page }) => {
        await page.goto(path);
        await scrollThrough(page);
        await waitForDemos(page);
        const { violations } = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
        expect(summary).toEqual([]);
      });
    }
  });
}
