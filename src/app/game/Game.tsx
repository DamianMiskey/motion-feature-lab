"use client";

import { useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { ThreeCanvas } from "@/components/three/ThreeCanvas";
import { Button, cx } from "@/components/ui";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import type { Aim, Ball } from "./GameWorld";
import { LEVELS, levelScore, POINTS_PER_BLOCK, stars } from "./levels";
import { RiveStars, warmRive } from "./RiveBits";

// The physics world (and Rapier's ~800 KB engine) is its own chunk, so the
// game shell and its loader appear first while it downloads.
const GameWorld = lazy(() => import("./GameWorld").then((m) => ({ default: m.GameWorld })));

type Screen = "intro" | "playing" | "result" | "finished";
type Pop = { id: number; x: number; y: number; text: string };
type Result = { fallen: number; total: number; stars: number; score: number; best: boolean };

const SETTLE_MS = 3500;
const BEST_KEY = "motion-lab:toppler-best";

// localStorage can throw (private windows, blocked storage): then the best
// score simply isn't remembered.
const readBest = () => { try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; } };
const writeBest = (n: number) => { try { localStorage.setItem(BEST_KEY, String(n)); } catch {} };

// The camera follows a plain object that GSAP tweens: a swoop in at the start
// of each level, with no React re-render per frame.
type Rig = { x: number; y: number; z: number };
// On narrow (portrait) screens the field of view widens so the whole
// platform still fits across.
const MIN_HFOV = 2 * Math.atan(Math.tan((45 * Math.PI) / 360) * 1.3);
function CameraRig({ rigRef }: { rigRef: RefObject<Rig> }) {
  useFrame(({ camera, size }) => {
    camera.position.set(rigRef.current.x, rigRef.current.y, rigRef.current.z);
    camera.lookAt(0, 1.3, 0);
    if (!(camera instanceof PerspectiveCamera)) return;
    const fov = Math.max(45, (2 * Math.atan(Math.tan(MIN_HFOV / 2) / (size.width / size.height)) * 180) / Math.PI);
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
  });
  return null;
}

// A "+100" that floats up from where a block fell, then removes itself.
function ScorePop({ pop, onDone }: { pop: Pop; onDone: (id: number) => void }) {
  const el = useRef<HTMLSpanElement>(null);
  const { reduced } = useMotion();
  useGSAP(() => {
    gsap.fromTo(el.current, { y: 0, scale: 0.6, autoAlpha: 1 }, {
      y: reduced ? 0 : -60, scale: 1, autoAlpha: 0, duration: 1.1, ease: "power2.out", onComplete: () => onDone(pop.id),
    });
  });
  return (
    <span ref={el} className="pointer-events-none absolute -translate-1/2 font-bold text-white drop-shadow" style={{ left: `${pop.x * 100}%`, top: `${pop.y * 100}%` }}>
      {pop.text}
    </span>
  );
}

// A loader that costs nothing extra: GSAP is already on the page.
function Loader() {
  const { reduced } = useMotion();
  const el = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (reduced) return;
    gsap.to(".loader-block", { y: -18, duration: 0.35, ease: "power2.out", stagger: { each: 0.12, repeat: -1, yoyo: true } });
  }, { scope: el, dependencies: [reduced] });
  return (
    <div ref={el} className="absolute inset-0 grid place-items-center bg-black/70" role="status">
      <div className="text-center">
        <div className="mb-3 flex justify-center gap-2" aria-hidden="true">
          {["bg-accent", "bg-pink", "bg-[#3ee0c5]"].map((c) => <span key={c} className={`loader-block size-5 rounded ${c}`} />)}
        </div>
        <p className="m-0 text-sm text-white/80">Loading the physics engine…</p>
      </div>
    </div>
  );
}

