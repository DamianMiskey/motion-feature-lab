import { expect, test } from "@playwright/test";
import { needsWasm } from "@/lib/wasm-pages";
import { PAGES } from "./helpers";

// The security headers next.config.ts promises, checked on the real
// responses. WebAssembly ('wasm-unsafe-eval') must be allowed exactly on the
// Rive and Rapier pages, and nowhere else.
test.describe("security headers", () => {
  for (const path of PAGES) {
    test(`${path}`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(200);
      const h = res.headers();
      const csp = h["content-security-policy"] ?? "";
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("object-src 'none'");
      expect(csp.includes("'wasm-unsafe-eval'"), "wasm-unsafe-eval in CSP").toBe(needsWasm(path.slice(1)));
      expect(csp).not.toContain("'unsafe-eval'");
      expect(h["x-content-type-options"]).toBe("nosniff");
      expect(h["x-frame-options"]).toBe("DENY");
      expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(h["strict-transport-security"]).toContain("max-age=");
      expect(h["x-powered-by"]).toBeUndefined();
    });
  }
});
