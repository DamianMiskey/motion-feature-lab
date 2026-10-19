"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { ThreeCanvas } from "@/components/three/ThreeCanvas";
import { Leaderboard } from "@/components/Leaderboard";
import { Button } from "@/components/ui";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { useTilt } from "../marble/tilt";
import { BOOST, BOUNDS, classify, cruise, FAR, field, NEAR_MISS_POINTS, ROCKS, rng, spawn } from "./field";
import { type Live, RunnerScene } from "./RunnerScene";

type Screen = "intro" | "playing" | "over";
const BEST_KEY = "motion-lab:runner-best";
const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } };
const writeBest = (n: number) => { try { localStorage.setItem(BEST_KEY, String(n)); } catch {} };
const SHIP_SPEED = 9; // units per second at full input
const scoreOf = (g: Live) => Math.floor(g.distance / 2) + g.near * NEAR_MISS_POINTS;

const fresh = (seed: number): Live => ({
  running: false, t: 0, speed: 0, boosting: false, ship: { x: 0, y: -0.5 }, vel: { x: 0, y: 0 },
  rocks: field(seed, ROCKS), shake: 0, distance: 0, near: 0, energy: 1,
});

export function Runner() {
  const { reduced } = useMotion();
  const root = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const energyRef = useRef<HTMLSpanElement>(null);
  const live = useRef<Live>(fresh(1));
  const random = useRef(rng(1));
  const boostKeys = useRef(new Set<string>());
  const boostButton = useRef(false);

  const [screen, setScreen] = useState<Screen>("intro");
  const [final, setFinal] = useState({ score: 0, best: 0, newBest: false });
  const tilt = useTilt(layerRef, screen === "playing");
  const canTilt = useSyncExternalStore(
    () => () => {},
    () => typeof DeviceOrientationEvent !== "undefined" && matchMedia("(pointer: coarse)").matches,
    () => false,
  );

  const pop = useCallback((text: string) => {
    const el = root.current?.querySelector<HTMLElement>(".pop");
    if (!el) return;
    el.textContent = text;
    gsap.fromTo(el, { autoAlpha: 1, y: 0, scale: reduced ? 1 : 0.8 }, { autoAlpha: 0, y: reduced ? 0 : -30, scale: 1, duration: 0.7, ease: "power2.out", overwrite: true });
  }, [reduced]);

  const crash = useCallback(() => {
    const g = live.current;
    g.running = false;
    const score = scoreOf(g);
    const best = readBest();
    if (score > best) writeBest(score);
    setFinal({ score, best: Math.max(score, best), newBest: score > best });
    // A short, sharp shake (none with reduced motion), then the results.
    if (!reduced) gsap.fromTo(g, { shake: 1 }, { shake: 0, duration: 0.6, ease: "power2.out" });
    setScreen("over");
  }, [reduced]);

  // One frame of the game, called by the scene: speed, boost, steering, and
  // the rocks coming past. Lives here because this component owns the game.
  const step = useCallback((dt: number) => {
    const g = live.current;
    if (!g.running) { g.speed = Math.max(0, g.speed - 30 * dt); return; }
    g.t += dt;
    const wantBoost = boostKeys.current.size > 0 || boostButton.current;
    g.boosting = wantBoost && g.energy > 0.02;
    g.energy = Math.max(0, Math.min(1, g.energy + (g.boosting ? -0.4 : 0.12) * dt));
    g.speed = cruise(g.t) * (g.boosting ? BOOST : 1);
    g.distance += g.speed * dt * (g.boosting ? 2 : 1);

    // Steer: the velocity eases towards the input, the ship stays in bounds.
    const k = Math.min(1, dt * 10);
    g.vel.x += (tilt.target.current.x * SHIP_SPEED - g.vel.x) * k;
    g.vel.y += (tilt.target.current.y * SHIP_SPEED - g.vel.y) * k;
    g.ship.x = Math.max(-BOUNDS.x, Math.min(BOUNDS.x, g.ship.x + g.vel.x * dt));
    g.ship.y = Math.max(-BOUNDS.y, Math.min(BOUNDS.y, g.ship.y + g.vel.y * dt));

    for (let i = 0; i < g.rocks.length; i++) {
      const r = g.rocks[i];
      const before = r.z;
      r.z += g.speed * dt;
      if (before < 0 && r.z >= 0) {
        // The rock crosses the ship's plane right now: hit, close, or clear?
        const verdict = classify(g.ship, r);
        if (verdict === "hit") { crash(); return; }
        if (verdict === "near") { g.near += 1; pop(`Close call +${NEAR_MISS_POINTS}`); }
      }
      // Behind the camera: recycle it to the far end (object pooling).
      if (r.z > 8) g.rocks[i] = spawn(random.current, -FAR - random.current() * 20);
    }
    layerRef.current?.setAttribute("data-ship", `${g.ship.x.toFixed(2)},${g.ship.y.toFixed(2)}`);
  }, [crash, pop, tilt.target]);

  // The HUD reads the live game every frame, without React renders.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const g = live.current;
      if (scoreRef.current) scoreRef.current.textContent = String(scoreOf(g));
      if (speedRef.current) speedRef.current.textContent = String(Math.round(g.speed * 3.6));
      if (energyRef.current) energyRef.current.style.transform = `scaleX(${g.energy})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const start = () => {
    const seed = Math.floor(Math.random() * 1e9);
    random.current = rng(seed);
    live.current = { ...fresh(seed), running: true };
    setScreen("playing");
    requestAnimationFrame(() => layerRef.current?.focus({ preventScroll: true }));
    pop("Go!");
  };

  // Boost: Space or Shift, held.
  const isBoostKey = (e: React.KeyboardEvent) => e.key === " " || e.key === "Shift";
  const onKeyDown = (e: React.KeyboardEvent) => { if (isBoostKey(e)) { e.preventDefault(); boostKeys.current.add(e.key); } };
  const onKeyUp = (e: React.KeyboardEvent) => { if (isBoostKey(e)) boostKeys.current.delete(e.key); };

  useGSAP(() => {
    const panel = root.current!.querySelector(".panel");
    if (!panel) return;
    const tl = gsap.timeline();
    tl.from(panel, { autoAlpha: 0, scale: reduced ? 1 : 0.92, y: reduced ? 0 : 24, duration: reduced ? 0.25 : 0.45, ease: "back.out(1.6)" });
    const title = panel.querySelector(".panel-title");
    if (title && !reduced) tl.from(SplitText.create(title, { type: "chars", aria: "auto" }).chars, { yPercent: 110, autoAlpha: 0, stagger: 0.03, duration: 0.45, ease: "power3.out" }, 0.1);
  }, { scope: root, dependencies: [screen], revertOnUpdate: true });

  const useDeviceTilt = async () => {
    if (!(await tilt.enableDevice())) alert("Tilt isn't available: the browser didn't allow motion sensors.");
  };

  const overlay = (
    <div className="pointer-events-none absolute inset-0 text-white">
      {screen === "playing" && (
        <div
          ref={layerRef}
          className="pointer-events-auto absolute inset-0 cursor-grab touch-none select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white active:cursor-grabbing"
          tabIndex={0}
          role="application"
          aria-label="Steer with the arrow keys or WASD, or drag; hold Space or Shift to boost"
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onBlur={() => boostKeys.current.clear()}
        />
      )}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 bg-linear-to-b from-black/50 to-transparent px-4 pt-3 pb-6 text-sm">
        <span className="tabular-nums"><span ref={speedRef}>0</span> km/h</span>
        <span className="text-3xl font-black tabular-nums drop-shadow"><span ref={scoreRef}>0</span></span>
        <span className="flex w-24 flex-col items-end gap-1 text-xs text-white/80">
          Boost
          <span className="block h-1.5 w-full overflow-hidden rounded-full bg-white/20" aria-hidden="true">
            <span ref={energyRef} className="block h-full origin-left bg-[#3ee0c5]" />
          </span>
        </span>
      </div>
      <span className="pop invisible absolute top-[24%] left-1/2 -translate-x-1/2 text-xl font-bold whitespace-nowrap drop-shadow" aria-hidden="true" />
      {screen === "playing" && (
        <button
          type="button"
          className="pointer-events-auto absolute right-4 bottom-4 size-16 touch-none rounded-full border-2 border-white/60 bg-white/10 text-sm font-bold text-white select-none active:bg-white/30"
          onPointerDown={() => { boostButton.current = true; }}
          onPointerUp={() => { boostButton.current = false; }}
          onPointerLeave={() => { boostButton.current = false; }}
          onPointerCancel={() => { boostButton.current = false; }}
        >
          Boost
        </button>
      )}
      {screen !== "playing" && (
        <div className="pointer-events-auto absolute inset-0 flex overflow-y-auto bg-black/35 p-4">
          <div className="panel m-auto w-full max-w-xs rounded-2xl border border-white/15 bg-[#17161f]/95 p-6 text-center shadow-2xl">
            <h3 className="panel-title mt-0 mb-2 overflow-hidden text-3xl font-bold">{screen === "intro" ? "Starfield Runner" : `Score ${final.score}`}</h3>
            <p className="text-sm text-white/80">
              {screen === "intro"
                ? "Dodge the asteroids. It keeps getting faster. Boost for double points, and fly close for bonuses."
                : final.newBest ? "A new best!" : `Best: ${final.best}`}
            </p>
            <Button className="mt-2" onClick={start}>{screen === "intro" ? "Launch" : "Fly again"}</Button>
            {screen === "over" && <Leaderboard game="runner" value={final.score} />}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div ref={root}>
      <ThreeCanvas camera={{ position: [0, 1.5, 6.5], fov: 68, near: 0.1, far: FAR * 1.5 }} className="h-[480px] sm:h-[560px]" label="Starfield Runner: a small ship flying through an asteroid field" overlay={overlay}>
        {() => <RunnerScene live={live} step={step} />}
      </ThreeCanvas>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {canTilt && (tilt.deviceOn
          ? <><Button variant="ghost" onClick={tilt.recalibrate}>Recalibrate</Button><Button variant="ghost" onClick={tilt.disableDevice}>Stop using tilt</Button></>
          : <Button onClick={useDeviceTilt}>Steer by tilting your phone</Button>)}
        <span className="text-sm text-muted">Keyboard: arrow keys or WASD to steer, hold Space or Shift to boost. Touch: drag to steer, hold Boost.</span>
      </div>
      {reduced && <p className="text-sm text-muted">Reduced motion: no screen shake and plain score pops; the flight itself still moves, since that&apos;s the game.</p>}
    </div>
  );
}
