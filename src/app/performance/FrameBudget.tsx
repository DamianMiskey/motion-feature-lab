"use client";

import { useRef, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { Button, Stage } from "@/components/ui";
import { gsap, useGSAP } from "@/lib/gsap";

const DOTS = 300;
type Mode = "transform" | "layout";

// The same animation two ways. Animating `x` (a transform) lets the browser
// move already-painted layers on the GPU. Animating `left`/`top` changes
// layout, so every frame the browser recalculates positions and repaints.
// The FPS counters show what each costs on this device.
function Field({ mode, running }: { mode: Mode; running: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  const [fps, setFps] = useState<number | null>(null);

  useGSAP(() => {
    if (!running) return;
    // Random spots anywhere in the field (re-picked on every repeat).
    const w = () => gsap.utils.random(0, (stage.current?.clientWidth ?? 300) - 10);
    const h = () => gsap.utils.random(0, (stage.current?.clientHeight ?? 200) - 10);
    const props = mode === "transform" ? { x: w, y: h } : { left: w, top: h };
    gsap.to(".dot", { ...props, duration: 1, repeat: -1, repeatRefresh: true, ease: "sine.inOut", stagger: { each: 0.004 } });

    // Count frames for this field while it runs.
    let frames = 0;
    let last = performance.now();
    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, { scope: stage, dependencies: [mode, running], revertOnUpdate: true });

  return (
    <div>
      <p className="mb-1 text-sm"><code>{mode === "transform" ? "x / y (transform)" : "left / top (layout)"}</code> · <strong className="tabular-nums">{running ? (fps ?? "…") : "–"} fps</strong></p>
      <Stage ref={stage} className="h-52">
        {Array.from({ length: DOTS }, (_, i) => (
          <span key={i} className="dot absolute top-0 left-0 size-2 rounded-full bg-accent" style={{ opacity: 0.35 + (i % 7) / 10 }} />
        ))}
      </Stage>
    </div>
  );
}

export function FrameBudget() {
  const { reduced } = useMotion();
  const [running, setRunning] = useState(false);
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <Field mode="transform" running={running} />
        <Field mode="layout" running={running} />
      </div>
      <Button onClick={() => setRunning(!running)}>{running ? "Stop" : `Animate ${DOTS * 2} dots`}</Button>
      {reduced && <p className="text-sm text-muted">Reduced motion is on: nothing moves until you press the button.</p>}
    </>
  );
}
