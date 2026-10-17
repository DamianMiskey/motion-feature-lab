"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";
import { useMotion } from "@/components/motion/MotionProvider";
import { useInView } from "@/components/motion/useInView";

// A mesh is geometry (its shape) plus a material (how light hits it).
// useFrame runs every rendered frame; `delta` is the seconds since the last
// one, so the spin speed doesn't depend on the screen's refresh rate.
function Spinner({ spin }: { spin: boolean }) {
  const mesh = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (spin && mesh.current) {
      mesh.current.rotation.x += delta * 0.4;
      mesh.current.rotation.y += delta * 0.6;
    }
  });
  return (
    <mesh ref={mesh} castShadow position={[0, 1.1, 0]}>
      <torusKnotGeometry args={[0.7, 0.25, 160, 24]} />
      <meshStandardMaterial color="#7b6cf0" roughness={0.3} metalness={0.2} />
    </mesh>
  );
}

export function Scene() {
  const { reduced } = useMotion();
  const wrapper = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapper);
  const animate = inView && !reduced;

  return (
    <div ref={wrapper} className="stage tall">
      {/* frameloop "always" redraws continuously; "demand" only redraws when
          something changes (e.g. you drag the camera), costing nothing at rest. */}
      <Canvas
        shadows
        camera={{ position: [3, 2.5, 4], fov: 45 }}
        frameloop={animate ? "always" : "demand"}
        fallback={<p className="muted" style={{ padding: "1rem" }}>This browser can&apos;t show WebGL, so the 3D scene is skipped.</p>}
        aria-label="A spinning torus knot on a floor. Drag to orbit the camera."
      >
        <color attach="background" args={["#14131a"]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 6, 3]} intensity={2} castShadow shadow-mapSize={[1024, 1024]} />
        <Spinner spin={animate} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[12, 12]} />
          <meshStandardMaterial color="#2a2836" />
        </mesh>
        <OrbitControls enableDamping={!reduced} minDistance={2.5} maxDistance={10} maxPolarAngle={Math.PI / 2.1} />
      </Canvas>
    </div>
  );
}
