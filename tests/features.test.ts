import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { features } from "@/lib/features";

describe("feature registry", () => {
  it("has unique slugs", () => {
    const slugs = features.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has a real page for every feature marked ready", () => {
    for (const f of features.filter((f) => f.ready)) {
      expect(existsSync(path.join(__dirname, "..", "src", "app", f.slug, "page.tsx")), `${f.slug} is marked ready but has no page`).toBe(true);
    }
  });

  // The Content Security Policy only allows WebAssembly on paths starting
  // with "rive-" (next.config.ts), so every Rive page must be named that way.
  it("names every Rive page rive-*", () => {
    for (const f of features.filter((f) => f.category === "Rive")) expect(f.slug).toMatch(/^rive-/);
  });
});
