// Starfield Runner's rules, as plain functions (unit-tested): where asteroids
// appear, when a pass is a hit or a near miss, how fast things go. The ship
// flies at z = 0 along -z; asteroids come towards it.

export type Rock = { x: number; y: number; z: number; r: number };
export type Ship = { x: number; y: number };

export const SHIP_RADIUS = 0.45;
/** The ship can move within ±BOUNDS.x by ±BOUNDS.y. */
export const BOUNDS = { x: 5, y: 3 };
/** Rocks appear up to FAR units ahead and are recycled once they pass the ship. */
export const FAR = 140;
export const NEAR_MISS = 1.1; // extra clearance that still counts as close
/**
 * How many rocks are in play at once (recycled, never re-created). Tuned by
 * simulation: at 260 a simple dodging autopilot survived a median 4 s, at 90
 * about 15 s; a ship that doesn't move lasts about 2 s at any density.
 */
export const ROCKS = 90;

/** A small, fast, seedable random generator (mulberry32): same seed, same field. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A new rock somewhere in the corridor, `z` units ahead (negative z). */
export function spawn(random: () => number, z: number): Rock {
  return {
    x: (random() * 2 - 1) * (BOUNDS.x + 1.5),
    y: (random() * 2 - 1) * (BOUNDS.y + 1),
    z,
    r: 0.35 + random() * random() * 1.4, // mostly small, now and then big
  };
}

/** The opening field: rocks spread evenly from a safe distance out to FAR. */
export function field(seed: number, count: number): Rock[] {
  const random = rng(seed);
  return Array.from({ length: count }, (_, i) => spawn(random, -30 - (i / count) * (FAR - 30)));
}

/**
 * As a rock crosses the ship's plane: a hit if the two spheres touch, a near
 * miss if it passed within NEAR_MISS of touching, otherwise nothing.
 */
export function classify(ship: Ship, rock: Rock): "hit" | "near" | null {
  const gap = Math.hypot(ship.x - rock.x, ship.y - rock.y) - (SHIP_RADIUS + rock.r);
  return gap < 0 ? "hit" : gap < NEAR_MISS ? "near" : null;
}

/** Cruising speed in units per second after `t` seconds: quicker and quicker, to a cap. */
export const cruise = (t: number) => Math.min(70, 22 + t * 0.9);
export const BOOST = 1.6;
/** Score: distance flown, with boosting worth double, plus near misses. */
export const NEAR_MISS_POINTS = 50;
