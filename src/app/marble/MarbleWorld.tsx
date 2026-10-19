"use client";

import { useFrame } from "@react-three/fiber";
import { CuboidCollider, Physics, RigidBody, TrimeshCollider, type RapierRigidBody, useRapier } from "@react-three/rapier";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Euler, type Mesh, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { cellAt, find, type Level, toBoard } from "./levels";
import type { Tilt } from "./tilt";

const MAX_TILT = (13 * Math.PI) / 180; // radians at full input
const G = 9.81;
const BALL_RADIUS = 0.3;
const WALL_HEIGHT = 0.45;

/** The board's collision shapes and visible parts, built from the level grid. */
function useBoard(level: Level) {
  return useMemo(() => {
    const h = level.grid.length;
    const w = level.grid[0].length;
    // Floor: ONE triangle mesh over every cell that isn't a hole. Separate
    // boxes per cell would leave seams the marble keeps bumping into
    // ("ghost collisions"); shared vertices make one smooth surface.
    const vertices: number[] = [];
    for (let r = 0; r <= h; r++) for (let c = 0; c <= w; c++) vertices.push(c - w / 2, 0, r - h / 2);
    const index = (r: number, c: number) => r * (w + 1) + c;
    const indices: number[] = [];
    const tiles: { x: number; z: number }[] = [];
    const holes: { x: number; z: number }[] = [];
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const { x, z } = toBoard(level, r, c);
        if (cellAt(level, r, c) === "O") { holes.push({ x, z }); continue; }
        // Two triangles per cell, wound so they face up.
        indices.push(index(r, c), index(r + 1, c), index(r, c + 1), index(r, c + 1), index(r + 1, c), index(r + 1, c + 1));
        if (cellAt(level, r, c) !== "#") tiles.push({ x, z });
      }
    }
    // Walls: each horizontal run of # becomes one box, so fewer seams there too.
    const walls: { x: number; z: number; length: number }[] = [];
    level.grid.forEach((row, r) => {
      for (const m of row.matchAll(/#+/g)) {
        const start = m.index!;
        walls.push({ x: start + m[0].length / 2 - w / 2, z: r + 0.5 - h / 2, length: m[0].length });
      }
    });
    const s = find(level, "S");
    const g = find(level, "G");
    return {
      size: Math.max(w, h), vertices: new Float32Array(vertices), indices: new Uint32Array(indices),
      tiles, holes, walls, start: toBoard(level, s.row, s.col), goal: toBoard(level, g.row, g.col),
    };
  }, [level]);
}

const MIN_HFOV = 2 * Math.atan(Math.tan((45 * Math.PI) / 360) * 1.25);

// Each frame: ease the board's tilt towards the player's input, then turn it
// into physics and pictures. The board itself never moves: gravity is tilted
// instead (simpler and steadier than rotating a physics body), and the camera
// tilts the opposite way, which on screen looks exactly like the board tilting.
function Tilter({ target, size }: { target: RefObject<Tilt>; size: number }) {
  // The physics world and the scratch maths objects are held in refs: they're
  // mutated every frame, which React's rules allow for refs only.
  const world = useRef(useRapier().world);
  const current = useRef<Tilt>({ x: 0, y: 0 });
  const scratch = useRef({ q: new Quaternion(), e: new Euler(), g: new Vector3(), offset: new Vector3(), up: new Vector3() });
  useFrame(({ camera, size: view }, delta) => {
    const { q, e, g, offset, up } = scratch.current;
    const k = Math.min(1, delta * 8);
    current.current = { x: current.current.x + (target.current.x - current.current.x) * k, y: current.current.y + (target.current.y - current.current.y) * k };
    // Right (+x) means the right side goes down: a negative turn about z.
    // Away (+y) means the far side goes down: a negative turn about x.
    q.setFromEuler(e.set(-current.current.y * MAX_TILT, 0, -current.current.x * MAX_TILT)).invert();
    g.set(0, -G, 0).applyQuaternion(q);
    world.current.gravity = { x: g.x, y: g.y, z: g.z };
    const distance = size * 1.12;
    // Steeply from above, so walls don't hide the corridors behind them.
    camera.position.copy(offset.set(0, distance, distance * 0.32).applyQuaternion(q));
    camera.up.copy(up.set(0, 1, 0).applyQuaternion(q));
    camera.lookAt(0, 0, 0.3);
    if (camera instanceof PerspectiveCamera) {
      const fov = Math.max(45, (2 * Math.atan(Math.tan(MIN_HFOV / 2) / (view.width / view.height)) * 180) / Math.PI);
      if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    }
  });
  return null;
}

