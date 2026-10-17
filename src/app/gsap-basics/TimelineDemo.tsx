"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";

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
      <div ref={stage} className="stage" style={{ height: 230, display: "grid", alignContent: "space-evenly", padding: "0 28px" }}>
        <div className="box a" />
        <div className="box b" />
        <div className="box c" />
      </div>
      <div className="controls">
        <button onClick={() => tl.current?.play()}>Play</button>
        <button className="ghost" onClick={() => tl.current?.pause()}>Pause</button>
        <button className="ghost" onClick={() => tl.current?.reverse()}>Reverse</button>
        <button className="ghost" onClick={() => tl.current?.restart()}>Restart</button>
        <label className="small">Ease{" "}
          <select value={ease} onChange={(e) => setEase(e.target.value)}>
            {EASES.map((e) => <option key={e}>{e}</option>)}
          </select>
        </label>
      </div>
      <div className="controls">
        <input
          type="range" min={0} max={1} step={0.001} value={progress} aria-label="Timeline progress"
          onChange={(e) => tl.current?.pause().progress(Number(e.target.value))}
        />
        <span className="small stamp">{Math.round(progress * 100)}%</span>
      </div>
      {reduced && <p className="small muted">Reduced motion: the timeline doesn&apos;t autoplay and only fades. Press Play, or switch to Full in the sidebar.</p>}
    </>
  );
}
