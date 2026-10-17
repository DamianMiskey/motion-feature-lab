"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { Button, Stage } from "@/components/ui";

gsap.registerPlugin(useGSAP);

const EASES = ["power2.inOut", "back.out(1.7)", "elastic.out(1, 0.4)", "bounce.out", "none"];

// A timeline: three tweens in sequence, controlled like a video. The slider
// both shows and sets the timeline's progress (0 → 1).
export function TimelineDemo() {
  const { reduced } = useMotion();
  const stage = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [ease, setEase] = useState(EASES[0]);
  const [progress, setProgress] = useState(0);

  useGSAP(() => {
    const travel = (stage.current?.clientWidth ?? 400) - 120;
    tl.current = gsap
      .timeline({ paused: reduced, repeat: reduced ? 0 : -1, repeatDelay: 0.6, yoyo: true, defaults: { duration: 0.9, ease }, onUpdate: () => setProgress(tl.current?.progress() ?? 0) })
      // In reduced mode the same sequence runs, but with no travel: only
      // colour and opacity change.
      .to(".a", reduced ? { opacity: 0.3 } : { x: travel })
      .to(".b", reduced ? { opacity: 0.3 } : { x: travel, rotation: 180 }, "<0.15") // starts 0.15 s after the previous one starts
      .to(".c", reduced ? { opacity: 0.3 } : { x: travel, scale: 0.6, borderRadius: "50%" }, "<0.15")
      .to(".box", { backgroundColor: "#e0577a", duration: 0.5 }, "-=0.3"); // overlaps the end
  }, { scope: stage, dependencies: [ease, reduced], revertOnUpdate: true });

  return (
    <>
      <Stage ref={stage} className="grid h-58 content-evenly px-7">
        <div className="box a size-16 rounded-xl bg-accent" />
        <div className="box b size-16 rounded-xl bg-accent" />
        <div className="box c size-16 rounded-xl bg-accent" />
      </Stage>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button onClick={() => tl.current?.play()}>Play</Button>
        <Button variant="ghost" onClick={() => tl.current?.pause()}>Pause</Button>
        <Button variant="ghost" onClick={() => tl.current?.reverse()}>Reverse</Button>
        <Button variant="ghost" onClick={() => tl.current?.restart()}>Restart</Button>
        <label className="text-sm">Ease{" "}
          <select value={ease} onChange={(e) => setEase(e.target.value)}>
            {EASES.map((e) => <option key={e}>{e}</option>)}
          </select>
        </label>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input
          className="min-w-0 flex-1"
          type="range" min={0} max={1} step={0.001} value={progress} aria-label="Timeline progress"
          onChange={(e) => tl.current?.pause().progress(Number(e.target.value))}
        />
        <span className="text-sm tabular-nums">{Math.round(progress * 100)}%</span>
      </div>
      {reduced && <p className="text-sm text-muted">Reduced motion: the timeline doesn&apos;t autoplay and only fades. Press Play, or switch to Full in the sidebar.</p>}
    </>
  );
}
