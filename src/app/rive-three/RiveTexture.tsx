"use client";

import "@/lib/rive-runtime";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Fit, Layout, Rive } from "@rive-app/react-canvas";
import { useEffect, useRef, useState } from "react";
import { type CanvasTexture, type Group, SRGBColorSpace } from "three";
import { useMotion } from "@/components/motion/MotionProvider";
import { ThreeCanvas } from "@/components/three/ThreeCanvas";

const SIZE = 512;
const HEIGHT = Math.round(SIZE * (2.1 / 3.1)); // the screen's aspect ratio

// Rive draws into its own canvas; Three.js wraps that canvas in a
// CanvasTexture (declared in JSX, so react-three-fiber creates and disposes
// it) and re-uploads it each frame, so the animation plays on a 3D surface.
function Television({ canvas, animate }: { canvas: HTMLCanvasElement; animate: boolean }) {
  const tv = useRef<Group>(null);
  const texture = useRef<CanvasTexture>(null);

  useFrame(() => {
    if (!animate || !texture.current) return;
    texture.current.needsUpdate = true; // copy Rive's latest frame to the GPU
    if (tv.current) tv.current.rotation.y = Math.sin(performance.now() / 2500) * 0.5;
  });

  return (
    <group ref={tv} position={[0, 1.4, 0]}>
      <RoundedBox args={[3.4, 2.4, 0.25]} radius={0.08}>
        <meshStandardMaterial color="#26242f" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0, 0.13]}>
        <planeGeometry args={[3.1, 2.1]} />
        <meshBasicMaterial toneMapped={false}>
          {/* Rive draws sRGB colours. */}
          <canvasTexture ref={texture} attach="map" args={[canvas]} colorSpace={SRGBColorSpace} />
        </meshBasicMaterial>
      </mesh>
    </group>
  );
}

export function RiveTexture() {
  const { reduced } = useMotion();
  // Rive's player gets a canvas of its own, which Three.js reads as a texture.
  // Rive fits the artboard to the canvas's on-screen box and draws nothing if
  // that box is 0 × 0 (detached, or sized to zero), so the canvas is attached
  // to the page at its real size, just positioned off screen.
  const [canvas] = useState(() => {
    if (typeof document === "undefined") return null;
    const c = Object.assign(document.createElement("canvas"), { width: SIZE, height: HEIGHT });
    c.setAttribute("aria-hidden", "true");
    c.style.cssText = `position:fixed;top:0;left:-10000px;width:${SIZE}px;height:${HEIGHT}px;pointer-events:none`;
    return c;
  });
  const rive = useRef<Rive | null>(null);

  useEffect(() => {
    if (!canvas) return;
    document.body.append(canvas);
    const player = new Rive({ src: "/rive/truck.riv", canvas, stateMachines: "drive", autoplay: true, layout: new Layout({ fit: Fit.Cover }) });
    rive.current = player;
    return () => {
      player.cleanup();
      document.body.removeChild(canvas);
    };
  }, [canvas]);

  useEffect(() => {
    if (reduced) rive.current?.pause();
    else rive.current?.play();
  }, [reduced]);

  return (
    <ThreeCanvas camera={{ position: [0, 1.8, 6], fov: 40 }} label="A 3D television whose screen plays the Rive truck animation">
      {(animate) => (
        <>
          <color attach="background" args={["#14131a"]} />
          <hemisphereLight args={["#ffffff", "#3a3550", 1.2]} />
          <directionalLight position={[3, 5, 4]} intensity={1.5} />
          {canvas ? <Television canvas={canvas} animate={animate} /> : null}
          <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#2a2836" />
          </mesh>
          <OrbitControls target={[0, 1.4, 0]} minDistance={3.5} maxDistance={10} maxPolarAngle={Math.PI / 2.05} />
        </>
      )}
    </ThreeCanvas>
  );
}