function Ball({ start, onFall, onPosition, ballRef }: {
  start: { x: number; z: number };
  onFall: () => void;
  onPosition: (x: number, z: number) => void;
  ballRef: RefObject<RapierRigidBody | null>;
}) {
  const lastReport = useRef(0);
  useFrame(({ clock }) => {
    const b = ballRef.current;
    if (!b) return;
    const p = b.translation();
    if (p.y < -2) {
      // Fell through a hole: back to the start, at rest.
      b.setTranslation({ x: start.x, y: BALL_RADIUS + 0.05, z: start.z }, true);
      b.setLinvel({ x: 0, y: 0, z: 0 }, true);
      b.setAngvel({ x: 0, y: 0, z: 0 }, true);
      onFall();
    }
    if (clock.elapsedTime - lastReport.current > 0.1) {
      lastReport.current = clock.elapsedTime;
      onPosition(p.x, p.z);
    }
  });
  return (
    <RigidBody ref={ballRef} position={[start.x, BALL_RADIUS + 0.05, start.z]} colliders="ball" ccd canSleep={false}
      friction={0.7} restitution={0.15} linearDamping={0.25} angularDamping={0.4} density={4}>
      <mesh castShadow>
        <sphereGeometry args={[BALL_RADIUS, 48, 48]} />
        <meshStandardMaterial color="#eef1f6" metalness={0.7} roughness={0.18} envMapIntensity={1.6} />
      </mesh>
    </RigidBody>
  );
}

function GoalPad({ x, z, animate }: { x: number; z: number; animate: boolean }) {
  const ring = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (ring.current && animate) ring.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 3) * 0.08);
  });
  return (
    <mesh ref={ring} position={[x, 0.02, z]} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[0.24, 0.42, 48]} />
      <meshStandardMaterial color="#3ee0c5" emissive="#3ee0c5" emissiveIntensity={1.4} />
    </mesh>
  );
}

export function MarbleWorld({ level, target, running, animate, onFall, onGoal, onPosition, onReady }: {
  level: Level;
  target: RefObject<Tilt>;
  running: boolean;
  animate: boolean;
  onFall: () => void;
  onGoal: () => void;
  onPosition: (x: number, z: number) => void;
  onReady: () => void;
}) {
  const board = useBoard(level);
  const ball = useRef<RapierRigidBody>(null);
  useEffect(onReady, [onReady]);
  return (
    <Physics gravity={[0, -G, 0]} paused={!running}>
      <Tilter target={target} size={board.size} />

      <RigidBody type="fixed" colliders={false}>
        <TrimeshCollider args={[board.vertices, board.indices]} friction={0.9} />
        {board.walls.map((w, i) => (
          <CuboidCollider key={i} args={[w.length / 2, WALL_HEIGHT / 2, 0.5]} position={[w.x, WALL_HEIGHT / 2, w.z]} />
        ))}
        {/* The goal: a sensor detects the marble without blocking it. */}
        <CuboidCollider sensor args={[0.3, 0.4, 0.3]} position={[board.goal.x, 0.4, board.goal.z]} onIntersectionEnter={onGoal} />
      </RigidBody>

      {/* What you see. Tiles are a touch smaller than a cell so the grid shows. */}
      {board.tiles.map((t, i) => (
        <mesh key={i} position={[t.x, -0.15, t.z]} receiveShadow>
          <boxGeometry args={[0.98, 0.3, 0.98]} />
          <meshStandardMaterial color={(i + Math.round(t.x + t.z)) % 2 ? "#c8a27a" : "#c09a72"} roughness={0.8} />
        </mesh>
      ))}
      {board.holes.map((t, i) => (
        <mesh key={i} position={[t.x, -0.6, t.z]}>
          <boxGeometry args={[1, 0.02, 1]} />
          <meshStandardMaterial color="#0b0a10" />
        </mesh>
      ))}
      {board.walls.map((w, i) => (
        <mesh key={i} position={[w.x, WALL_HEIGHT / 2, w.z]} castShadow receiveShadow>
          <boxGeometry args={[w.length, WALL_HEIGHT, 1]} />
          <meshStandardMaterial color="#6b4a32" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, -0.32, 0]} receiveShadow>
        <boxGeometry args={[board.size + 0.6, 0.04, board.size + 0.6]} />
        <meshStandardMaterial color="#3b2a1e" />
      </mesh>
      <GoalPad x={board.goal.x} z={board.goal.z} animate={animate} />
      <Ball start={board.start} onFall={onFall} onPosition={onPosition} ballRef={ball} />
    </Physics>
  );
}
