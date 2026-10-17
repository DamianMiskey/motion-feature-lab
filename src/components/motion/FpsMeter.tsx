"use client";

import { useEffect, useState } from "react";
import { useMotion } from "./MotionProvider";

// Counts frames with requestAnimationFrame and shows the rate twice a second.
// The browser draws at the screen's refresh rate (often 60 or 120 Hz), so a
// number well below that while a demo runs means it's dropping frames.
function Meter() {
  const [fps, setFps] = useState<number | null>(null);
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let id = requestAnimationFrame(function tick(now) {
      frames++;
      if (now - last >= 500) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="fixed right-3 bottom-3 z-50 rounded-md bg-fg px-2 py-1 font-mono text-sm font-semibold text-bg tabular-nums" role="status" aria-label="Frames per second">
      {fps ?? "…"} <span className="font-normal opacity-70">fps</span>
    </div>
  );
}

export function FpsMeter() {
  const { showFps } = useMotion();
  return showFps ? <Meter /> : null;
}
