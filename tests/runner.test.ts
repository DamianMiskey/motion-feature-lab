import { describe, expect, it } from "vitest";
import { BOUNDS, classify, cruise, FAR, field, NEAR_MISS, rng, SHIP_RADIUS, spawn } from "@/app/runner/field";

describe("Starfield Runner rules", () => {
  it("the random generator is repeatable for a seed and spread over 0…1", () => {
    const a = rng(42), b = rng(42);
    const xs = Array.from({ length: 1000 }, () => a());
    expect(xs.slice(0, 5)).toEqual(Array.from({ length: 5 }, () => b()));
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThan(1);
    expect(xs.reduce((s, x) => s + x, 0) / xs.length).toBeCloseTo(0.5, 1);
  });

  it("the opening field leaves a safe gap in front of the ship", () => {
    const rocks = field(7, 300);
    expect(rocks).toHaveLength(300);
    expect(Math.max(...rocks.map((r) => r.z))).toBeLessThanOrEqual(-30);
    expect(Math.min(...rocks.map((r) => r.z))).toBeGreaterThan(-FAR);
  });

  it("rocks appear across the whole corridor, a little beyond where the ship can go", () => {
    const random = rng(3);
    const rocks = Array.from({ length: 2000 }, () => spawn(random, -FAR));
    expect(Math.max(...rocks.map((r) => Math.abs(r.x)))).toBeGreaterThan(BOUNDS.x);
    expect(Math.max(...rocks.map((r) => Math.abs(r.x)))).toBeLessThanOrEqual(BOUNDS.x + 1.5);
    expect(rocks.every((r) => r.r >= 0.35 && r.r <= 1.75)).toBe(true);
  });

  it("classifies a pass as a hit, a near miss, or nothing", () => {
    const ship = { x: 0, y: 0 };
    const rock = (x: number) => ({ x, y: 0, z: 0, r: 1 });
    expect(classify(ship, rock(SHIP_RADIUS + 1 - 0.01))).toBe("hit");
    expect(classify(ship, rock(SHIP_RADIUS + 1 + 0.01))).toBe("near");
    expect(classify(ship, rock(SHIP_RADIUS + 1 + NEAR_MISS + 0.01))).toBeNull();
  });

  it("speeds up over time, to a cap", () => {
    expect(cruise(0)).toBe(22);
    expect(cruise(30)).toBeGreaterThan(cruise(10));
    expect(cruise(1000)).toBe(70);
  });
});
