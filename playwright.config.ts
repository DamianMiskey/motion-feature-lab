import { defineConfig, devices } from "@playwright/test";

// End-to-end tests (e2e/). By default they start the production build
// (`npm start`, so run `npm run build` first) and test it; set BASE_URL to
// test anything else instead, such as a Vercel preview or the live site:
//   BASE_URL=https://motion.djmiskey.com npm run e2e
// Locally they use the installed Microsoft Edge (no browser download); CI
// installs Playwright's own Chromium.
const CI = !!process.env.CI;
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3100";
const channel = CI ? undefined : "msedge";
// CI runners have no GPU: let Chromium render WebGL in software (SwiftShader).
const launchOptions = CI ? { args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"] } : {};

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  // One at a time on CI: the runners have 2 cores and render WebGL in
  // software, and two 3D pages at once starve each other until frames take
  // over half a second (when GSAP's lag smoothing slows every animation).
  workers: CI ? 1 : undefined,
  // Software WebGL in headless browsers is slow; 3D pages need the time.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: { baseURL: BASE_URL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel, launchOptions } },
    // Phone-sized checks only run where layout matters.
    { name: "mobile", use: { ...devices["Pixel 7"], channel, launchOptions }, testMatch: /pages\.spec/ },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: "npm start -- -p 3100", url: BASE_URL, reuseExistingServer: !CI, timeout: 60_000 },
});
