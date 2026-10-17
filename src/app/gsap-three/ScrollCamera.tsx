"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import { useMotion } from "@/components/motion/MotionProvider";
import { ThreeCanvas } from "@/components/three/ThreeCanvas";
import { Button } from "@/components/ui";
import { gsap, useGSAP } from "@/lib/gsap";

type Vec3 = [number, number, number];
type Stop = { title: string; text: string; pos: Vec3; look: Vec3 };

// Camera position and the point it looks at, for each stop.
const STOPS: Stop[] = [
  { title: "Wide shot", text: "Three objects on a stage. Scroll to fly the camera between them.", pos: [0, 4, 12], look: [0, 1, 0] },
  { title: "The knot", text: "The timeline moves the camera and its target together, so the shot stays framed.", pos: [-3.2, 1.6, 3.2], look: [-3, 1, 0] },
  { title: "The cubes", text: "scrub: 1 smooths the movement: the camera catches up with the scrollbar over a second.", pos: [3.6, 3.2, 3], look: [3, 0.8, 0] },
  { title: "Overhead", text: "Same scene, no React re-renders: GSAP animates a plain object that the 3D loop reads.", pos: [0, 11, 0.01], look: [0, 0, 0] },
];

type Rig = { px: number; py: number; pz: number; lx: number; ly: number; lz: number };
const rigAt = (i: number): Rig => {
  const { pos, look } = STOPS[i];
  return { px: pos[0], py: pos[1], pz: pos[2], lx: look[0], ly: look[1], lz: look[2] };
};

// Copies the rig onto the camera every frame. When the canvas isn't
// rendering continuously (reduced motion), `invalidate` asks for one frame.
function CameraRig({ rig, version }: { rig: Rig; version: number }) {
  const { camera, invalidate } = useThree();
  const look = useRef(new Vector3());
  useFrame(() => {
    camera.position.set(rig.px, rig.py, rig.pz);
    camera.lookAt(look.current.set(rig.lx, rig.ly, rig.lz));
  });
  useEffect(() => invalidate(), [version, invalidate]);
  return null;
}

function Stage() {
  return (
    <>
      <color attach="background" args={["#14131a"]} />
      <hemisphereLight args={["#ffffff", "#3a3550", 1]} />
      <directionalLight position={[4, 8, 5]} intensity={1.6} />
      <mesh position={[-3, 1, 0]}>
        <torusKnotGeometry args={[0.6, 0.22, 160, 24]} />
        <meshStandardMaterial color="#7b6cf0" roughness={0.3} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[2.4 + i * 0.6, 0.35 + i * 0.5, -i * 0.4]} rotation={[0, i * 0.5, 0]}>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshStandardMaterial color={["#e0577a", "#f59e0b", "#22c55e"][i]} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.9, -2.5]}>
        <sphereGeometry args={[0.9, 48, 48]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#2a2836" />
      </mesh>
    </>
  );
}

export function ScrollCamera() {
  const { reduced } = useMotion();
  const section = useRef<HTMLDivElement>(null);
  // One mutable object for the whole demo. GSAP writes to it; useFrame reads it.
  const rig = useRef<Rig>(rigAt(0)).current;
  const [stop, setStop] = useState(0);
  const [version, setVersion] = useState(0);

  useGSAP(() => {
    if (reduced) return;
    const tl = gsap.timeline({
      defaults: { ease: "power1.inOut" },
      scrollTrigger: {
        trigger: section.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        // Only update React when the caption actually changes, not every frame.
        onUpdate: (self) => setStop(Math.min(STOPS.length - 1, Math.round(self.progress * (STOPS.length - 1)))),
      },
    });
    for (let i = 1; i < STOPS.length; i++) tl.to(rig, rigAt(i));
  }, { dependencies: [reduced], revertOnUpdate: true });

  // Reduced motion: jump straight to a stop, no movement in between.
  const jump = (i: number) => {
    Object.assign(rig, rigAt(i));
    setStop(i);
    setVersion((v) => v + 1);
  };

  return (
    <div ref={section} className={reduced ? "" : "relative h-[320vh]"}>
      <div className={reduced ? "" : "sticky top-4"}>
        <ThreeCanvas className="h-[min(70vh,520px)]" camera={{ position: STOPS[0].pos, fov: 45 }} label={`3D scene, camera at: ${STOPS[stop].title}`}>
          {() => (
            <>
              <Stage />
              <CameraRig rig={rig} version={version} />
            </>
          )}
        </ThreeCanvas>
        <div className="rounded-lg border border-line bg-surface/90 px-4 py-3" aria-live="polite">
          <p className="mb-1 text-sm text-muted">Stop {stop + 1} of {STOPS.length}</p>
          <p className="m-0 font-semibold">{STOPS[stop].title}</p>
          <p className="m-0 text-sm">{STOPS[stop].text}</p>
        </div>
        {reduced && (
          <div className="mt-2 flex flex-wrap gap-2">
            {STOPS.map((s, i) => <Button key={s.title} variant={i === stop ? "primary" : "ghost"} aria-pressed={i === stop} onClick={() => jump(i)}>{s.title}</Button>)}
          </div>
        )}
      </div>
    </div>
  );
}
