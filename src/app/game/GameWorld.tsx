"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { CuboidCollider, Physics, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { useEffect, useRef, type RefObject } from "react";
import { Raycaster, Vector2, Vector3 } from "three";
import { BLOCK, type Block, PLATFORM } from "./levels";

export type Ball = { id: number; position: [number, number, number]; velocity: [number, number, number] };
/** Turns a point on screen (-1…1 on both axes) into a throw: start and velocity. */
export type Aim = (ndc: { x: number; y: number }) => Pick<Ball, "position" | "velocity">;

const THROW_SPEED = 24;
const FALLEN_Y = -0.6;

// A block reports, once, the moment it drops below the platform, with where
// that happened on screen (for the "+100" pop).
function BlockBody({ block, onFall }: { block: Block; onFall: (id: string, screen: { x: number; y: number }) => void }) {
  const body = useRef<RapierRigidBody>(null);
  const fallen = useRef(false);
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    if (fallen.current || !body.current) return;
    const p = body.current.translation();
    if (p.y > FALLEN_Y) return;
    fallen.current = true;
    const v = new Vector3(p.x, 0, p.z).project(camera);
    onFall(block.id, { x: (v.x + 1) / 2, y: (1 - v.y) / 2 });
  });
  return (
    <RigidBody ref={body} position={block.position} colliders="cuboid" friction={0.9} restitution={0.05}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[BLOCK, BLOCK, BLOCK]} />
        <meshStandardMaterial color={block.color} roughness={0.5} />
      </mesh>
    </RigidBody>
  );
}

// Heavy, fast balls with continuous collision detection (ccd), so they can't
// tunnel through a block between two physics steps.
function BallBody({ ball }: { ball: Ball }) {
  return (
    <RigidBody position={ball.position} linearVelocity={ball.velocity} colliders="ball" density={6} ccd restitution={0.2}>
      <mesh castShadow>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color="#ffffff" emissive="#7b6cf0" emissiveIntensity={0.5} roughness={0.3} />
      </mesh>
    </RigidBody>
  );
}

// Hands the game a function that turns a screen position into a throw from
// the camera, using the same raycasting that picks objects under the mouse.
function Thrower({ aimRef }: { aimRef: RefObject<Aim | null> }) {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const raycaster = new Raycaster();
    aimRef.current = ({ x, y }) => {
      raycaster.setFromCamera(new Vector2(x, y), camera);
      const { origin, direction } = raycaster.ray;
      const start = origin.clone().addScaledVector(direction, 1.2);
      // Aim a little high: the ball drops on its way.
      const v = direction.clone().multiplyScalar(THROW_SPEED).add(new Vector3(0, 1.5, 0));
      return { position: [start.x, start.y, start.z], velocity: [v.x, v.y, v.z] };
    };
    return () => { aimRef.current = null; };
  }, [aimRef, camera]);
  return null;
}

function Ready({ onReady }: { onReady: () => void }) {
  // Mounted only once Physics has stopped suspending: the engine is loaded.
  useEffect(onReady, [onReady]);
  return null;
}

export function GameWorld({ blocks, balls, paused, aimRef, onFall, onReady }: {
  blocks: Block[];
  balls: Ball[];
  paused: boolean;
  aimRef: RefObject<Aim | null>;
  onFall: (id: string, screen: { x: number; y: number }) => void;
  onReady: () => void;
}) {
  return (
    <Physics gravity={[0, -9.81, 0]} paused={paused}>
      {/* The platform: a fixed body floating in space. Off the edge is "out". */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[PLATFORM.width / 2, 0.25, PLATFORM.depth / 2]} position={[0, -0.25, 0]} friction={1} />
        <mesh position={[0, -0.25, 0]} receiveShadow>
          <boxGeometry args={[PLATFORM.width, 0.5, PLATFORM.depth]} />
          <meshStandardMaterial color="#34324a" roughness={0.8} />
        </mesh>
      </RigidBody>
      {blocks.map((b) => <BlockBody key={b.id} block={b} onFall={onFall} />)}
      {balls.map((b) => <BallBody key={b.id} ball={b} />)}
      <Thrower aimRef={aimRef} />
      <Ready onReady={onReady} />
    </Physics>
  );
}
