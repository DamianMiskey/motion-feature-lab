"use client";

import { useRef, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { gsap, useGSAP } from "@/lib/gsap";
import { Button } from "@/components/ui";

// Shapes for the morph demo, all drawn in a 200 × 200 box. MorphSVG works out
// how to turn one path into another, even with different numbers of points.
const SHAPES = {
  circle: "M100,20 C144,20 180,56 180,100 C180,144 144,180 100,180 C56,180 20,144 20,100 C20,56 56,20 100,20 Z",
  star: "M100,15 L124,72 L186,76 L138,115 L154,176 L100,142 L46,176 L62,115 L14,76 L76,72 Z",
  heart: "M100,175 C40,130 15,100 15,65 C15,38 37,20 62,20 C80,20 92,30 100,45 C108,30 120,20 138,20 C163,20 185,38 185,65 C185,100 160,130 100,175 Z",
};
type Shape = keyof typeof SHAPES;

const SIGNATURE = "M20,110 C40,40 70,30 75,95 C78,135 55,140 60,100 C66,60 95,55 100,95 C104,125 120,125 128,90 C134,65 150,60 152,95 C154,120 170,125 182,95 C192,70 210,62 222,90 C230,108 246,112 280,80";

export function SvgDemos() {
  const { reduced } = useMotion();
  const root = useRef<HTMLDivElement>(null);
  const draw = useRef<gsap.core.Tween | null>(null);
  const [drawn, setDrawn] = useState(1);
  const [shape, setShape] = useState<Shape>("circle");

  // DrawSVG animates a stroke's visible segment: "0%" is nothing, "100%" is
  // the whole line, "40% 60%" is just the middle.
  useGSAP(() => {
    draw.current = gsap.fromTo(".signature", { drawSVG: "0%" }, {
      drawSVG: "100%", duration: 2.4, ease: "power1.inOut", paused: reduced,
      onUpdate: () => setDrawn(draw.current?.progress() ?? 1),
    });
    if (reduced) draw.current.progress(1);
  }, { scope: root, dependencies: [reduced], revertOnUpdate: true });

  // Animations started from event handlers go through contextSafe, so they're
  // cleaned up with the component like the ones created inside useGSAP. This
  // one has its own context, so changing the motion setting doesn't reset it.
  const { contextSafe } = useGSAP({ scope: root });
  const morphTo = contextSafe((next: Shape) => {
    setShape(next);
    gsap.to(".morph", { morphSVG: SHAPES[next], duration: reduced ? 0 : 0.8, ease: "elastic.out(1, 0.6)" });
  });

  return (
    <div ref={root}>
      <h3>1. DrawSVG: a line drawn by hand</h3>
      <svg viewBox="0 0 300 160" className="mb-2 block max-h-55 w-full rounded-xl border border-line bg-bg" role="img" aria-label="A handwritten scribble being drawn">
        <path className="signature" d={SIGNATURE} fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button onClick={() => draw.current?.restart()}>Draw again</Button>
        <input className="min-w-0 flex-1" type="range" min={0} max={1} step={0.001} value={drawn} aria-label="How much of the line is drawn"
          onChange={(e) => draw.current?.pause().progress(Number(e.target.value))} />
        <span className="text-sm tabular-nums">{Math.round(drawn * 100)}%</span>
      </div>

      <h3>2. MorphSVG: one shape into another</h3>
      <svg viewBox="0 0 200 200" className="mb-2 block max-h-55 w-full rounded-xl border border-line bg-bg max-w-55 p-2" role="img" aria-label={`A ${shape}`}>
        <path className="morph" d={SHAPES.circle} fill="var(--accent)" />
      </svg>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {(Object.keys(SHAPES) as Shape[]).map((s) => (
          <Button key={s} variant={s === shape ? "primary" : "ghost"} onClick={() => morphTo(s)} aria-pressed={s === shape}>{s}</Button>
        ))}
      </div>
      {reduced && <p className="text-sm text-muted">Reduced motion: the line is shown complete and shapes switch without morphing.</p>}
    </div>
  );
}
