"use client";

import { useRef, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { Flip, gsap, useGSAP } from "@/lib/gsap";
import { Button, cx } from "@/components/ui";

type Filter = "all" | "warm" | "cool";
const TILES = [
  { id: 1, hue: 260, tone: "cool" }, { id: 2, hue: 340, tone: "warm" }, { id: 3, hue: 200, tone: "cool" },
  { id: 4, hue: 20, tone: "warm" }, { id: 5, hue: 160, tone: "cool" }, { id: 6, hue: 45, tone: "warm" },
  { id: 7, hue: 300, tone: "warm" }, { id: 8, hue: 230, tone: "cool" },
] as const;

// Flip = First, Last, Invert, Play. Record where everything is (getState),
// let React change the layout, then Flip.from animates each element from its
// old position to its new one. React owns the DOM; GSAP only animates it.
export function FlipDemo() {
  const { reduced } = useMotion();
  const grid = useRef<HTMLDivElement>(null);
  const state = useRef<Flip.FlipState | null>(null);
  const [order, setOrder] = useState<number[]>(TILES.map((t) => t.id));
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  // Capture the "first" positions just before a change.
  const change = (update: () => void) => {
    state.current = Flip.getState(grid.current!.querySelectorAll(".flip-tile"));
    update();
  };

  // After React has rendered the "last" layout, animate from the old one.
  useGSAP(() => {
    if (!state.current) return;
    Flip.from(state.current, {
      duration: reduced ? 0 : 0.6,
      ease: "power2.inOut",
      absolute: true, // takes tiles out of the grid while they move, so they don't push each other
      nested: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: reduced ? 0 : 0.4 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.6, duration: reduced ? 0 : 0.3 }),
    });
    state.current = null;
  }, { scope: grid, dependencies: [order, filter, expanded] });

  const visible = order.map((id) => TILES.find((t) => t.id === id)!).filter((t) => filter === "all" || t.tone === filter);

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button onClick={() => change(() => setOrder(gsap.utils.shuffle([...order])))}>Shuffle</Button>
        {(["all", "warm", "cool"] as Filter[]).map((f) => (
          <Button key={f} variant={f === filter ? "primary" : "ghost"} aria-pressed={f === filter} onClick={() => change(() => setFilter(f))}>{f}</Button>
        ))}
        <span className="text-sm text-muted">Click a tile to expand it.</span>
      </div>
      <div ref={grid} className="grid min-h-50 grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2.5">
        {visible.map((t) => (
          <button
            key={t.id}
            data-flip-id={t.id}
            className={cx("flip-tile aspect-square cursor-pointer rounded-xl border-0 text-2xl font-bold text-white", expanded === t.id && "col-span-2 row-span-2")}
            style={{ background: `hsl(${t.hue} 70% 55%)` }}
            aria-expanded={expanded === t.id}
            onClick={() => change(() => setExpanded(expanded === t.id ? null : t.id))}
          >
            {t.id}
          </button>
        ))}
      </div>
      {reduced && <p className="text-sm text-muted">Reduced motion: the layout still changes, instantly.</p>}
    </>
  );
}
