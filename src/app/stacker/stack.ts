// Stacker's rules, as plain functions: no Three.js, no React, so they're
// unit-tested. A slab is a box seen from above: its centre (x, z) and its
// size (w along x, d along z). Every slab is the same height.

export type Slab = { x: number; z: number; w: number; d: number };
export type Axis = "x" | "z";

export const HEIGHT = 0.3;
export const BASE: Slab = { x: 0, z: 0, w: 3, d: 3 };
/** How close counts as "perfect": the slab snaps exactly onto the one below. */
export const PERFECT = 0.07;
/** After this many perfect drops in a row, each perfect grows the slab back a little. */
export const STREAK_TO_GROW = 3;
export const GROW = 0.15;

export type Drop =
  | { kind: "miss" }
  | { kind: "perfect"; placed: Slab }
  | { kind: "cut"; placed: Slab; chunk: Slab };

const size = (s: Slab, axis: Axis) => (axis === "x" ? s.w : s.d);
const centre = (s: Slab, axis: Axis) => (axis === "x" ? s.x : s.z);

/**
 * Drop `moving` (sliding along `axis`) onto `top`. Whatever overlaps stays;
 * whatever hangs over is cut off and falls (`chunk`). No overlap: game over.
 */
export function drop(top: Slab, moving: Slab, axis: Axis): Drop {
  const offset = centre(moving, axis) - centre(top, axis);
  const len = size(top, axis);
  if (Math.abs(offset) <= PERFECT) return { kind: "perfect", placed: { ...moving, x: top.x, z: top.z } };
  const overlap = len - Math.abs(offset);
  if (overlap <= 0) return { kind: "miss" };
  // The kept part sits between the overlapping edges; the chunk is the rest,
  // on the side the slab overshot.
  const keptCentre = centre(top, axis) + offset / 2;
  const chunkLen = Math.abs(offset);
  const chunkCentre = keptCentre + Math.sign(offset) * (overlap / 2 + chunkLen / 2);
  const placed = axis === "x" ? { ...moving, x: keptCentre, w: overlap } : { ...moving, z: keptCentre, d: overlap };
  const chunk = axis === "x" ? { ...moving, x: chunkCentre, w: chunkLen } : { ...moving, z: chunkCentre, d: chunkLen };
  return { kind: "cut", placed, chunk };
}

/** A streak of perfects earns a little size back, up to the base size. */
export function grow(slab: Slab, axis: Axis): Slab {
  return axis === "x" ? { ...slab, w: Math.min(BASE.w, slab.w + GROW) } : { ...slab, d: Math.min(BASE.d, slab.d + GROW) };
}

/** Slab speed in units per second: brisk from the start, faster as the tower grows. */
export const speed = (level: number) => Math.min(7, 2.6 + level * 0.09);

/** The sliding slab's position: a ping-pong between -range and +range around the tower. */
export function slide(t: number, range: number) {
  const period = 4 * range; // there and back, in distance units
  const p = ((t % period) + period) % period;
  return p < 2 * range ? -range + p : 3 * range - p;
}
