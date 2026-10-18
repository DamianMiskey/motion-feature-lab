"use client";

import { OrbitControls } from "@react-three/drei";
import { type ThreeEvent, useFrame } from "@react-three/fiber";
import { CuboidCollider, Physics, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { Suspense, useRef, useState } from "react";
import { Vector3 } from "three";
import { useMotion } from "@/components/motion/MotionProvider";
import { ThreeCanvas } from "@/components/three/ThreeCanvas";
import { Button } from "@/components/ui";

type Shape = "box" | "ball" | "gem";
type Body = { id: number; shape: Shape; position: [number, number, number]; color: string };

const COLOURS = ["#7b6cf0", "#e0577a", "#3ee0c5", "#ffb84d", "#4da6ff"];
const MAX_BODIES = 150;
let nextId = 0;

// A small pyramid of boxes to knock over.
function tower(): Body[] {
  const bodies: Body[] = [];
  for (let row = 0; row < 5; row++) {
    for (let i = 0; i < 5 - row; i++) {
      bodies.push({ id: nextId++, shape: "box", position: [(i - (4 - row) / 2) * 0.62, 0.3 + row * 0.6, 0], color: COLOURS[row % COLOURS.length] });
    }
  }
  return bodies;
}

function drop(n: number): Body[] {
  const shapes: Shape[] = ["box", "ball", "gem"];
  return Array.from({ length: n }, (_, i) => ({
    id: nextId++,
    shape: shapes[i % 3],
    position: [(Math.random() - 0.5) * 4, 5 + i * 0.5, (Math.random() - 0.5) * 3] as [number, number, number],
    color: COLOURS[i % COLOURS.length],
  }));
}

// Each body is a RigidBody wrapped around a mesh. `colliders` tells Rapier
// to build the collision shape from the mesh: a box, a sphere, or a convex
// hull around the gem's vertices.
function Thing({ body }: { body: Body }) {
  const colliders = body.shape === "box" ? "cuboid" : body.shape === "ball" ? "ball" : "hull";
  return (
    <RigidBody position={body.position} colliders={colliders} restitution={0.3} friction={0.8}>
      <mesh castShadow>
        {body.shape === "box" && <boxGeometry args={[0.6, 0.6, 0.6]} />}
        {body.shape === "ball" && <sphereGeometry args={[0.32, 24, 24]} />}
        {body.shape === "gem" && <icosahedronGeometry args={[0.38, 0]} />}
        <meshStandardMaterial color={body.color} roughness={0.45} flatShading={body.shape === "gem"} />
      </mesh>
    </RigidBody>
  );
}

// A kinematic body follows the pointer across the floor. Kinematic bodies
// aren't pushed by anything, but they push everything else, like a hand.
function Pusher({ target }: { target: React.RefObject<Vector3> }) {
  const body = useRef<RapierRigidBody>(null);
  const current = useRef(new Vector3(0, 0.4, 4));
  useFrame((_, delta) => {
    current.current.lerp(target.current, Math.min(1, delta * 12));
    body.current?.setNextKinematicTranslation(current.current);
  });
  return (
    <RigidBody ref={body} type="kinematicPosition" colliders="ball" position={[0, 0.4, 4]}>
      <mesh>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#ffffff" emissive="#7b6cf0" emissiveIntensity={0.6} />
      </mesh>
    </RigidBody>
  );
}

function World({ bodies, paused, debug, target }: { bodies: Body[]; paused: boolean; debug: boolean; target: React.RefObject<Vector3> }) {
  // The floor is a fixed body: it never moves, but things land on it. Invisible
  // walls keep everything on the table.
  const move = (e: ThreeEvent<PointerEvent>) => target.current.set(e.point.x, 0.4, e.point.z);
  return (
    <Physics gravity={[0, -9.81, 0]} paused={paused} debug={debug}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[6, 0.1, 4]} position={[0, -0.1, 0]} />
        <CuboidCollider args={[0.1, 2, 4]} position={[-6, 2, 0]} />
        <CuboidCollider args={[0.1, 2, 4]} position={[6, 2, 0]} />
        <CuboidCollider args={[6, 2, 0.1]} position={[0, 2, -4]} />
        <CuboidCollider args={[6, 2, 0.1]} position={[0, 2, 4]} />
        <mesh rotation-x={-Math.PI / 2} receiveShadow onPointerMove={move}>
          <planeGeometry args={[12, 8]} />
          <meshStandardMaterial color="#34324a" roughness={0.9} />
        </mesh>
      </RigidBody>
      {bodies.map((b) => <Thing key={b.id} body={b} />)}
      <Pusher target={target} />
    </Physics>
  );
}

export function PhysicsScene() {
  const { reduced } = useMotion();
  const [bodies, setBodies] = useState<Body[]>(tower);
  const [debug, setDebug] = useState(false);
  // With reduced motion the world waits for an explicit start: nothing falls
  // or rolls unless the visitor asks for it.
  const [running, setRunning] = useState(false);
  const target = useRef(new Vector3(0, 0.4, 4));
  const paused = reduced && !running;

  return (
    <>
      <ThreeCanvas shadows camera={{ position: [0, 5, 9], fov: 45 }} label="A table where boxes, balls and gems fall, stack and get pushed around by a ball that follows the pointer">
        {() => (
          <>
            <color attach="background" args={["#0f0e14"]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[4, 8, 4]} intensity={2} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={5} shadow-camera-bottom={-5} />
            {/* Rapier's WebAssembly loads asynchronously; Physics suspends until it's ready. */}
            <Suspense fallback={null}>
              <World bodies={bodies} paused={paused} debug={debug} target={target} />
            </Suspense>
            <OrbitControls enablePan={false} minDistance={5} maxDistance={16} maxPolarAngle={Math.PI / 2.2} />
          </>
        )}
      </ThreeCanvas>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button onClick={() => setBodies((b) => [...b, ...drop(10)].slice(-MAX_BODIES))}>Drop 10</Button>
        <Button variant="ghost" onClick={() => setBodies(tower())}>Reset tower</Button>
        {reduced && <Button variant="ghost" onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Run simulation"}</Button>}
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} /> Show colliders</label>
        <span className="text-sm text-muted tabular-nums">{bodies.length} bodies</span>
      </div>
      <p className="text-sm text-muted">
        Move the pointer over the table to steer the white ball into the tower; drag to orbit the camera.
        {reduced && " Reduced motion: the simulation is paused until you press Run."}
      </p>
    </>
  );
}
