"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Bloom, ChromaticAberration, DepthOfField, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { useRef, useState } from "react";
import type { Group } from "three";
import { ThreeCanvas } from "@/components/three/ThreeCanvas";

type Effects = { bloom: boolean; dof: boolean; chroma: boolean; vignette: boolean; noise: boolean };

// A row of glowing rings at different depths. Colours above 1.0
// (emissiveIntensity > 1) are "brighter than white": that's what Bloom picks
// up, while the dark matte shapes stay crisp.
function Rings({ animate }: { animate: boolean }) {
  const group = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!animate || !group.current) return;
    group.current.children.forEach((child, i) => { child.rotation.x += delta * (0.3 + i * 0.1); child.rotation.y += delta * 0.4; });
  });
  const colours = ["#ff4d8d", "#7b6cf0", "#3ee0c5", "#ffb84d", "#4da6ff"];
  return (
    <group ref={group}>
      {colours.map((c, i) => (
        <mesh key={c} position={[(i - 2) * 1.6, 0, -i * 1.8 + 2]}>
          <torusGeometry args={[0.55, 0.12, 24, 96]} />
          <meshStandardMaterial color="#111" emissive={c} emissiveIntensity={4} toneMapped={false} />
        </mesh>
      ))}
      {[-3, 0, 3].map((x) => (
        <mesh key={x} position={[x, -0.2, -1]}>
          <icosahedronGeometry args={[0.45, 0]} />
          <meshStandardMaterial color="#d9d6ff" roughness={0.5} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function PostScene() {
  const [fx, setFx] = useState<Effects>({ bloom: true, dof: false, chroma: false, vignette: true, noise: false });
  const [intensity, setIntensity] = useState(1.2);
  const [focus, setFocus] = useState(7);
  const toggle = (k: keyof Effects) => setFx((f) => ({ ...f, [k]: !f[k] }));

  const labels: Record<keyof Effects, string> = { bloom: "Bloom", dof: "Depth of field", chroma: "Chromatic aberration", vignette: "Vignette", noise: "Film grain" };

  return (
    <>
      <ThreeCanvas camera={{ position: [0, 1, 7], fov: 45 }} label="Glowing neon rings at different depths, with switchable post-processing effects">
        {(animate) => (
          <>
            <color attach="background" args={["#08070c"]} />
            <ambientLight intensity={0.3} />
            <directionalLight position={[3, 4, 5]} intensity={1.5} />
            <Rings animate={animate} />
            <OrbitControls minDistance={3} maxDistance={14} />
            {/* The scene renders into a buffer first; each effect is then a
                full-screen pass over that image, merged into as few shader
                passes as possible. */}
            <EffectComposer multisampling={4}>
              {fx.bloom && <Bloom mipmapBlur luminanceThreshold={1} intensity={intensity} />}
              {fx.dof && <DepthOfField worldFocusDistance={focus} worldFocusRange={2} bokehScale={4} />}
              {fx.chroma && <ChromaticAberration offset={[0.002, 0.002]} radialModulation modulationOffset={0.2} />}
              {fx.vignette && <Vignette offset={0.3} darkness={0.7} />}
              {fx.noise && <Noise opacity={0.12} />}
            </EffectComposer>
          </>
        )}
      </ThreeCanvas>
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1.5">
        {(Object.keys(labels) as (keyof Effects)[]).map((k) => (
          <label key={k} className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={fx[k]} onChange={() => toggle(k)} /> {labels[k]}
          </label>
        ))}
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex flex-1 basis-55 items-center gap-2 text-sm">
          Bloom intensity
          <input className="min-w-0 flex-1" type="range" min={0} max={3} step={0.05} value={intensity} disabled={!fx.bloom} onChange={(e) => setIntensity(Number(e.target.value))} />
          <span className="w-9 tabular-nums">{intensity.toFixed(1)}</span>
        </label>
        <label className="flex flex-1 basis-55 items-center gap-2 text-sm">
          Focus distance
          <input className="min-w-0 flex-1" type="range" min={3} max={14} step={0.1} value={focus} disabled={!fx.dof} onChange={(e) => setFocus(Number(e.target.value))} />
          <span className="w-9 tabular-nums">{focus.toFixed(1)}</span>
        </label>
      </div>
    </>
  );
}
