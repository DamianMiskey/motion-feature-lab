"use client";

import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useEffect, useRef, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { useInView } from "@/components/motion/useInView";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { Stage } from "@/components/ui";

gsap.registerPlugin(MotionPathPlugin);

const FLIGHT = "M30,250 C120,250 110,60 210,70 C310,80 260,230 360,220 C460,210 420,40 570,50";

// Waypoints as fractions of the stage, so they fit any width.
const POINTS = [
  { x: 0.1, y: 0.75 }, { x: 0.3, y: 0.2 }, { x: 0.5, y: 0.7 }, { x: 0.7, y: 0.25 }, { x: 0.9, y: 0.65 }, { x: 0.1, y: 0.75 },
];

// 1. An SVG plane flies along an SVG path as you scroll, turning to face
// its direction (autoRotate), while DrawSVG draws the trail behind it.
function ScrollFlight() {
  const { reduced } = useMotion();
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [progress, setProgress] = useState(0);

  useGSAP(() => {
    tl.current = gsap.timeline({
      defaults: { ease: "none" },
      // Scrubbed by scrolling, unless motion is reduced: then the slider below
      // moves the plane and nothing moves by itself.
      scrollTrigger: reduced ? undefined : { trigger: root.current, start: "top 75%", end: "bottom 25%", scrub: 0.6 },
      paused: reduced,
      onUpdate: () => setProgress(tl.current?.progress() ?? 0),
    })
      .to(".plane", {
        motionPath: { path: ".flight", align: ".flight", alignOrigin: [0.5, 0.5], autoRotate: true },
      })
      .fromTo(".trail", { drawSVG: "0%" }, { drawSVG: "100%" }, 0);
    tl.current.progress(reduced ? progress : 0);
    // Positions depend on the layout, so re-measure once fonts and the rest settle.
    ScrollTrigger.refresh();
  }, { scope: root, dependencies: [reduced], revertOnUpdate: true });

  return (
    <div ref={root}>
      <svg viewBox="0 0 600 300" className="mb-2 block w-full rounded-xl border border-line bg-bg" role="img" aria-label="A paper plane following a curved flight path">
        <path className="flight" d={FLIGHT} fill="none" stroke="var(--line)" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
        <path className="trail" d={FLIGHT} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
        {/* Drawn pointing right (0°): autoRotate turns it along the path. */}
        <g className="plane">
          <path d="M0,-12 L34,0 L0,12 L8,0 Z" fill="var(--color-pink)" />
          <path d="M8,0 L34,0" stroke="white" strokeWidth="1.5" />
        </g>
      </svg>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {reduced ? (
          <input className="min-w-0 flex-1" type="range" min={0} max={1} step={0.001} value={progress} aria-label="Plane position along the path"
            onChange={(e) => tl.current?.progress(Number(e.target.value))} />
        ) : (
          <span className="text-sm text-muted">Scroll slowly: the flight follows the scrollbar.</span>
        )}
        <span className="text-sm tabular-nums">{Math.round(progress * 100)}%</span>
      </div>
    </div>
  );
}

// 2. No SVG needed: an HTML element travels through a list of points, and
// curviness decides how round the curve between them is. The dashed line
// is the same curve, drawn with MotionPathPlugin's own helpers.
function Waypoints() {
  const { reduced } = useMotion();
  const stage = useRef<HTMLDivElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const inView = useInView(stage);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [curviness, setCurviness] = useState(1.5);

  // Track the stage size: the points are fractions of it.
  useEffect(() => {
    const el = stage.current!;
    const observer = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const points = POINTS.map((p) => ({ x: p.x * size.w, y: p.y * size.h }));
  const curve = size.w ? MotionPathPlugin.rawPathToString(MotionPathPlugin.arrayToRawPath(points, { curviness })) : "";

  useGSAP(() => {
    if (!size.w) return;
    tween.current = gsap.fromTo(".runner", { x: points[0].x, y: points[0].y }, {
      motionPath: { path: points, curviness, autoRotate: true },
      duration: 5, ease: "none", repeat: -1, paused: true,
    });
    if (reduced) tween.current.progress(0.1);
  }, { scope: stage, dependencies: [size, curviness, reduced], revertOnUpdate: true });

  // Runs only while on screen, and never by itself with reduced motion.
  useEffect(() => {
    if (inView && !reduced) tween.current?.play();
    else tween.current?.pause();
  }, [inView, reduced, size, curviness]);

  return (
    <>
      <Stage ref={stage} className="h-70">
        <svg className="absolute inset-0 size-full" aria-hidden="true">
          <path d={curve} fill="none" stroke="var(--accent)" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="6 6" />
        </svg>
        {POINTS.slice(0, -1).map((p, i) => (
          <span key={i} className="absolute size-3 -translate-1/2 rounded-full border-2 border-accent bg-surface" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }} />
        ))}
        {/* Points are translations from the element's own position: top-left. */}
        <div className="runner absolute top-0 left-0 -mt-3 -ml-4 h-6 w-8" aria-hidden="true">
          <svg viewBox="0 0 32 24" className="size-full"><path d="M0,2 L32,12 L0,22 L7,12 Z" fill="var(--color-pink)" /></svg>
        </div>
      </Stage>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          curviness
          <input className="min-w-0 flex-1" type="range" min={0} max={2.5} step={0.1} value={curviness} onChange={(e) => setCurviness(Number(e.target.value))} />
          <code className="tabular-nums">{curviness.toFixed(1)}</code>
        </label>
      </div>
      <p className="text-sm text-muted">
        0 gives straight lines between the points, 1 is the default, higher values swing wider.
        {reduced && " Reduced motion: the arrow stays put; the curve still updates."}
      </p>
    </>
  );
}

export function PathDemos() {
  return (
    <>
      <h3>1. Follow an SVG path, scrubbed by scrolling</h3>
      <ScrollFlight />
      <h3>2. A curve through points</h3>
      <Waypoints />
    </>
  );
}
