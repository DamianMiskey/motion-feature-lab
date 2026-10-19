"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import { BufferAttribute, BufferGeometry, type Group, type InstancedMesh, Object3D, PerspectiveCamera, type Points } from "three";
import { FAR, ROCKS, type Rock, type Ship } from "./field";

/** The live game, owned (and mutated) by Runner.tsx; the scene only reads it. */
export type Live = {
  running: boolean;
  t: number;
  speed: number;
  boosting: boolean;
  ship: Ship;
  vel: Ship;
  rocks: Rock[];
  shake: number;
  distance: number;
  near: number;
  energy: number;
};

const STARS = 1400;
const BG = "#05040d";

export function RunnerScene({ live, step }: { live: RefObject<Live>; step: (dt: number) => void }) {
  const rocks = useRef<InstancedMesh>(null);
  const ship = useRef<Group>(null);
  const flame = useRef<Group>(null);
  // Scratch objects and star positions belong to the scene: kept in refs.
  const scratch = useRef(new Object3D());
  const stars = useRef<Points>(null);
  const starGeometry = useMemo(() => {
    // Deterministic spread (no Math.random during render): a simple hash.
    const p = new Float32Array(STARS * 3);
    for (let i = 0; i < STARS; i++) {
      const h = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
      p[i * 3] = (h(1) * 2 - 1) * 60;
      p[i * 3 + 1] = (h(2) * 2 - 1) * 40;
      p[i * 3 + 2] = -h(3) * FAR * 1.4;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(p, 3));
    return g;
  }, []);

  useFrame(({ camera, clock }, dt) => {
    const d = Math.min(dt, 0.05); // a long stall (tab switch) shouldn't teleport rocks
    step(d);
    const g = live.current;

    // Rocks: one instanced mesh, one draw call, its matrices rewritten in place.
    const m = rocks.current;
    if (m) {
      const o = scratch.current;
      g.rocks.forEach((r, i) => {
        o.position.set(r.x, r.y, r.z);
        o.scale.setScalar(r.r);
        o.rotation.set(i + clock.elapsedTime * 0.4, i * 2 + clock.elapsedTime * 0.3, 0);
        o.updateMatrix();
        m.setMatrixAt(i, o.matrix);
      });
      m.instanceMatrix.needsUpdate = true;
    }

    // Stars stream past faster than the rocks, wrapping round when behind us.
    const pos = stars.current?.geometry.getAttribute("position") as BufferAttribute | undefined;
    if (pos) {
      const arr = pos.array as Float32Array;
      for (let i = 0; i < STARS; i++) {
        arr[i * 3 + 2] += g.speed * d * 1.6;
        if (arr[i * 3 + 2] > 8) arr[i * 3 + 2] -= FAR * 1.4;
      }
      pos.needsUpdate = true;
    }

    // The ship banks into turns; its engine flame grows when boosting.
    if (ship.current) {
      ship.current.position.set(g.ship.x, g.ship.y, 0);
      ship.current.rotation.set(g.vel.y * 0.05, 0, -g.vel.x * 0.07);
    }
    if (flame.current) flame.current.scale.set(1, 1, (g.boosting ? 2.2 : 1) * (0.85 + Math.sin(clock.elapsedTime * 40) * 0.15));

    // The camera trails the ship, leans with it, widens on boost, shakes on a crash.
    const shake = g.shake * (Math.sin(clock.elapsedTime * 90) * 0.3);
    camera.position.set(g.ship.x * 0.55 + shake, g.ship.y * 0.55 + 1.5, 6.5);
    camera.up.set(-g.vel.x * 0.012, 1, 0);
    camera.lookAt(g.ship.x * 0.8, g.ship.y * 0.8, -12);
    if (camera instanceof PerspectiveCamera) {
      const fov = g.boosting ? 82 : 68;
      camera.fov += (fov - camera.fov) * Math.min(1, d * 6);
      camera.updateProjectionMatrix();
    }
  });

  return (
    <>
      <color attach="background" args={[BG]} />
      {/* Fog hides the far end, so rocks fade in instead of popping into view. */}
      <fog attach="fog" args={[BG, 40, FAR * 0.95]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 6, 4]} intensity={2.4} />
      <pointLight position={[0, 0, 2]} intensity={6} distance={14} color="#7b6cf0" />

      <points ref={stars} geometry={starGeometry} frustumCulled={false}>
        <pointsMaterial size={0.12} color="#cfd6ff" sizeAttenuation fog={false} />
      </points>

      <instancedMesh ref={rocks} args={[undefined, undefined, ROCKS]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#8a8296" roughness={0.9} flatShading />
      </instancedMesh>

      <group ref={ship}>
        {/* A small dart: a cone for the body, a flat box for the wings. */}
        <mesh rotation-x={-Math.PI / 2}>
          <coneGeometry args={[0.32, 1.3, 6]} />
          <meshStandardMaterial color="#e8e6ff" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.05, 0.25]}>
          <boxGeometry args={[1.4, 0.06, 0.45]} />
          <meshStandardMaterial color="#6a5ae0" metalness={0.4} roughness={0.4} />
        </mesh>
        <group ref={flame} position={[0, 0, 0.7]}>
          <mesh position={[0, 0, 0.25]} rotation-x={Math.PI / 2}>
            <coneGeometry args={[0.18, 0.6, 12]} />
            <meshBasicMaterial color="#3ee0c5" transparent opacity={0.85} />
          </mesh>
        </group>
      </group>
    </>
  );
}
