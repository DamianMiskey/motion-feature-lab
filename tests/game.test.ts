import { describe, expect, it } from "vitest";
import { BLOCK, LEVELS, levelScore, PLATFORM, stars } from "@/app/game/levels";

describe("Tower Toppler levels", () => {
  for (const level of LEVELS) {
    it(`${level.name}: blocks have unique ids, sit on the platform and don't overlap`, () => {
      const ids = level.blocks.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const { position: [x, y, z] } of level.blocks) {
        expect(Math.abs(x) + BLOCK / 2).toBeLessThanOrEqual(PLATFORM.width / 2);
        expect(Math.abs(z) + BLOCK / 2).toBeLessThanOrEqual(PLATFORM.depth / 2);
        expect(y).toBeGreaterThanOrEqual(BLOCK / 2 - 1e-9);
      }
      // Two cubes overlap if they're closer than one block on every axis.
      for (let i = 0; i < level.blocks.length; i++) {
        for (let j = i + 1; j < level.blocks.length; j++) {
          const [a, b] = [level.blocks[i].position, level.blocks[j].position];
          const overlap = a.every((v, k) => Math.abs(v - b[k]) < BLOCK - 1e-6);
          expect(overlap, `${level.blocks[i].id} overlaps ${level.blocks[j].id}`).toBe(false);
        }
      }
    });
  }
});

describe("scoring", () => {
  it("maps the share knocked off to 0–5 stars", () => {
    expect(stars(0, 15)).toBe(0);
    expect(stars(1, 15)).toBe(1);
    expect(stars(8, 15)).toBe(3);
    expect(stars(15, 15)).toBe(5);
  });

  it("only pays for spare balls when the platform is cleared", () => {
    expect(levelScore(10, 15, 2)).toBe(1000);
    expect(levelScore(15, 15, 2)).toBe(2000);
  });
});
