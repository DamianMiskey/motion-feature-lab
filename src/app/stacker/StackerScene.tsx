"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import { type Mesh, OrthographicCamera } from "three";
import { gsap } from "@/lib/gsap";
import { type Axis, HEIGHT, type Slab } from "./stack";

export type Placed = Slab & { id: number; level: number; hue: number };
/** A falling piece; `out` is the direction away from the tower (x or z, ±1). */
export type Chunk = Slab & { id: number; level: number; hue: number; out: { x: number; z: number } };
/** The live game, mutated every frame: refs, not React state, so no re-renders. */
export type Live = { top: Slab; moving: Slab; axis: Axis; t: number; level: number; running: boolean; cameraY: number };

// Three.js parses only the comma form of hsl(): "hsl(200 70% 62%)" silently becomes white.
export const colour = (hue: number, light = 62) => `hsl(${hue}, 70%, ${light}%)`;

function SlabMesh({ slab, level, hue }: { slab: Slab; level: number; hue: number }) {
  return (
    <mesh position={[slab.x, level * HEIGHT + HEIGHT / 2, slab.z]}>
      <boxGeometry args={[slab.w, HEIGHT, slab.d]} />
      <meshLambertMaterial color={colour(hue)} />
    </mesh>
  );
}

// An overhang that was cut off. It falls the way a real one would: pushed a
// little away from the tower, tipping over the cut edge as it drops. (Spinning
// it about its own centre made half of it swing into the slab it was cut
// from, and it started flush against that slab's face, which flickered.)
function Falling({ chunk, reduced, onDone }: { chunk: Chunk; reduced: boolean; onDone: (id: number) => void }) {
  const mesh = useRef<Mesh>(null);
  const v = useRef({ y: 0, age: 0 });
  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const s = v.current;
    s.age += dt;
    if (reduced) {
      if (s.age > 0.3) onDone(chunk.id);
      return;
    }
    s.y -= 18 * dt;
    m.position.y += s.y * dt;
    m.position.x += chunk.out.x * 2.5 * dt;
    m.position.z += chunk.out.z * 2.5 * dt;
    // Tip outward over the cut edge: about z when moving along x, about x along z.
    const tip = 3.2 * dt;
    m.rotation.z -= chunk.out.x * tip;
    m.rotation.x += chunk.out.z * tip;
    if (s.age > 2.5) onDone(chunk.id);
  });
  return (
    // Starts a hair outside the slab it came from, so no faces coincide.
    <mesh ref={mesh} position={[chunk.x + chunk.out.x * 0.02, chunk.level * HEIGHT + HEIGHT / 2, chunk.z + chunk.out.z * 0.02]}>
      <boxGeometry args={[chunk.w, HEIGHT, chunk.d]} />
      <meshLambertMaterial color={colour(chunk.hue)} />
    </mesh>
  );
}

// A perfect drop: a bright outline that swells and fades around the slab.
function PerfectFlash({ slab, level, reduced }: { slab: Slab; level: number; reduced: boolean }) {
  const mesh = useRef<Mesh>(null);
  useEffect(() => {
    if (!mesh.current) return;
    const tw = gsap.fromTo(mesh.current.scale, { x: 1, y: 1, z: 1 }, { x: 1.35, y: 1, z: 1.35, duration: reduced ? 0.01 : 0.5, ease: "power2.out" });
    const fade = gsap.fromTo(mesh.current.material, { opacity: 0.9 }, { opacity: 0, duration: reduced ? 0.3 : 0.5 });
    return () => { tw.kill(); fade.kill(); };
  }, [reduced]);
  return (
    <mesh ref={mesh} position={[slab.x, (level + 1) * HEIGHT + 0.01, slab.z]} rotation-x={-Math.PI / 2}>
      <planeGeometry args={[slab.w + 0.2, slab.d + 0.2]} />
      <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
    </mesh>
  );
}

export function StackerScene({ live, step, placed, chunks, flash, hue, reduced, onChunkDone }: {
  live: RefObject<Live>;
  /** Advances the live game by dt seconds (owned by the parent, which mutates it). */
  step: (dt: number) => void;
  placed: Placed[];
  chunks: Chunk[];
  flash: { id: number; slab: Slab; level: number } | null;
  hue: number;
  reduced: boolean;
  onChunkDone: (id: number) => void;
}) {
  const moving = useRef<Mesh>(null);

  useFrame(({ camera, size }, dt) => {
    step(dt);
    const g = live.current;
    const m = moving.current;
    if (m) {
      m.visible = g.running;
      m.position.set(g.moving.x, g.level * HEIGHT + HEIGHT / 2, g.moving.z);
      m.scale.set(g.moving.w, 1, g.moving.d);
    }
    // The camera follows the tower up (cameraY is tweened by GSAP on each drop).
    camera.position.set(9, 9 + g.cameraY, 9);
    camera.lookAt(0, g.cameraY, 0);
    if (camera instanceof OrthographicCamera) {
      const zoom = Math.min(size.width, size.height) / 9.5;
      if (Math.abs(camera.zoom - zoom) > 0.01) { camera.zoom = zoom; camera.updateProjectionMatrix(); }
    }
  });

  return (
    <>
      {/* A dark, muted backdrop a little round the colour wheel from the slabs. */}
      <color attach="background" args={[`hsl(${(hue + 40) % 360}, 28%, 13%)`]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 10, 3]} intensity={2} />
      {/* Only the top of the tower is ever in view: older slabs aren't drawn. */}
      {placed.slice(-40).map((p) => <SlabMesh key={p.id} slab={p} level={p.level} hue={p.hue} />)}
      <mesh ref={moving}>
        <boxGeometry args={[1, HEIGHT, 1]} />
        <meshLambertMaterial color={colour(hue)} />
      </mesh>
      {chunks.map((c) => <Falling key={c.id} chunk={c} reduced={reduced} onDone={onChunkDone} />)}
      {flash && <PerfectFlash key={flash.id} slab={flash.slab} level={flash.level} reduced={reduced} />}
    </>
  );
}
