import { describe, expect, it } from "vitest";
import { cellAt, find, LEVELS, solvable, stars } from "@/app/marble/levels";

describe("Marble Maze levels", () => {
  for (const level of LEVELS) {
    it(`${level.name}: a closed rectangle with one start and one goal, and solvable`, () => {
      const width = level.grid[0].length;
      expect(level.grid.every((row) => row.length === width)).toBe(true);
      expect(level.grid.join("")).toMatch(/^[#.OSG]+$/);
      // Walled all round, so the marble can only leave through a hole.
      expect(level.grid[0]).toMatch(/^#+$/);
      expect(level.grid.at(-1)).toMatch(/^#+$/);
      expect(level.grid.every((row) => row.startsWith("#") && row.endsWith("#"))).toBe(true);
      expect(level.grid.join("").split("S")).toHaveLength(2);
      expect(level.grid.join("").split("G")).toHaveLength(2);
      expect(solvable(level)).toBe(true);
    });
  }

  it("the solver really checks: blocking the only path makes a level unsolvable", () => {
    const spiral = LEVELS.find((l) => l.name === "The spiral")!;
    const blocked = { ...spiral, grid: spiral.grid.map((row, r) => (r === 1 ? row.replace("S.", "S#") : row)) };
    expect(cellAt(blocked, 1, 2)).toBe("#");
    expect(solvable(blocked)).toBe(false);
    expect(find(spiral, "G")).toEqual({ row: 5, col: 3 });
  });

  it("rates time against par", () => {
    expect(stars(18, 20)).toBe(5);
    expect(stars(25, 20)).toBe(4);
    expect(stars(60, 20)).toBe(1);
  });
});

import { tiltFrom, upOnScreen } from "@/app/marble/tilt";

describe("phone tilt maths", () => {
  // A neutral pose, then the same pose tilted: does the marble go the right way?
  const tilt = (neutral: [number, number], now: [number, number], angle: number) =>
    tiltFrom(upOnScreen(now[0], now[1], angle), upOnScreen(neutral[0], neutral[1], angle));

  it("portrait, flat: right side down → right, top edge down (away) → up the screen", () => {
    expect(tilt([0, 0], [0, 15], 0).x).toBeGreaterThan(0.5);
    expect(tilt([0, 0], [-15, 0], 0).y).toBeGreaterThan(0.5);
    expect(tilt([0, 0], [0, 0], 0)).toEqual({ x: -0, y: -0 });
  });

  it("held almost upright, turning around (rotating about the long axis) barely moves the marble", () => {
    // At 80° the phone's long axis points nearly straight up, so this is mostly
    // a turn of the body, not a tilt: gravity hardly shifts on the screen.
    // Euler angles alone would have read it as a full 15° sideways tilt.
    expect(Math.abs(tilt([80, 0], [80, 15], 0).x)).toBeLessThan(0.15);
    expect(tilt([0, 0], [0, 15], 0).x).toBeGreaterThan(0.6);
  });

  // In landscape the phone's own axes are turned: rocking it "left/right" as
  // you see it changes beta, not gamma. Device top on the left is 90°.
  it("landscape (90°): the device's top edge going up is the right side going down → right", () => {
    expect(tilt([0, 0], [15, 0], 90).x).toBeGreaterThan(0.5);
    expect(tilt([0, 0], [0, 15], 90).y).toBeGreaterThan(0.5);
  });

  it("landscape (270°) mirrors 90°", () => {
    expect(tilt([0, 0], [-15, 0], 270).x).toBeGreaterThan(0.5);
    expect(tilt([0, 0], [0, -15], 270).y).toBeGreaterThan(0.5);
  });

  it("landscape held upright: no jump where gamma wraps at ±90°", () => {
    // The same physical pose can be reported either side of gamma's limit;
    // the up direction (and so the tilt) stays continuous.
    const near = tilt([0, 80], [0, 89], 90);
    const across = tilt([0, 80], [0, 89.9], 90);
    expect(Math.abs(near.x - across.x) + Math.abs(near.y - across.y)).toBeLessThan(0.1);
  });
});
