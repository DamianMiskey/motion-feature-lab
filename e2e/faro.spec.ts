import { expect, test } from "./fixtures";

// Faro must stay out of the way: not loaded or sending anywhere but the live
// site, and allowed by the Content Security Policy there.
const LIVE = !!process.env.BASE_URL;

test("off the live site, nothing goes to Grafana", async ({ page }) => {
  test.skip(LIVE, "On the live site it should send");
  const toGrafana: string[] = [];
  page.on("request", (r) => { if (r.url().includes("grafana.net")) toGrafana.push(r.url()); });
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(3000);
  expect(toGrafana).toEqual([]);
});

test("the Content Security Policy allows the Faro collector", async ({ request }) => {
  const csp = (await request.get("/")).headers()["content-security-policy"];
  expect(csp).toMatch(/connect-src [^;]*https:\/\/faro-collector-prod-us-east-3\.grafana\.net/);
});

test("on the live site, the page reports to Faro after it has loaded @deployed", async ({ page }) => {
  test.skip(!LIVE, "Only the live site reports");
  const sent = page.waitForRequest((r) => r.url().startsWith("https://faro-collector-") && r.method() === "POST", { timeout: 30_000 });
  await page.goto("/");
  await page.waitForLoadState("load");
  // Page views and web vitals are sent once Faro starts (after load, when idle).
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  const request = await sent;
  expect(request.postDataJSON()).toHaveProperty("meta.app.name", "motion-lab");
});
