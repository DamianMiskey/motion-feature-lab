"use client";

import { Canvas, type CanvasProps } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { useInView } from "@/components/motion/useInView";
import { Stage } from "@/components/ui";
import { useFullscreen } from "./useFullscreen";

// The frame every 3D demo uses. It renders continuously only while the scene
// is on screen and motion isn't reduced; otherwise frameloop "demand" redraws
// only when something changes (dragging the camera, a control). Children get
// `animate` to know whether to move things themselves.
export function ThreeCanvas({
  label,
  className = "h-95",
  overlay,
  fullscreen = false,
  children,
  ...props
}: Omit<CanvasProps, "children" | "frameloop" | "fallback"> & {
  label: string;
  className?: string;
  /** DOM laid over the canvas, inside the same React tree (so context works). */
  overlay?: ReactNode;
  /** A button (bottom-left) that plays the scene full screen. The games use it. */
  fullscreen?: boolean;
  children: (animate: boolean) => ReactNode;
}) {
  const { reduced } = useMotion();
  const wrapper = useRef<HTMLDivElement>(null);
  const animate = useInView(wrapper) && !reduced;
  const full = useFullscreen(wrapper);
  return (
    <Stage
      ref={wrapper}
      // Full screen: the frame covers the viewport (the canvas resizes with it).
      // 100dvh is the visible height on phones, under the browser's own bars.
      // (Inline styles, so they beat the frame's own classes: relative, height, margin.)
      className={className}
      style={full.active ? { position: "fixed", inset: 0, zIndex: 50, width: "100vw", height: "100dvh", margin: 0, borderRadius: 0, border: 0 } : undefined}
      data-fullscreen={full.mode}
    >
      <Canvas
        frameloop={animate ? "always" : "demand"}
        fallback={<p className="p-4 text-muted">This browser can&apos;t show WebGL, so the 3D scene is skipped.</p>}
        // A plain <div> may not carry a label; as role="img" the scene is
        // announced as one picture with this description.
        role="img"
        aria-label={label}
        {...props}
      >
        {children(animate)}
      </Canvas>
      {overlay}
      {fullscreen && (
        <button
          type="button"
          onClick={full.toggle}
          aria-pressed={full.active}
          className="absolute bottom-3 left-3 z-20 grid size-10 cursor-pointer place-items-center rounded-full border border-white/40 bg-black/45 text-white hover:bg-black/65"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {full.active
              ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
              : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
          </svg>
          <span className="sr-only">{full.active ? "Exit full screen" : "Full screen"}</span>
        </button>
      )}
    </Stage>
  );
}
