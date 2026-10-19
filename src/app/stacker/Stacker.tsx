"use client";

import { useCallback, useRef, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { ThreeCanvas } from "@/components/three/ThreeCanvas";
import { Button } from "@/components/ui";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { type Axis, BASE, drop, grow, HEIGHT, type Slab, slide, speed, STREAK_TO_GROW } from "./stack";
import { type Chunk, type Live, type Placed, StackerScene } from "./StackerScene";

type Screen = "intro" | "playing" | "over";
const RANGE = 4.2;
const BEST_KEY = "motion-lab:stacker-best";
const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } };
const writeBest = (n: number) => { try { localStorage.setItem(BEST_KEY, String(n)); } catch {} };
const hueAt = (level: number) => (200 + level * 9) % 360;

const fresh = (): Live => ({ top: BASE, moving: { ...BASE }, axis: "x", t: 0, level: 1, running: false, cameraY: 0 });

export function Stacker() {
  const { reduced } = useMotion();
  const root = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const live = useRef<Live>(fresh());
  const ids = useRef(1);
  const streak = useRef(0);

  const [screen, setScreen] = useState<Screen>("intro");
  const [placed, setPlaced] = useState<Placed[]>([{ ...BASE, id: 0, level: 0, hue: hueAt(0) }]);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [flash, setFlash] = useState<{ id: number; slab: Slab; level: number } | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [newBest, setNewBest] = useState(false);

  // Called every frame by the scene: slide the slab. Lives here because this
  // component owns the game; the scene only draws it.
  const step = useCallback((dt: number) => {
    const g = live.current;
    if (g.running) g.t += dt * speed(g.level);
    const pos = slide(g.t, RANGE);
    if (g.axis === "x") g.moving.x = g.top.x + pos;
    else g.moving.z = g.top.z + pos;
    // The slab's distance from a perfect drop, for the test autopilot.
    layerRef.current?.setAttribute("data-offset", (g.axis === "x" ? g.moving.x - g.top.x : g.moving.z - g.top.z).toFixed(3));
  }, []);

  const pop = (text: string) => {
    const el = root.current?.querySelector<HTMLElement>(".pop");
    if (!el) return;
    el.textContent = text;
    gsap.fromTo(el, { autoAlpha: 1, y: 0, scale: reduced ? 1 : 0.7 }, { autoAlpha: 0, y: reduced ? 0 : -40, scale: 1, duration: 0.8, ease: "power2.out", overwrite: true });
  };

  const start = () => {
    live.current = { ...fresh(), running: true };
    streak.current = 0;
    setPlaced([{ ...BASE, id: ids.current++, level: 0, hue: hueAt(0) }]);
    setChunks([]);
    setFlash(null);
    setScore(0);
    setNewBest(false);
    setBest(readBest());
    setScreen("playing");
    requestAnimationFrame(() => layerRef.current?.focus({ preventScroll: true }));
  };

  const dropNow = () => {
    const g = live.current;
    if (!g.running) return;
    const result = drop(g.top, g.moving, g.axis);
    const hue = hueAt(g.level);
    if (result.kind === "miss") {
      // The whole slab falls, and that's the game.
      g.running = false;
      setChunks((c) => [...c, { ...g.moving, id: ids.current++, level: g.level, hue }]);
      const height = g.level - 1;
      if (height > readBest()) { writeBest(height); setNewBest(true); }
      setBest(Math.max(height, readBest()));
      setScreen("over");
      return;
    }
    let slab = result.placed;
    if (result.kind === "perfect") {
      streak.current += 1;
      if (streak.current >= STREAK_TO_GROW) slab = grow(grow(slab, "x"), "z");
      setFlash({ id: ids.current++, slab, level: g.level });
      pop(streak.current > 1 ? `Perfect ×${streak.current}` : "Perfect!");
    } else {
      streak.current = 0;
      setChunks((c) => [...c, { ...result.chunk, id: ids.current++, level: g.level, hue }]);
    }
    setPlaced((p) => [...p, { ...slab, id: ids.current++, level: g.level, hue }]);
    setScore(g.level);
    // Next slab: same size as the one just placed, along the other axis,
    // starting from the far end.
    const axis: Axis = g.axis === "x" ? "z" : "x";
    g.top = slab;
    g.moving = { ...slab };
    g.axis = axis;
    g.t = 0;
    g.level += 1;
    gsap.to(g, { cameraY: (g.level - 2) * HEIGHT, duration: reduced ? 0 : 0.4, ease: "power2.out", overwrite: true });
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") { e.preventDefault(); dropNow(); }
  };

  const onChunkDone = useCallback((id: number) => setChunks((c) => c.filter((x) => x.id !== id)), []);

  // Menu panels pop in with a split-letter title.
  useGSAP(() => {
    const panel = root.current!.querySelector(".panel");
    if (!panel) return;
    const tl = gsap.timeline();
    tl.from(panel, { autoAlpha: 0, scale: reduced ? 1 : 0.92, y: reduced ? 0 : 24, duration: reduced ? 0.25 : 0.45, ease: "back.out(1.6)" });
    const title = panel.querySelector(".panel-title");
    if (title && !reduced) tl.from(SplitText.create(title, { type: "chars", aria: "auto" }).chars, { yPercent: 110, autoAlpha: 0, stagger: 0.03, duration: 0.45, ease: "power3.out" }, 0.1);
  }, { scope: root, dependencies: [screen], revertOnUpdate: true });

  const hue = hueAt(score + 1); // the level being played is always one above the score

  const overlay = (
    <div className="pointer-events-none absolute inset-0 text-white">
      {screen === "playing" && (
        <div
          ref={layerRef}
          className="pointer-events-auto absolute inset-0 cursor-pointer touch-manipulation select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
          tabIndex={0}
          role="application"
          aria-label="Press Space or tap to drop the slab"
          onPointerDown={dropNow}
          onKeyDown={onKey}
        />
      )}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between px-4 pt-3 text-sm">
        <span className="text-white/80">Best {Math.max(best, score)}</span>
        <span className="text-5xl font-black tabular-nums drop-shadow" aria-live="polite" aria-label={`Height ${score}`}>{score}</span>
        <span className="w-12" />
      </div>
      <span className="pop invisible absolute top-[22%] left-1/2 -translate-x-1/2 text-2xl font-bold drop-shadow" aria-hidden="true" />
      {screen !== "playing" && (
        <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/30 p-4">
          <div className="panel w-full max-w-xs rounded-2xl border border-white/15 bg-[#17161f]/95 p-6 text-center shadow-2xl">
            <h3 className="panel-title mt-0 mb-2 overflow-hidden text-3xl font-bold">{screen === "intro" ? "Stacker" : `Height ${score}`}</h3>
            <p className="text-sm text-white/80">
              {screen === "intro"
                ? "Tap, click or press Space to drop each slab on the tower. Overhangs fall off; line one up exactly for a Perfect."
                : newBest ? "A new best!" : `Best: ${best}`}
            </p>
            <Button className="mt-2" onClick={start}>{screen === "intro" ? "Play" : "Play again"}</Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div ref={root}>
      <ThreeCanvas orthographic camera={{ zoom: 50, position: [9, 9, 9], near: -50, far: 200 }} className="h-[480px] sm:h-[560px]" label={`Stacker: a tower ${score} slabs high`} overlay={overlay}>
        {() => (
          <StackerScene live={live} step={step} placed={placed} chunks={chunks} flash={flash} hue={hue} reduced={reduced} onChunkDone={onChunkDone} />
        )}
      </ThreeCanvas>
      <p className="text-sm text-muted">
        Tap or click anywhere on the game, or press Space or Enter once it has focus.
        {reduced && " Reduced motion: falling pieces vanish instead of tumbling and the camera jumps rather than glides; the slab still slides, since that's the game."}
      </p>
    </div>
  );
}
