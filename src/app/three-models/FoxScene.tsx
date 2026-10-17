"use client";

import { Center, ContactShadows, OrbitControls, useAnimations, useGLTF, useProgress } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import type { Group } from "three";
import { ThreeCanvas } from "@/components/three/ThreeCanvas";
import { Button } from "@/components/ui";

const MODEL = "/models/Fox.glb";

// useGLTF loads (and caches) a .glb. The two `false`s turn off Draco and
// Meshopt decoding: this model doesn't use them, and leaving them on would
// make drei load decoders from Google's CDN.
function Fox({ clip, speed, playing }: { clip: string; speed: number; playing: boolean }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL, false, false);
  const { actions } = useAnimations(animations, group);

  // Cross-fade to the chosen clip over half a second.
  useEffect(() => {
    const action = actions[clip];
    action?.reset().fadeIn(0.5).play();
    return () => void action?.fadeOut(0.5);
  }, [actions, clip]);

  // Speed, and pausing (a time scale of 0) when motion is reduced or the
  // canvas is off screen.
  useEffect(() => {
    actions[clip]?.setEffectiveTimeScale(playing ? speed : 0);
  }, [actions, clip, speed, playing]);

  return (
    <group ref={group} dispose={null}>
      {/* The fox is modelled about 100 units tall; scale it to a couple of metres. */}
      <primitive object={scene} scale={0.025} />
    </group>
  );
}
useGLTF.preload(MODEL, false, false);

// Three.js's loading manager, read outside the scene: shows a message over
// the canvas while the model downloads.
function LoadingNote() {
  const { active, progress } = useProgress();
  return active ? <p className="absolute inset-0 m-0 grid place-items-center text-sm text-muted">Loading model… {Math.round(progress)}%</p> : null;
}

export function FoxScene() {
  const [clip, setClip] = useState("Survey");
  const [speed, setSpeed] = useState(1);
  return (
    <>
      <ThreeCanvas shadows camera={{ position: [4, 2.2, 5], fov: 40 }} label={`A low-poly fox playing its ${clip} animation`} overlay={<LoadingNote />}>
        {(animate) => (
          <>
            <color attach="background" args={["#14131a"]} />
            <hemisphereLight args={["#ffffff", "#3a3550", 1.2]} />
            <directionalLight position={[3, 5, 2]} intensity={1.8} />
            <Suspense fallback={null}>
              <Center top>
                <Fox clip={clip} speed={speed} playing={animate} />
              </Center>
            </Suspense>
            {/* A soft shadow baked under the model, cheaper than real-time shadows. */}
            <ContactShadows opacity={0.6} scale={8} blur={2.5} far={3} />
            <OrbitControls target={[0, 1, 0]} minDistance={3} maxDistance={12} maxPolarAngle={Math.PI / 2.05} />
          </>
        )}
      </ThreeCanvas>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {["Survey", "Walk", "Run"].map((c) => (
          <Button key={c} variant={c === clip ? "primary" : "ghost"} aria-pressed={c === clip} onClick={() => setClip(c)}>{c}</Button>
        ))}
        <label className="flex flex-1 basis-60 items-center gap-2 text-sm">
          <span>speed</span>
          <input className="min-w-0 flex-1" type="range" min={0.25} max={2} step={0.05} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} aria-label="Animation speed" />
          <span className="tabular-nums">{speed.toFixed(2)}×</span>
        </label>
      </div>
    </>
  );
}
