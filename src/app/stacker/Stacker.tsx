"use client";

import { useCallback, useRef, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { ThreeCanvas } from "@/components/three/ThreeCanvas";
import { Leaderboard } from "@/components/Leaderboard";
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
    // Copy what this drop needs out of the live game first. State updaters
    // run later, after the lines below have moved g on to the next slab: an
    // updater that read g.level would put the slab one level too high, inside
    // the next sliding slab (which looked like slabs passing through each
    // other, with flickering faces).
    const level = g.level;
    const moving = { ...g.moving };
    const result = drop(g.top, moving, g.axis);
    const hue = hueAt(level);
    if (result.kind === "miss") {
      // The whole slab falls, and that's the game.
      g.running = false;
      // The whole slab falls, away from the tower in the direction it was sliding.
      const away = Math.sign((g.axis === "x" ? moving.x - g.top.x : moving.z - g.top.z) || 1);
      const fallen: Chunk = { ...moving, id: ids.current++, level, hue, out: g.axis === "x" ? { x: away, z: 0 } : { x: 0, z: away } };
      setChunks((c) => [...c, fallen]);
      const height = level - 1;
      if (height > readBest()) { writeBest(height); setNewBest(true); }
      setBest(Math.max(height, readBest()));
      setScreen("over");
      return;
    }
    let slab = result.placed;
    if (result.kind === "perfect") {
      streak.current += 1;
      if (streak.current >= STREAK_TO_GROW) slab = grow(grow(slab, "x"), "z");
      setFlash({ id: ids.current++, slab, level });
      pop(streak.current > 1 ? `Perfect ×${streak.current}` : "Perfect!");
    } else {
      streak.current = 0;
      const away = Math.sign(g.axis === "x" ? result.chunk.x - result.placed.x : result.chunk.z - result.placed.z);
      const out = g.axis === "x" ? { x: away, z: 0 } : { x: 0, z: away };
      const piece: Chunk = { ...result.chunk, id: ids.current++, level, hue, out };
      setChunks((c) => [...c, piece]);
    }
    const landed: Placed = { ...slab, id: ids.current++, level, hue };
    setPlaced((p) => [...p, landed]);
    setScore(level);
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
        <div className="pointer-events-auto absolute inset-0 flex overflow-y-auto bg-black/30 p-4">
          <div className="panel m-auto w-full max-w-xs rounded-2xl border border-white/15 bg-[#17161f]/95 p-6 text-center shadow-2xl">
            <h3 className="panel-title mt-0 mb-2 overflow-hidden text-3xl font-bold">{screen === "intro" ? "Stacker" : `Height ${score}`}</h3>
            <p className="text-sm text-white/80">
              {screen === "intro"
                ? "Tap, click or press Space to drop each slab on the tower. Overhangs fall off; line one up exactly for a Perfect."
                : newBest ? "A new best!" : `Best: ${best}`}
            </p>
            <Button className="mt-2" onClick={start}>{screen === "intro" ? "Play" : "Play again"}</Button>
            {screen === "over" && <Leaderboard game="stacker" value={score} />}
          </div>
        </div>
      )}
    </div>
  );

  return (
    // data-top: the level of the highest placed slab, which must always equal
    // the score (a regression check for the bug described in dropNow).
    <div ref={root} data-top={placed.at(-1)?.level}>
      <ThreeCanvas fullscreen orthographic camera={{ zoom: 50, position: [9, 9, 9], near: -50, far: 200 }} className="h-[480px] sm:h-[560px]" label={`Stacker: a tower ${score} slabs high`} overlay={overlay}>
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
