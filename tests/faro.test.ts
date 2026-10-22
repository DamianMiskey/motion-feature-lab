import { describe, expect, it } from "vitest";
import { FARO, faroEnabled } from "@/lib/faro";

// Real user monitoring reports only from the live site: local dev, preview
// deployments and the test suites must never send anything.
describe("Faro", () => {
  it("is enabled only on motion.djmiskey.com", () => {
    expect(faroEnabled("motion.djmiskey.com")).toBe(true);
    for (const host of ["localhost", "127.0.0.1", "motion-feature-lab-git-branch.vercel.app", "evil.motion.djmiskey.com.example"]) {
      expect(faroEnabled(host), host).toBe(false);
    }
  });

  it("sends to Grafana's collector, and traces only into the API lab", () => {
    expect(new URL(FARO.url).hostname).toMatch(/^faro-collector-.*\.grafana\.net$/);
    expect(FARO.traceInto.some((r) => r.test("https://api.djmiskey.com/api/scores"))).toBe(true);
    expect(FARO.traceInto.some((r) => r.test("https://api.djmiskey.com.evil.example/"))).toBe(false);
    expect(FARO.traceInto.some((r) => r.test("https://motion.djmiskey.com/"))).toBe(false);
  });
});
