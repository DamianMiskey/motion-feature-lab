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
