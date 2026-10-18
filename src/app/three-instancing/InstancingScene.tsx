"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { BoxGeometry, Color, type Group, type InstancedMesh, MeshStandardMaterial, Object3D } from "three";
import { ThreeCanvas } from "@/components/three/ThreeCanvas";
import { Button } from "@/components/ui";

type Mode = "instanced" | "meshes";
const COUNTS = { instanced: [1_000, 10_000, 50_000], meshes: [500, 1_000, 2_000] } as const;

// A spiral galaxy: the same positions for both modes, so the only difference
// is how they're drawn. Deterministic (no Math.random) so it's identical on
// every render.
function galaxy(count: number) {
  const points: { x: number; y: number; z: number; s: number; hue: number }[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const arm = i % 3;
    const r = 0.3 + t * 6;
    const angle = arm * ((Math.PI * 2) / 3) + r * 0.9 + Math.sin(i * 12.9898) * 0.35;
    const spread = 0.35 * (1 - t * 0.5);
    points.push({
      x: Math.cos(angle) * r + Math.sin(i * 78.233) * spread,
      y: Math.sin(i * 39.425) * spread * 0.6,
      z: Math.sin(angle) * r + Math.cos(i * 43.758) * spread,
      s: 0.04 + (1 - t) * 0.06,
      hue: 0.72 - t * 0.35,
    });
  }
  return points;
}

// One InstancedMesh: one geometry, one material, one draw call. Each copy only
// gets its own matrix (position, rotation, scale) and colour.
function Instanced({ count }: { count: number }) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = mesh.current!;
    const dummy = new Object3D();
    const color = new Color();
    galaxy(count).forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(i, i * 2, 0);
      dummy.scale.setScalar(p.s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, color.setHSL(p.hue, 0.8, 0.6));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [count]);
  return (
    <instancedMesh key={count} ref={mesh} args={[undefined, undefined, count]}>
      <boxGeometry />
      <meshStandardMaterial roughness={0.4} />
    </instancedMesh>
  );
}

// The naive way: a separate mesh per cube. Geometry and material are shared,
// so memory is fine, but every mesh is still its own draw call.
function Meshes({ count }: { count: number }) {
  const [geometry, material] = useMemo(() => [new BoxGeometry(), new MeshStandardMaterial({ color: "#a89dff", roughness: 0.4 })], []);
  const points = useMemo(() => galaxy(count), [count]);
  return (
    <>
      {points.map((p, i) => (
        <mesh key={i} geometry={geometry} material={material} position={[p.x, p.y, p.z]} rotation={[i, i * 2, 0]} scale={p.s} />
      ))}
    </>
  );
}

// Reads the renderer's own counters twice a second.
function Stats({ onStats }: { onStats: (s: { calls: number; triangles: number }) => void }) {
  const gl = useThree((s) => s.gl);
  const last = useRef(0);
  useFrame(({ clock }) => {
    if (clock.elapsedTime - last.current < 0.5) return;
    last.current = clock.elapsedTime;
    onStats({ calls: gl.info.render.calls, triangles: gl.info.render.triangles });
  });
  return null;
}

function Spin({ animate, children }: { animate: boolean; children: React.ReactNode }) {
  const group = useRef<Group>(null);
  useFrame((_, delta) => { if (animate && group.current) group.current.rotation.y += delta * 0.15; });
  return <group ref={group}>{children}</group>;
}

export function InstancingScene() {
  const [mode, setMode] = useState<Mode>("instanced");
  const [count, setCount] = useState<number>(10_000);
  const [stats, setStats] = useState({ calls: 0, triangles: 0 });

  const choose = (m: Mode) => { setMode(m); setCount(COUNTS[m][1]); };

  return (
    <>
      <ThreeCanvas camera={{ position: [0, 6, 9], fov: 45 }} label={`A spiral galaxy of ${count.toLocaleString("en")} cubes`}>
        {(animate) => (
          <>
            <color attach="background" args={["#08070c"]} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[4, 6, 3]} intensity={2} />
            <Spin animate={animate}>{mode === "instanced" ? <Instanced count={count} /> : <Meshes count={count} />}</Spin>
            <Stats onStats={setStats} />
            <OrbitControls minDistance={3} maxDistance={20} />
          </>
        )}
      </ThreeCanvas>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button variant={mode === "instanced" ? "primary" : "ghost"} aria-pressed={mode === "instanced"} onClick={() => choose("instanced")}>InstancedMesh</Button>
        <Button variant={mode === "meshes" ? "primary" : "ghost"} aria-pressed={mode === "meshes"} onClick={() => choose("meshes")}>Separate meshes</Button>
        <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        {COUNTS[mode].map((n) => (
          <Button key={n} variant={n === count ? "primary" : "ghost"} aria-pressed={n === count} onClick={() => setCount(n)}>{n.toLocaleString("en")}</Button>
        ))}
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Objects" value={count.toLocaleString("en")} />
        <Stat label="Draw calls per frame" value={stats.calls.toLocaleString("en")} />
        <Stat label="Triangles" value={stats.triangles.toLocaleString("en")} />
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
    </div>
  );
}
