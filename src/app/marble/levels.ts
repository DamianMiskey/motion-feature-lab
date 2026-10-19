// Marble Maze levels, drawn as text. Plain data, so tests can check that
// every level is well formed and actually solvable.
//   #  wall      .  floor     O  hole (the marble falls through)
//   S  start     G  goal
// Each character is one 1 × 1 cell; row 0 is the far side of the board.

export type Level = { name: string; par: number; grid: string[] };

export const LEVELS: Level[] = [
  {
    name: "First roll",
    par: 20,
    grid: [
      "#########",
      "#S......#",
      "#######.#",
      "#.......#",
      "#.#######",
      "#.......#",
      "#######.#",
      "#G......#",
      "#########",
    ],
  },
  {
    name: "Mind the gaps",
    par: 30,
    grid: [
      "###########",
      "#S....O...#",
      "#..O......#",
      "#.....O..##",
      "##O.......#",
      "#....O..O.#",
      "#.O.......#",
      "#....##O..#",
      "#.O..#G...#",
      "#....#....#",
      "###########",
    ],
  },
  {
    name: "The spiral",
    par: 45,
    grid: [
      "###########",
      "#S........#",
      "#########.#",
      "#.......#.#",
      "#.#####.#.#",
      "#.#G.O#.#.#",
      "#.#.###.#.#",
      "#.#.....#.#",
      "#.#######.#",
      "#.........#",
      "###########",
    ],
  },
];

export type Cell = "#" | "." | "O" | "S" | "G";
export const cellAt = (level: Level, row: number, col: number) => level.grid[row]?.[col] as Cell | undefined;

/** Grid position → board coordinates (the board is centred on 0,0). */
export function toBoard(level: Level, row: number, col: number) {
  const w = level.grid[0].length;
  const h = level.grid.length;
  return { x: col - (w - 1) / 2, z: row - (h - 1) / 2 };
}

export function find(level: Level, cell: "S" | "G") {
  for (let row = 0; row < level.grid.length; row++) {
    const col = level.grid[row].indexOf(cell);
    if (col >= 0) return { row, col };
  }
  throw new Error(`${level.name} has no ${cell}`);
}

type Pos = { row: number; col: number };

/**
 * Breadth-first search over walkable cells: the shortest route from S to G,
 * or null if there's none. (The tests' autopilot steers along it, too.)
 */
export function shortestPath(level: Level): Pos[] | null {
  const start = find(level, "S");
  const goal = find(level, "G");
  const from = new Map<string, Pos | null>([[`${start.row},${start.col}`, null]]);
  const queue: Pos[] = [start];
  while (queue.length) {
    const here = queue.shift()!;
    if (here.row === goal.row && here.col === goal.col) {
      const path: Pos[] = [];
      for (let p: Pos | null = here; p; p = from.get(`${p.row},${p.col}`) ?? null) path.unshift(p);
      return path;
    }
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { row: here.row + dr, col: here.col + dc };
      const cell = cellAt(level, next.row, next.col);
      const key = `${next.row},${next.col}`;
      if (!cell || cell === "#" || cell === "O" || from.has(key)) continue;
      from.set(key, here);
      queue.push(next);
    }
  }
  return null;
}

export const solvable = (level: Level) => shortestPath(level) !== null;

// 1–5 stars for the Rive rating: par or better is 5.
export function stars(seconds: number, par: number) {
  const ratio = seconds / par;
  return ratio <= 1 ? 5 : ratio <= 1.3 ? 4 : ratio <= 1.7 ? 3 : ratio <= 2.5 ? 2 : 1;
}
