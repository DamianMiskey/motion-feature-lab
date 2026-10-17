"use client";

import { Canvas, type CanvasProps } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { useInView } from "@/components/motion/useInView";
import { Stage } from "@/components/ui";

// The frame every 3D demo uses. It renders continuously only while the scene
// is on screen and motion isn't reduced; otherwise frameloop "demand" redraws
// only when something changes (dragging the camera, a control). Children get
// `animate` to know whether to move things themselves.
export function ThreeCanvas({
  label,
  className = "h-95",
  children,
  ...props
}: Omit<CanvasProps, "children" | "frameloop" | "fallback"> & { label: string; className?: string; children: (animate: boolean) => ReactNode }) {
  const { reduced } = useMotion();
  const wrapper = useRef<HTMLDivElement>(null);
  const animate = useInView(wrapper) && !reduced;
  return (
    <Stage ref={wrapper} className={className}>
      <Canvas
        frameloop={animate ? "always" : "demand"}
        fallback={<p className="p-4 text-muted">This browser can&apos;t show WebGL, so the 3D scene is skipped.</p>}
        aria-label={label}
        {...props}
      >
        {children(animate)}
      </Canvas>
    </Stage>
  );
}
