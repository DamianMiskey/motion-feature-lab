import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { features } from "@/lib/features";
import { needsWasm } from "@/lib/wasm-pages";

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

  // Pages whose demos import Rive or Rapier must get WebAssembly in their CSP.
  it("allows WebAssembly exactly where Rive or Rapier runs", () => {
    const wasm = /@rive-app|@react-three\/rapier/;
    for (const f of features.filter((f) => f.ready)) {
      const dir = path.join(__dirname, "..", "src", "app", f.slug);
      const usesWasm = readdirSync(dir).some((file) => wasm.test(readFileSync(path.join(dir, file), "utf8")));
      expect(needsWasm(f.slug), `${f.slug}: uses WebAssembly = ${usesWasm}`).toBe(usesWasm);
    }
  });
});
