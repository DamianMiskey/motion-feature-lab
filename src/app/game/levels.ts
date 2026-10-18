// Level layouts for Tower Toppler. Plain data, no Three.js, so it can be
// unit-tested. Blocks are 0.6 m cubes standing on a platform whose top is at
// y = 0; a block counts once it falls off the edge.

export const BLOCK = 0.6;
export const PLATFORM = { width: 5, depth: 3 } as const;

export type Block = { id: string; position: [number, number, number]; color: string };
export type Level = { name: string; balls: number; blocks: Block[] };

const COLOURS = ["#7b6cf0", "#e0577a", "#3ee0c5", "#ffb84d", "#4da6ff"];

// y of a block's centre on row `row` (0 = standing on the platform).
const rowY = (row: number) => BLOCK / 2 + row * BLOCK;

function pyramid(base: number): Block[] {
  const blocks: Block[] = [];
  for (let row = 0; row < base; row++) {
    for (let i = 0; i < base - row; i++) {
      blocks.push({ id: `p${row}-${i}`, position: [(i - (base - row - 1) / 2) * BLOCK, rowY(row), 0], color: COLOURS[row % COLOURS.length] });
    }
  }
  return blocks;
}

function tower(columns: number, rows: number, x = 0): Block[] {
  const blocks: Block[] = [];
  for (let row = 0; row < rows; row++) {
    for (let c = 0; c < columns; c++) {
      for (let d = 0; d < 2; d++) {
        blocks.push({ id: `t${x}-${row}-${c}-${d}`, position: [x + (c - (columns - 1) / 2) * BLOCK, rowY(row), (d - 0.5) * BLOCK], color: COLOURS[(row + c) % COLOURS.length] });
      }
    }
  }
  return blocks;
}

function wall(width: number, rows: number): Block[] {
  const blocks: Block[] = [];
  for (let row = 0; row < rows; row++) {
    // Every other row is offset by half a block, like brickwork.
    const offset = row % 2 ? BLOCK / 2 : 0;
    const count = row % 2 ? width - 1 : width;
    for (let i = 0; i < count; i++) {
      blocks.push({ id: `w${row}-${i}`, position: [offset + (i - (width - 1) / 2) * BLOCK, rowY(row), 0], color: COLOURS[(row * 2 + i) % COLOURS.length] });
    }
  }
  return blocks;
}

export const LEVELS: Level[] = [
  { name: "Pyramid", balls: 6, blocks: pyramid(5) },
  { name: "Twin towers", balls: 6, blocks: [...tower(1, 6, -1.2), ...tower(1, 6, 1.2)] },
  { name: "The wall", balls: 5, blocks: wall(7, 5) },
];

export const POINTS_PER_BLOCK = 100;
export const POINTS_PER_SPARE_BALL = 250;

// 0–5 stars from the share of blocks knocked off: what the Rive rating shows.
export function stars(fallen: number, total: number) {
  if (total === 0 || fallen === 0) return 0;
  return Math.max(1, Math.min(5, Math.round((fallen / total) * 5)));
}

// Spare balls only earn a bonus when the platform is cleared.
export function levelScore(fallen: number, total: number, ballsLeft: number) {
  return fallen * POINTS_PER_BLOCK + (fallen === total ? ballsLeft * POINTS_PER_SPARE_BALL : 0);
}