export function Game() {
  const { reduced } = useMotion();
  const root = useRef<HTMLDivElement>(null);
  const aimRef = useRef<Aim | null>(null);
  const rigRef = useRef<Rig>({ x: 0, y: 3.2, z: 10 });
  const reticleRef = useRef({ x: 0, y: 0.05 });
  const reticleElRef = useRef<HTMLDivElement>(null);
  const countedRef = useRef(new Set<string>());
  const settleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scoreElRef = useRef<HTMLSpanElement>(null);
  const shownRef = useRef({ score: 0 });
  const nextBallRef = useRef(0);
  const nextPopRef = useRef(0);

  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("intro");
  const [level, setLevel] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [ballsLeft, setBallsLeft] = useState(LEVELS[0].balls);
  const [fallen, setFallen] = useState(0);
  const [banked, setBanked] = useState(0); // score from finished levels
  const [pops, setPops] = useState<Pop[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  const current = LEVELS[level];
  // While playing, blocks down so far count live; once a round is scored
  // they're part of `banked`.
  const liveScore = screen === "playing" ? banked + fallen * POINTS_PER_BLOCK : banked;

  // Timers and physics callbacks need the latest values without being
  // re-created on every throw, so they read these mirrors.
  const ballsLeftRef = useRef(ballsLeft);
  const levelRef = useRef(level);
  useEffect(() => { ballsLeftRef.current = ballsLeft; levelRef.current = level; }, [ballsLeft, level]);

  const clearSettle = useCallback(() => { if (settleRef.current) clearTimeout(settleRef.current); settleRef.current = null; }, []);
  useEffect(() => clearSettle, [clearSettle]);

  // ---- Game flow -----------------------------------------------------------

  const startLevel = (index: number, keepScore: boolean) => {
    clearSettle();
    countedRef.current = new Set();
    setLevel(index);
    setAttempt((a) => a + 1); // remounts the physics world: a fresh tower
    setBalls([]);
    setBallsLeft(LEVELS[index].balls);
    setFallen(0);
    setResult(null);
    if (!keepScore) setBanked(0);
    setScreen("playing");
    // Swoop the camera in from the side (or just place it, with reduced motion).
    gsap.killTweensOf(rigRef.current);
    if (reduced) Object.assign(rigRef.current, { x: 0, y: 3.2, z: 10 });
    else gsap.fromTo(rigRef.current, { x: -9, y: 6, z: 6 }, { x: 0, y: 3.2, z: 10, duration: 1.6, ease: "power3.inOut" });
  };

  const finish = useCallback(() => {
    clearSettle();
    const total = current.blocks.length;
    const n = countedRef.current.size;
    const score = levelScore(n, total, n === total ? ballsLeftRef.current : 0);
    const totalScore = banked + score;
    const best = totalScore > readBest() && level === LEVELS.length - 1;
    if (best) writeBest(totalScore);
    setBanked(totalScore);
    setResult({ fallen: n, total, stars: stars(n, total), score, best });
    setScreen(level === LEVELS.length - 1 ? "finished" : "result");
  }, [banked, clearSettle, current, level]);
  const finishRef = useRef(finish);
  useEffect(() => { finishRef.current = finish; }, [finish]);
  // Once the physics is in, fetch Rive's runtime in the background, so the
  // stars are ready by the end of the first round. (Rive's WebAssembly is as
  // big as Rapier's, which is why a Rive loading animation wouldn't help.)
  const markReady = useCallback(() => { setReady(true); warmRive(); }, []);


  // After the last ball (or a fall once balls are gone), wait for things to
  // settle before scoring the round.
  const armSettle = useCallback((ms = SETTLE_MS) => {
    clearSettle();
    settleRef.current = setTimeout(() => finishRef.current(), ms);
  }, [clearSettle]);

  const onFall = useCallback((id: string, at: { x: number; y: number }) => {
    if (countedRef.current.has(id)) return;
    countedRef.current.add(id);
    setFallen(countedRef.current.size);
    setPops((p) => [...p, { id: nextPopRef.current++, x: at.x, y: Math.min(at.y, 0.9), text: `+${POINTS_PER_BLOCK}` }]);
    if (countedRef.current.size === LEVELS[levelRef.current].blocks.length) armSettle(1200);
    else if (ballsLeftRef.current === 0) armSettle();
  }, [armSettle]);

  const throwBall = () => {
    if (screen !== "playing" || ballsLeft === 0 || !aimRef.current) return;
    const shot = aimRef.current(reticleRef.current);
    setBalls((b) => [...b, { id: nextBallRef.current++, ...shot }]);
    setBallsLeft((n) => n - 1);
    if (ballsLeft === 1) armSettle();
  };

  // ---- Aiming: pointer or keyboard ------------------------------------------

  const placeReticle = () => {
    const { x, y } = reticleRef.current;
    if (!reticleElRef.current) return; // only rendered while playing
    gsap.set(reticleElRef.current, { left: `${((x + 1) / 2) * 100}%`, top: `${((1 - y) / 2) * 100}%` });
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    reticleRef.current = { x: ((e.clientX - box.left) / box.width) * 2 - 1, y: -((e.clientY - box.top) / box.height) * 2 + 1 };
    placeReticle();
  };
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => { onPointerMove(e); throwBall(); };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = 0.04;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      reticleRef.current = { x: gsap.utils.clamp(-1, 1, reticleRef.current.x + dx), y: gsap.utils.clamp(-1, 1, reticleRef.current.y + dy) };
      placeReticle();
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      throwBall();
    }
  };
  // When a level starts, keyboard focus moves onto the aiming layer (it only
  // exists once the "playing" screen has rendered), so Space throws at once.
  useEffect(() => {
    placeReticle();
    if (screen === "playing") root.current?.querySelector<HTMLElement>(".aim-layer")?.focus({ preventScroll: true });
  }, [screen, attempt]);

  // ---- GSAP: screens, score, ball counter ----------------------------------

  // Each menu panel animates in when its screen appears; the title splits
  // into characters that rise one after another.
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
    tl.from(panel.querySelectorAll(".panel-item"), { autoAlpha: 0, y: reduced ? 0 : 12, stagger: 0.08, duration: 0.35 }, reduced ? 0 : 0.35);
  }, { scope: root, dependencies: [screen, ready], revertOnUpdate: true });

  // The score counts up instead of jumping.
  useGSAP(() => {
    gsap.to(shownRef.current, {
      score: liveScore, duration: reduced ? 0 : 0.6, ease: "power2.out", overwrite: true,
      onUpdate: () => { if (scoreElRef.current) scoreElRef.current.textContent = Math.round(shownRef.current.score).toLocaleString("en"); },
    });
  }, { dependencies: [liveScore, reduced] });

  // The ball just thrown pops out of the counter.
  useGSAP(() => {
    if (reduced) return;
    const icon = root.current!.querySelector(`.ball-icon[data-i="${ballsLeft}"]`);
    if (icon) gsap.fromTo(icon, { scale: 1.8 }, { scale: 1, duration: 0.45, ease: "back.out(3)" });
  }, { scope: root, dependencies: [ballsLeft] });

  // ---- Render ----------------------------------------------------------------

  const overlay = (
    <div className="pointer-events-none absolute inset-0 text-white">
      {/* Aiming surface: covers the canvas while playing. */}
      {screen === "playing" && (
        <div
          className="aim-layer pointer-events-auto absolute inset-0 cursor-crosshair touch-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          tabIndex={0}
          role="application"
          aria-label="Aim with the arrow keys or pointer; Space or click throws a ball"
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
        />
      )}
      {screen === "playing" && (
        <div ref={reticleElRef} className="absolute size-7 -translate-1/2 rounded-full border-2 border-white/80 shadow" aria-hidden="true">
          <span className="absolute top-1/2 left-1/2 size-1.5 -translate-1/2 rounded-full bg-white" />
        </div>
      )}

      {/* HUD */}
      <div className="absolute inset-x-0 top-0 flex flex-wrap items-center justify-between gap-2 bg-linear-to-b from-black/60 to-transparent px-4 pt-3 pb-6 text-sm">
        <span><strong>{current.name}</strong> · level {level + 1}/{LEVELS.length}</span>
        <span className="flex items-center gap-1" role="img" aria-label={`${ballsLeft} balls left`}>
          {Array.from({ length: current.balls }, (_, i) => (
            <span key={`${attempt}-${i}`} data-i={i} className={cx("ball-icon inline-block size-3.5 rounded-full", i < ballsLeft ? "bg-white" : "bg-white/20")} />
          ))}
        </span>
        <span>Score <strong ref={scoreElRef} className="tabular-nums">0</strong></span>
      </div>
      <span className="sr-only" aria-live="polite">{screen === "playing" ? `${fallen} of ${current.blocks.length} blocks down, ${ballsLeft} balls left` : ""}</span>

      {pops.map((p) => <ScorePop key={p.id} pop={p} onDone={(id) => setPops((all) => all.filter((x) => x.id !== id))} />)}

      {/* Loading: three bouncing blocks while Rapier's engine downloads. */}
      {!ready && <Loader />}

      {ready && screen !== "playing" && (
        <div className="pointer-events-auto absolute inset-0 grid place-items-center bg-black/35 p-4">
          <div className="panel w-full max-w-sm rounded-2xl border border-white/15 bg-[#17161f]/95 p-6 text-center shadow-2xl">
            {screen === "intro" && (
              <>
                <h3 className="panel-title mt-0 mb-2 overflow-hidden text-3xl font-bold">Tower Toppler</h3>
                <p className="panel-item text-sm text-white/80">Knock every block off the platform. Click to throw, or use the arrow keys and Space.</p>
                <p className="panel-item text-sm text-white/60">Best total: {readBest().toLocaleString("en")}</p>
                <Button className="panel-item mt-2" onClick={() => startLevel(0, false)}>Play</Button>
              </>
            )}
            {(screen === "result" || screen === "finished") && result && (
              <>
                <h3 className="panel-title mt-0 mb-1 overflow-hidden text-2xl font-bold">{screen === "finished" ? "All levels done" : result.fallen === result.total ? "Cleared!" : "Round over"}</h3>
                <RiveStars value={result.stars} label={`${result.stars} out of 5 stars`} />
                <p className="panel-item my-1 text-sm text-white/80">{result.fallen} of {result.total} blocks down · +{result.score.toLocaleString("en")}</p>
                {screen === "finished" && <p className="panel-item my-1 font-semibold">Total {banked.toLocaleString("en")}{result.best && " · new best!"}</p>}
                <div className="panel-item mt-3 flex justify-center gap-2">
                  {screen === "result" ? (
                    <>
                      <Button variant="ghost" className="text-white" onClick={() => { setBanked((b) => b - result.score); startLevel(level, true); }}>Retry</Button>
                      <Button onClick={() => startLevel(level + 1, true)}>Next level</Button>
                    </>
                  ) : (
                    <Button onClick={() => startLevel(0, false)}>Play again</Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div ref={root}>
      <ThreeCanvas shadows camera={{ position: [0, 3.2, 10], fov: 45 }} className="h-[420px] sm:h-[520px]" label="Tower Toppler: a 3D game where you throw balls to knock blocks off a floating platform" overlay={overlay}>
        {() => (
          <>
            <color attach="background" args={["#0d0c14"]} />
            <fog attach="fog" args={["#0d0c14", 14, 28]} />
            <ambientLight intensity={0.45} />
            <directionalLight position={[4, 9, 6]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={6} shadow-camera-bottom={-3} />
            <CameraRig rigRef={rigRef} />
            <Suspense fallback={null}>
              <GameWorld key={attempt} blocks={current.blocks} balls={balls} paused={false} aimRef={aimRef} onFall={onFall} onReady={markReady} />
            </Suspense>
          </>
        )}
      </ThreeCanvas>
      <p className="text-sm text-muted">
        Click or tap to throw at the crosshair. Keyboard: Tab into the game, aim with the arrow keys, throw with Space.
        {reduced && " Reduced motion: menus fade instead of moving and the camera doesn't swoop; the physics itself still runs, since that's the game."}
      </p>
    </div>
  );
}
