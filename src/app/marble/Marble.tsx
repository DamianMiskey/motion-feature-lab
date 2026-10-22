"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { lazy, Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { ThreeCanvas } from "@/components/three/ThreeCanvas";
import { Leaderboard } from "@/components/Leaderboard";
import { Button } from "@/components/ui";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { RiveStars, warmRive } from "../game/RiveBits";
import { LEVELS, stars } from "./levels";
import { useTilt } from "./tilt";

// The physics world (and Rapier's ~800 KB engine) loads as its own chunk.
const MarbleWorld = lazy(() => import("./MarbleWorld").then((m) => ({ default: m.MarbleWorld })));

type Screen = "intro" | "countdown" | "playing" | "won" | "finished";
type Result = { seconds: number; stars: number; best: boolean; falls: number };

const BEST_KEY = "motion-lab:marble-best";
// localStorage can throw (private windows, blocked storage): then best times
// simply aren't remembered.
const readBest = (): Record<string, number> => { try { return JSON.parse(localStorage.getItem(BEST_KEY) ?? "{}"); } catch { return {}; } };
const writeBest = (best: Record<string, number>) => { try { localStorage.setItem(BEST_KEY, JSON.stringify(best)); } catch {} };
const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;

export function Marble() {
  const { reduced } = useMotion();
  const root = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(0);
  const screenRef = useRef<Screen>("intro");
  const fallsRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("intro");
  const [level, setLevel] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [falls, setFalls] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [total, setTotal] = useState(0);

  const current = LEVELS[level];
  const tilt = useTilt(layerRef, screen === "playing" || screen === "countdown");

  useEffect(() => { screenRef.current = screen; }, [screen]);
  // Phones and tablets get a "tilt the phone" button. (Read on the client
  // only: the server snapshot says no, so hydration matches.)
  const canTilt = useSyncExternalStore(
    () => () => {},
    () => typeof DeviceOrientationEvent !== "undefined" && matchMedia("(pointer: coarse)").matches,
    () => false,
  );

  // ---- Flow ---------------------------------------------------------------

  const start = (index: number, keepTotal: boolean) => {
    setLevel(index);
    setAttempt((a) => a + 1); // a fresh board and marble
    setFalls(0);
    fallsRef.current = 0;
    setResult(null);
    if (!keepTotal) setTotal(0);
    setScreen("countdown");
  };

  // 3, 2, 1, Go: the board is live (tiltable) but frozen until "Go".
  useGSAP(() => {
    if (screen !== "countdown") return;
    layerRef.current?.focus({ preventScroll: true });
    const el = root.current!.querySelector<HTMLElement>(".countdown");
    if (!el) return;
    // Clear the label at the end: when the screen changes, useGSAP reverts the
    // tweens, which would otherwise bring the last "Go" back into view.
    const tl = gsap.timeline({ onComplete: () => { el.textContent = ""; startedRef.current = performance.now(); setScreen("playing"); } });
    for (const n of reduced ? ["Go"] : ["3", "2", "1", "Go"]) {
      tl.call(() => { el.textContent = n; })
        .fromTo(el, { scale: reduced ? 1 : 1.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: reduced ? 0.15 : 0.3, ease: "back.out(2)" })
        .to(el, { autoAlpha: 0, duration: reduced ? 0.4 : 0.35, delay: reduced ? 0.4 : 0.25 });
    }
  }, { scope: root, dependencies: [screen, attempt], revertOnUpdate: true });

  const onGoal = useCallback(() => {
    if (screenRef.current !== "playing") return;
    const seconds = (performance.now() - startedRef.current) / 1000;
    const name = LEVELS[level].name;
    const best = readBest();
    const isBest = !best[name] || seconds < best[name];
    if (isBest) writeBest({ ...best, [name]: seconds });
    setResult({ seconds, stars: stars(seconds, LEVELS[level].par), best: isBest, falls: fallsRef.current });
    setTotal((t) => t + seconds);
    setScreen(level === LEVELS.length - 1 ? "finished" : "won");
  }, [level]);

  const onFall = useCallback(() => {
    fallsRef.current += 1;
    setFalls(fallsRef.current);
    const flash = root.current?.querySelector(".fall-flash");
    if (flash) gsap.fromTo(flash, { autoAlpha: 0.9 }, { autoAlpha: 0, duration: reduced ? 0.2 : 0.7, ease: "power2.out" });
  }, [reduced]);

  // The marble's position, for curious eyes and the end-to-end tests.
  const onPosition = useCallback((x: number, z: number) => {
    layerRef.current?.setAttribute("data-ball", `${x.toFixed(2)},${z.toFixed(2)}`);
  }, []);

  const markReady = useCallback(() => { setReady(true); warmRive(); }, []);

  // ---- HUD: the clock and the tilt indicator update without React renders --

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (timeRef.current && screenRef.current === "playing") timeRef.current.textContent = fmt((performance.now() - startedRef.current) / 1000);
      if (dotRef.current) dotRef.current.style.transform = `translate(${tilt.target.current.x * 14}px, ${-tilt.target.current.y * 14}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [tilt.target]);
  useEffect(() => { if (screen === "countdown" && timeRef.current) timeRef.current.textContent = fmt(0); }, [screen]);

  // Menu panels pop in; the title splits into letters.
  useGSAP(() => {
    const panel = root.current!.querySelector(".panel");
    if (!panel) return;
    const tl = gsap.timeline();
    tl.from(panel, { autoAlpha: 0, scale: reduced ? 1 : 0.92, y: reduced ? 0 : 24, duration: reduced ? 0.25 : 0.5, ease: "back.out(1.6)" });
    const title = panel.querySelector(".panel-title");
    if (title && !reduced) {
      const split = SplitText.create(title, { type: "chars", aria: "auto" });
      tl.from(split.chars, { yPercent: 110, autoAlpha: 0, stagger: 0.03, duration: 0.5, ease: "power3.out" }, 0.1);
    }
  }, { scope: root, dependencies: [screen, ready], revertOnUpdate: true });

  const useDeviceTilt = async () => {
    const ok = await tilt.enableDevice();
    if (!ok) alert("Tilt isn't available: the browser didn't allow motion sensors.");
  };

  const playing = screen === "playing" || screen === "countdown";

  const overlay = (
    <div className="pointer-events-none absolute inset-0 text-white">
      {playing && (
        <div
          ref={layerRef}
          className="pointer-events-auto absolute inset-0 cursor-grab touch-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent active:cursor-grabbing"
          tabIndex={0}
          role="application"
          aria-label="Tilt the board with the arrow keys or WASD, or drag on it"
        />
      )}
      <div className="absolute inset-x-0 top-0 flex flex-wrap items-center justify-between gap-2 bg-linear-to-b from-black/60 to-transparent px-4 pt-3 pb-6 text-sm">
        <span><strong>{current.name}</strong> · level {level + 1}/{LEVELS.length}</span>
        <span className="tabular-nums">Time <strong ref={timeRef}>0:00.0</strong> · Falls <strong>{falls}</strong></span>
        <span className="relative inline-block size-9 rounded-full border border-white/50" role="img" aria-label="Board tilt">
          <span ref={dotRef} className="absolute top-1/2 left-1/2 -mt-1.5 -ml-1.5 size-3 rounded-full bg-white" />
        </span>
      </div>
      <span className="countdown absolute top-1/2 left-1/2 -translate-1/2 text-7xl font-black drop-shadow-lg" aria-live="assertive" />
      <div className="fall-flash invisible absolute inset-0 grid place-items-center bg-black/40 text-3xl font-bold">Whoops! Back to the start</div>

      {!ready && (
        <div className="absolute inset-0 grid place-items-center bg-black/70" role="status"><p className="m-0 text-sm text-white/80">Loading the physics engine…</p></div>
      )}

      {ready && !playing && (
        <div className="pointer-events-auto absolute inset-0 flex overflow-y-auto bg-black/35 p-4">
          <div className="panel m-auto w-full max-w-sm rounded-2xl border border-white/15 bg-[#17161f]/95 p-6 text-center shadow-2xl">
            {screen === "intro" && (
              <>
                <h3 className="panel-title mt-0 mb-2 overflow-hidden text-3xl font-bold">Marble Maze</h3>
                <p className="text-sm text-white/80">Tilt the board to roll the marble to the glowing ring. Avoid the holes.</p>
                <p className="text-sm text-white/60">Arrow keys or WASD, drag on the board, or tilt your phone.</p>
                <Button className="mt-2" onClick={() => start(0, false)}>Play</Button>
              </>
            )}
            {(screen === "won" || screen === "finished") && result && (
              <>
                <h3 className="panel-title mt-0 mb-1 overflow-hidden text-2xl font-bold">{screen === "finished" ? "All mazes done" : "Made it!"}</h3>
                <RiveStars value={result.stars} label={`${result.stars} out of 5 stars`} />
                <p className="my-1 text-sm text-white/80">
                  {fmt(result.seconds)} (par {fmt(current.par)}) · {result.falls} fall{result.falls === 1 ? "" : "s"}{result.best && " · new best!"}
                </p>
                {screen === "finished" && <p className="my-1 font-semibold">Total {fmt(total)}</p>}
                <div className="mt-3 flex justify-center gap-2">
                  {screen === "won" ? (
                    <>
                      <Button variant="ghost" className="text-white" onClick={() => { setTotal((t) => t - result.seconds); start(level, true); }}>Retry</Button>
                      <Button onClick={() => start(level + 1, true)}>Next maze</Button>
                    </>
                  ) : (
                    <Button onClick={() => start(0, false)}>Play again</Button>
                  )}
                </div>
                {screen === "finished" && <Leaderboard game="marble" value={Math.round(total * 1000)} format={(ms) => fmt(ms / 1000)} />}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    // data-state lets tests wait for the countdown to finish, however slowly
    // the machine renders, instead of guessing how long it takes.
    <div ref={root} data-state={screen}>
      <ThreeCanvas fullscreen shadows camera={{ position: [0, 12, 7], fov: 45 }} className="h-[440px] sm:h-[540px]" label={`Marble Maze, level ${level + 1}: ${current.name}. A wooden maze seen from above, with a steel marble`} overlay={overlay}>
        {(animate) => (
          <>
            <color attach="background" args={["#14121c"]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[4, 10, 6]} intensity={2} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} />
            {/* Reflections for the steel marble, from Lightformer panels: no HDR download. */}
            <Environment resolution={128}>
              <Lightformer form="rect" intensity={3} position={[0, 5, -4]} scale={[10, 3, 1]} />
              <Lightformer form="rect" intensity={1.5} position={[-5, 2, 0]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} color="#a89dff" />
              <Lightformer form="ring" intensity={2} position={[3, 6, 3]} scale={2} />
            </Environment>
            <Suspense fallback={null}>
              <MarbleWorld key={`${level}-${attempt}`} level={current} target={tilt.target} running={screen === "playing"} animate={animate}
                onFall={onFall} onGoal={onGoal} onPosition={onPosition} onReady={markReady} />
            </Suspense>
          </>
        )}
      </ThreeCanvas>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {canTilt && (tilt.deviceOn
          ? <><Button variant="ghost" onClick={tilt.recalibrate}>Recalibrate level</Button><Button variant="ghost" onClick={tilt.disableDevice}>Stop using tilt</Button></>
          : <Button onClick={useDeviceTilt}>Tilt your phone to play</Button>)}
        <span className="text-sm text-muted">Keyboard: Tab into the board, then arrow keys or WASD. Mouse or touch: drag on the board like a joystick.</span>
      </div>
      {reduced && <p className="text-sm text-muted">Reduced motion: menus fade instead of moving and the countdown is short; the marble itself still rolls, since that&apos;s the game.</p>}
    </div>
  );
}
