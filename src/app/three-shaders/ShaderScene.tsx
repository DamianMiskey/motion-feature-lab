"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { ThreeCanvas } from "@/components/three/ThreeCanvas";
// Imported for its side effect too: waveMaterial.ts calls extend(), which
// registers <waveMaterial>. (A type-only import would be dropped by the build.)
import { WaveMaterial } from "./waveMaterial";
import "./waveMaterial";

type Uniforms = InstanceType<typeof WaveMaterial>;

function Waves({ amplitude, frequency, colorA, colorB, animate }: { amplitude: number; frequency: number; colorA: string; colorB: string; animate: boolean }) {
  const material = useRef<Uniforms>(null);
  // Advance the shader's clock every frame (skipped when motion is reduced
  // or the canvas is off screen, so the surface holds still).
  useFrame((_, delta) => {
    if (animate && material.current) material.current.uTime += delta;
  });
  return (
    <mesh rotation-x={-Math.PI / 2.4}>
      {/* 160 × 160 segments: enough vertices for the waves to look smooth. */}
      <planeGeometry args={[5, 5, 160, 160]} />
      <waveMaterial ref={material} uAmplitude={amplitude} uFrequency={frequency} uColorA={colorA} uColorB={colorB} />
    </mesh>
  );
}

export function ShaderScene() {
  const [amplitude, setAmplitude] = useState(0.35);
  const [frequency, setFrequency] = useState(2.5);
  const [colorA, setColorA] = useState("#2b2370");
  const [colorB, setColorB] = useState("#ff7aa2");
  return (
    <>
      <ThreeCanvas camera={{ position: [0, 2.2, 4.2], fov: 45 }} label="A surface of moving waves coloured by height, drawn by a custom shader">
        {(animate) => (
          <>
            <color attach="background" args={["#0f0e14"]} />
            <Waves amplitude={amplitude} frequency={frequency} colorA={colorA} colorB={colorB} animate={animate} />
            <OrbitControls minDistance={2.5} maxDistance={9} />
          </>
        )}
      </ThreeCanvas>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex flex-1 basis-55 items-center gap-2 text-sm">
          <code>uAmplitude</code>
          <input className="min-w-0 flex-1" type="range" min={0} max={0.8} step={0.01} value={amplitude} onChange={(e) => setAmplitude(Number(e.target.value))} aria-label="Wave height" />
          <span className="w-9 tabular-nums">{amplitude.toFixed(2)}</span>
        </label>
        <label className="flex flex-1 basis-55 items-center gap-2 text-sm">
          <code>uFrequency</code>
          <input className="min-w-0 flex-1" type="range" min={0.5} max={6} step={0.1} value={frequency} onChange={(e) => setFrequency(Number(e.target.value))} aria-label="Wave frequency" />
          <span className="w-9 tabular-nums">{frequency.toFixed(1)}</span>
        </label>
        <label className="flex items-center gap-2 text-sm"><code>uColorA</code> <input type="color" value={colorA} onChange={(e) => setColorA(e.target.value)} /></label>
        <label className="flex items-center gap-2 text-sm"><code>uColorB</code> <input type="color" value={colorB} onChange={(e) => setColorB(e.target.value)} /></label>
      </div>
    </>
  );
}
