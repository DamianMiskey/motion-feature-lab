import { describe, expect, it } from "vitest";
import { BASE, drop, grow, PERFECT, slide, speed } from "@/app/stacker/stack";

describe("Stacker rules", () => {
  it("a drop within PERFECT snaps exactly onto the slab below", () => {
    const r = drop(BASE, { ...BASE, x: PERFECT * 0.9 }, "x");
    expect(r).toEqual({ kind: "perfect", placed: BASE });
  });

  it("an offset drop keeps the overlap and cuts the overhang off the far side", () => {
    const r = drop(BASE, { ...BASE, x: 1 }, "x");
    if (r.kind !== "cut") throw new Error(r.kind);
    expect(r.placed).toEqual({ x: 0.5, z: 0, w: 2, d: 3 }); // from x -0.5…2.5 ∩ -1.5…1.5 = -0.5…1.5
    expect(r.chunk).toEqual({ x: 2, z: 0, w: 1, d: 3 }); // the 1.5…2.5 that hung over
    // Nothing is lost or invented: kept + chunk = the dropped slab.
    expect(r.placed.w + r.chunk.w).toBe(BASE.w);
  });

  it("works on the z axis and on the negative side too", () => {
    const r = drop(BASE, { ...BASE, z: -0.75 }, "z");
    if (r.kind !== "cut") throw new Error(r.kind);
    expect(r.placed).toEqual({ x: 0, z: -0.375, w: 3, d: 2.25 });
    expect(r.chunk.z).toBeCloseTo(-1.875);
    expect(r.chunk.d).toBeCloseTo(0.75);
  });

  it("no overlap at all is a miss", () => {
    expect(drop(BASE, { ...BASE, x: 3 }, "x")).toEqual({ kind: "miss" });
    expect(drop(BASE, { ...BASE, x: -3.2 }, "x")).toEqual({ kind: "miss" });
  });

  it("grows back slowly, never beyond the base", () => {
    expect(grow({ ...BASE, w: 2 }, "x").w).toBeCloseTo(2.15);
    expect(grow(BASE, "z").d).toBe(BASE.d);
  });

  it("speeds up with height, to a cap", () => {
    expect(speed(0)).toBeLessThan(speed(20));
    expect(speed(500)).toBe(7);
  });

  it("slides back and forth between -range and +range", () => {
    expect(slide(0, 4)).toBe(-4);
    expect(slide(4, 4)).toBe(0);
    expect(slide(8, 4)).toBe(4);
    expect(slide(12, 4)).toBe(0);
    expect(slide(16, 4)).toBe(-4);
  });
});
