import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit tests run in Node. End-to-end tests (e2e/) are Playwright's: see
// playwright.config.ts.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
