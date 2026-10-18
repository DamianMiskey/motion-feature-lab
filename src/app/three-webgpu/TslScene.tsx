"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useState } from "react";
import { color, mix, mx_noise_float, normalLocal, positionLocal, smoothstep, uniform, vec3 } from "three/tsl";
import { MeshStandardNodeMaterial, WebGPURenderer } from "three/webgpu";
import { ThreeCanvas } from "@/components/three/ThreeCanvas";

// TSL (Three Shading Language): shaders written as JavaScript function calls.
// Three.js compiles the same node graph to WGSL for WebGPU or GLSL for WebGL,
// so there's no shader string to keep in sync with two languages.
function useBlobMaterial() {
  return useMemo(() => {
    // Uniforms: values the app can change without rebuilding the shader.
    const uTime = uniform(0);
    const uAmplitude = uniform(0.35);
    const uFrequency = uniform(1.6);
    const uColorA = uniform(color("#2b2370"));
    const uColorB = uniform(color("#ff7aa2"));

    // Noise sampled at each vertex's position, drifting over time.
    const noise = mx_noise_float(positionLocal.mul(uFrequency).add(vec3(0, uTime.mul(0.5), uTime.mul(0.2))));

    const material = new MeshStandardNodeMaterial({ roughness: 0.35, metalness: 0.1, flatShading: true });
    // Vertex stage: push each vertex out along its normal by the noise.
    material.positionNode = positionLocal.add(normalLocal.mul(noise.mul(uAmplitude)));
    // Fragment stage: colour by how far the surface was pushed.
    material.colorNode = mix(uColorA, uColorB, smoothstep(-0.6, 0.6, noise));

    return { material, uTime, uAmplitude, uFrequency, uColorA, uColorB };
  }, []);
}

type Blob = ReturnType<typeof useBlobMaterial>;

function BlobMesh({ blob, animate }: { blob: Blob; animate: boolean }) {
  // Our own clock (rather than TSL's built-in `time`), so reduced motion
  // and off-screen pausing can freeze it. A uniform is a mutable GPU value by
  // design, which React's immutability rule can't know.
  // eslint-disable-next-line react-hooks/immutability
  useFrame((_, delta) => { if (animate) blob.uTime.value += delta; });
  return (
    <mesh material={blob.material}>
      <icosahedronGeometry args={[1.4, 64]} />
    </mesh>
  );
}

export function TslScene() {
  const blob = useBlobMaterial();
  const [backend, setBackend] = useState<"WebGPU" | "WebGL 2" | null>(null);
  const [amplitude, setAmplitude] = useState(0.35);
  const [frequency, setFrequency] = useState(1.6);
  const [colorA, setColorA] = useState("#2b2370");
  const [colorB, setColorB] = useState("#ff7aa2");

  // Uniforms are plain objects: setting .value updates the GPU next frame,
  // no React re-render of the scene needed.
  const set = <T,>(setter: (v: T) => void, apply: (v: T) => void) => (v: T) => { setter(v); apply(v); };

  return (
    <>
      <ThreeCanvas
        camera={{ position: [0, 0, 4.6], fov: 45 }}
        label="A glossy blob whose surface ripples with animated noise, rendered with WebGPU"
        // R3F accepts a renderer factory. WebGPURenderer uses WebGPU where the
        // browser has it and falls back to WebGL 2 by itself where it doesn't.
        gl={async (props) => {
          const renderer = new WebGPURenderer({ ...(props as ConstructorParameters<typeof WebGPURenderer>[0]), antialias: true });
          await renderer.init();
          setBackend((renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? "WebGPU" : "WebGL 2");
          return renderer;
        }}
      >
        {(animate) => (
          <>
            <color attach="background" args={["#0f0e14"]} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[3, 4, 5]} intensity={2.5} />
            <directionalLight position={[-4, -2, -3]} intensity={1} color="#a89dff" />
            <BlobMesh blob={blob} animate={animate} />
            <OrbitControls minDistance={3} maxDistance={9} />
          </>
        )}
      </ThreeCanvas>
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="flex flex-1 basis-55 items-center gap-2 text-sm">
          <code>uAmplitude</code>
          <input className="min-w-0 flex-1" type="range" min={0} max={0.8} step={0.01} value={amplitude}
            onChange={(e) => set(setAmplitude, (v: number) => { blob.uAmplitude.value = v; })(Number(e.target.value))} />
          <span className="w-9 tabular-nums">{amplitude.toFixed(2)}</span>
        </label>
        <label className="flex flex-1 basis-55 items-center gap-2 text-sm">
          <code>uFrequency</code>
          <input className="min-w-0 flex-1" type="range" min={0.3} max={4} step={0.05} value={frequency}
            onChange={(e) => set(setFrequency, (v: number) => { blob.uFrequency.value = v; })(Number(e.target.value))} />
          <span className="w-9 tabular-nums">{frequency.toFixed(1)}</span>
        </label>
        <label className="flex items-center gap-2 text-sm"><code>uColorA</code>
          <input type="color" value={colorA} onChange={(e) => set(setColorA, (v: string) => { blob.uColorA.value.set(v); })(e.target.value)} /></label>
        <label className="flex items-center gap-2 text-sm"><code>uColorB</code>
          <input type="color" value={colorB} onChange={(e) => set(setColorB, (v: string) => { blob.uColorB.value.set(v); })(e.target.value)} /></label>
      </div>
      <p className="text-sm text-muted" aria-live="polite">
        Rendering with: <strong>{backend ?? "starting…"}</strong>
        {backend === "WebGL 2" && " (this browser has no WebGPU, so Three.js compiled the same TSL to GLSL instead)"}
      </p>
    </>
  );
}
