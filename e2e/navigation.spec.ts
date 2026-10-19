import { features } from "@/lib/features";
import { needsWasm } from "@/lib/wasm-pages";
import { expect, test } from "./fixtures";

// Arriving by clicking, not by loading the URL. A client-side navigation keeps
// the first page's document, and with it that page's Content Security
// Policy, so WebAssembly pages must be reached by a full page load or their
// 'wasm-unsafe-eval' never applies (Marble Maze failed exactly like that).

const wasmPages = features.filter((f) => f.ready && needsWasm(f.slug));

test("links to WebAssembly pages load a fresh document", async ({ page }) => {
  await page.goto("/");
  for (const f of wasmPages) {
    const link = page.locator(`nav a[href="/${f.slug}"]`);
    const document = page.waitForResponse((r) => new URL(r.url()).pathname === `/${f.slug}` && r.request().resourceType() === "document");
    await link.click();
    expect((await document).headers()["content-security-policy"], f.slug).toContain("'wasm-unsafe-eval'");
  }
});

test("Marble Maze starts after arriving from the home page", async ({ page }) => {
  await page.goto("/");
  await page.locator('nav a[href="/marble"]').click();
  await page.waitForURL("**/marble");
  await page.locator("article section").nth(2).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible({ timeout: 30_000 });
});

test("other pages keep fast client-side navigation", async ({ page }) => {
  await page.goto("/");
  const documents: string[] = [];
  page.on("request", (r) => { if (r.resourceType() === "document") documents.push(r.url()); });
  await page.locator('nav a[href="/runner"]').click();
  await page.waitForURL("**/runner");
  await expect(page.getByRole("heading", { level: 1, name: "Starfield Runner" })).toBeVisible();
  expect(documents).toEqual([]);
});
