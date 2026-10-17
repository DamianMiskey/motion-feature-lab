"use client";

import "@/lib/rive-runtime";
import { Float, OrbitControls } from "@react-three/drei";
import { Fit, Layout, useRive } from "@rive-app/react-canvas";
import { useCallback, useRef } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { Anchor, type ScreenPoint } from "@/components/three/Anchor";
import { ThreeCanvas } from "@/components/three/ThreeCanvas";

// A normal React component, rendered over the canvas: it keeps real pointer
// events, accessibility and access to the page's context.
function RatingCard() {
  const { RiveComponent } = useRive(
    { src: "/rive/rating.riv", stateMachines: "State Machine 1", autoplay: true, layout: new Layout({ fit: Fit.Contain }) },
    { shouldUseIntersectionObserver: false },
  );
  return (
    <div className="w-56 rounded-xl border border-line bg-surface/95 p-3 text-fg shadow-lg">
      <p className="m-0 text-sm font-semibold">Rate this scene</p>
      <div className="h-24"><RiveComponent aria-label="Interactive star rating" role="img" /></div>
      <p className="m-0 text-xs text-muted">A DOM element pinned to a 3D point: hover and click work as usual.</p>
    </div>
  );
}

export function RiveInSpace() {
  const { reduced } = useMotion();
  const card = useRef<HTMLDivElement>(null);
  // Called every frame with the anchor's screen position.
  const moveCard = useCallback(({ x, y, visible }: ScreenPoint) => {
    const el = card.current;
    if (!el) return;
    el.style.transform = `translate(${x + 16}px, ${y}px) translate(0, -50%)`; // to the right of the point, centred on it
    el.style.visibility = visible ? "visible" : "hidden";
  }, []);
  return (
    <ThreeCanvas
      camera={{ position: [2.5, 2, 5], fov: 45 }}
      label="A floating 3D gem with a Rive star-rating card pinned above it"
      overlay={
        <div ref={card} className="absolute top-0 left-0 will-change-transform">
          <RatingCard />
        </div>
      }
    >
      {(animate) => (
        <>
          <color attach="background" args={["#14131a"]} />
          <hemisphereLight args={["#ffffff", "#3a3550", 1.2]} />
          <directionalLight position={[3, 5, 4]} intensity={1.5} />
          <Float speed={animate ? 2 : 0} rotationIntensity={reduced ? 0 : 0.6} floatIntensity={reduced ? 0 : 0.8}>
            <mesh position={[0, 1.2, 0]}>
              <octahedronGeometry args={[0.9]} />
              <meshStandardMaterial color="#7b6cf0" roughness={0.25} metalness={0.4} flatShading />
            </mesh>
          </Float>
          {/* The card's anchor: the gem's right-hand tip. */}
          <Anchor position={[0.9, 1.2, 0]} onMove={moveCard} />
          <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#2a2836" />
          </mesh>
          <OrbitControls target={[0, 1.5, 0]} minDistance={3} maxDistance={10} maxPolarAngle={Math.PI / 2.05} />
        </>
      )}
    </ThreeCanvas>
  );
}
