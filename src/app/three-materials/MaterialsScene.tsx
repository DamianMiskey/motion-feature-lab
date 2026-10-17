"use client";

import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { useState } from "react";
import { ThreeCanvas } from "@/components/three/ThreeCanvas";

// Physically based rendering (PBR): materials are described by real-world
// properties (how rough, how metallic), and light, including light reflected
// from the surroundings, does the rest. The surroundings here are built from
// <Lightformer> panels instead of an HDR image, so nothing is downloaded.
function Studio() {
  return (
    <Environment resolution={256}>
      <Lightformer form="rect" intensity={3} position={[0, 4, -6]} scale={[10, 3, 1]} />
      <Lightformer form="rect" intensity={1.5} position={[-6, 1, 0]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} color="#a89dff" />
      <Lightformer form="rect" intensity={1.5} position={[6, 1, 0]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} color="#ffb0c4" />
      <Lightformer form="ring" intensity={2} position={[0, 6, 2]} scale={2} />
    </Environment>
  );
}

export function MaterialsScene() {
  const [roughness, setRoughness] = useState(0.25);
  const [metalness, setMetalness] = useState(0.9);
  const [color, setColor] = useState("#c9c3ff");
  const [environment, setEnvironment] = useState(true);

  const slider = (label: string, value: number, set: (v: number) => void) => (
    <label className="flex flex-1 basis-55 items-center gap-2 text-sm">
      <span className="w-20">{label}</span>
      <input className="min-w-0 flex-1" type="range" min={0} max={1} step={0.01} value={value} onChange={(e) => set(Number(e.target.value))} aria-label={label} />
      <span className="w-9 tabular-nums">{value.toFixed(2)}</span>
    </label>
  );

  return (
    <>
      <ThreeCanvas shadows camera={{ position: [0, 1.6, 6.5], fov: 40 }} label="Three spheres: brushed metal, clearcoat paint and glass, under studio lighting">
        {() => (
          <>
            <color attach="background" args={["#14131a"]} />
            {environment && <Studio />}
            <ambientLight intensity={environment ? 0.1 : 0.4} />
            <directionalLight position={[3, 5, 3]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />

            {/* 1. Standard: roughness and metalness from the sliders. */}
            <mesh position={[-2.2, 0.8, 0]} castShadow>
              <sphereGeometry args={[0.8, 64, 64]} />
              <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
            </mesh>
            {/* 2. Physical: a clearcoat layer, like car paint over a rough base. */}
            <mesh position={[0, 0.8, 0]} castShadow>
              <torusKnotGeometry args={[0.5, 0.18, 200, 32]} />
              <meshPhysicalMaterial color="#e0577a" roughness={0.6} metalness={0.1} clearcoat={1} clearcoatRoughness={0.05} />
            </mesh>
            {/* 3. Physical: transmission lets light through, like glass. */}
            <mesh position={[2.2, 0.8, 0]} castShadow>
              <sphereGeometry args={[0.8, 64, 64]} />
              <meshPhysicalMaterial color="#ffffff" roughness={0.05} transmission={1} thickness={1} ior={1.5} />
            </mesh>

            <mesh rotation-x={-Math.PI / 2} receiveShadow>
              <planeGeometry args={[14, 14]} />
              <meshStandardMaterial color="#2a2836" roughness={0.9} />
            </mesh>
            <OrbitControls target={[0, 0.8, 0]} minDistance={4} maxDistance={12} maxPolarAngle={Math.PI / 2.05} />
          </>
        )}
      </ThreeCanvas>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {slider("roughness", roughness, setRoughness)}
        {slider("metalness", metalness, setMetalness)}
        <label className="flex items-center gap-2 text-sm">colour <input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>
        <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={environment} onChange={(e) => setEnvironment(e.target.checked)} /> environment lighting</label>
      </div>
      <p className="text-sm text-muted">The sliders and colour apply to the left sphere. Untick environment lighting: metal turns almost black, because metal shows its surroundings, and there are none.</p>
    </>
  );
}
