"use client";

import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { useRef, useState, type KeyboardEvent } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { gsap, useGSAP } from "@/lib/gsap";
import { Button, Stage } from "@/components/ui";

// Registered here rather than in lib/gsap.ts, so only the pages that use
// them carry their code. Registering twice is harmless.
gsap.registerPlugin(Draggable, InertiaPlugin);

const GRID = 60;
const CARD = 60;
const SLIDES = ["Throw", "Snap", "Glide", "Settle", "Repeat"];
const KNOB_MIN = -135;
const KNOB_MAX = 135;

// Three ways to drag: free movement with a throw, a carousel that snaps to
// slides, and a dial that spins. InertiaPlugin turns the release velocity into
// a glide that ends exactly on a snap point. With reduced motion the glide is
// off: things stop where they're dropped, then snap instantly.
export function DragDemos() {
  const { reduced } = useMotion();
  const root = useRef<HTMLDivElement>(null);
  const speed = useRef<HTMLSpanElement>(null);
  const carousel = useRef<Draggable | null>(null);
  const knob = useRef<Draggable | null>(null);
  const [slide, setSlide] = useState(0);
  const [level, setLevel] = useState(50);

  useGSAP(() => {
    const el = root.current!;

    // 1. Throw: free dragging inside the box, with a glide on release that
    // lands on a 60 px grid. edgeResistance makes the walls feel springy.
    // The snap rounds to the grid but stays inside the box, so a throw at a
    // wall still ends on a grid point.
    const box = el.querySelector<HTMLElement>(".throw-stage")!;
    const toGrid = (v: number, size: number) => gsap.utils.clamp(0, Math.floor((size - CARD) / GRID) * GRID, Math.round(v / GRID) * GRID);
    const snapX = (v: number) => toGrid(v, box.clientWidth);
    const snapY = (v: number) => toGrid(v, box.clientHeight);
    const cards = Draggable.create(".throw-card", {
      bounds: box,
      inertia: !reduced,
      edgeResistance: 0.65,
      snap: { x: snapX, y: snapY },
      onDrag() {
        // Written straight to the DOM: no React render on every pointer move.
        const vx = InertiaPlugin.getVelocity(this.target, "x");
        const vy = InertiaPlugin.getVelocity(this.target, "y");
        speed.current!.textContent = `${Math.round(Math.hypot(vx, vy))} px/s`;
      },
      // snap only runs on a throw, so without inertia snap on release here.
      onDragEnd() {
        if (!reduced) return;
        gsap.set(this.target, { x: snapX(this.x), y: snapY(this.y) });
        this.update();
      },
    });

    // 2. Carousel: horizontal only, bounded to the track, snapping to whole
    // slides. snap on a single axis gets the projected end position.
    const track = el.querySelector<HTMLElement>(".slide-track")!;
    const width = () => track.offsetWidth / SLIDES.length;
    [carousel.current] = Draggable.create(track, {
      type: "x",
      bounds: { minX: -width() * (SLIDES.length - 1), maxX: 0 },
      inertia: !reduced,
      snap: (x) => Math.round(x / width()) * width(),
      onThrowComplete() { setSlide(Math.round(-this.x / width())); },
      onDragEnd() {
        if (!reduced) return;
        const i = Math.round(-this.x / width());
        gsap.set(track, { x: -width() * i });
        this.update();
        setSlide(i);
      },
    });
    // Slide widths change with the window: re-measure the bounds and keep
    // the current slide in view.
    const onResize = () => {
      const c = carousel.current!;
      const oldWidth = (c.maxX - c.minX) / (SLIDES.length - 1);
      const current = Math.round(-Number(gsap.getProperty(track, "x")) / oldWidth);
      c.applyBounds({ minX: -width() * (SLIDES.length - 1), maxX: 0 });
      gsap.set(track, { x: -width() * current });
      c.update();
    };
    window.addEventListener("resize", onResize);

    // 3. Dial: type "rotation" spins around the element's centre. Bounds are
    // in degrees, and the glide stops at the limits.
    [knob.current] = Draggable.create(".knob", {
      type: "rotation",
      bounds: { minRotation: KNOB_MIN, maxRotation: KNOB_MAX },
      inertia: !reduced,
      onDrag() { setLevel(toLevel(this.rotation)); },
      onThrowUpdate() { setLevel(toLevel(this.rotation)); },
    });

    // Draggables aren't animations, so kill them explicitly on cleanup.
    return () => {
      window.removeEventListener("resize", onResize);
      [...cards, carousel.current, knob.current].forEach((d) => d?.kill());
    };
  }, { scope: root, dependencies: [reduced], revertOnUpdate: true });

  // Buttons and keys do the same things as dragging, for keyboards and
  // switch devices. update() tells Draggable the element moved under it.
  // contextSafe is applied when the event happens (not during render), so
  // the tweens are still cleaned up with the component.
  const { contextSafe } = useGSAP({ scope: root });
  const goTo = (i: number) => contextSafe(() => {
    const track = root.current!.querySelector<HTMLElement>(".slide-track")!;
    const next = gsap.utils.clamp(0, SLIDES.length - 1, i);
    setSlide(next);
    gsap.to(track, { x: (-track.offsetWidth / SLIDES.length) * next, duration: reduced ? 0 : 0.5, ease: "power3.out", onUpdate: () => carousel.current?.update() });
  })();
  const turn = (e: KeyboardEvent) => contextSafe(() => {
    const step = { ArrowUp: 10, ArrowRight: 10, ArrowDown: -10, ArrowLeft: -10, Home: -100, End: 100 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    const next = gsap.utils.clamp(0, 100, level + step);
    setLevel(next);
    gsap.to(".knob", { rotation: KNOB_MIN + (next / 100) * (KNOB_MAX - KNOB_MIN), duration: reduced ? 0 : 0.25, onUpdate: () => knob.current?.update() });
  })();

  return (
    <div ref={root}>
      <h3>1. Throw it: inertia and grid snapping</h3>
      <Stage className="throw-stage h-70 bg-[radial-gradient(var(--line)_1.5px,transparent_1.5px)] bg-size-[60px_60px]">
        {["A", "B", "C"].map((c, i) => (
          <div key={c} className="throw-card absolute top-0 left-0 grid size-15 cursor-grab touch-none place-items-center rounded-xl bg-linear-135 from-accent to-pink text-xl font-bold text-white shadow-lg select-none active:cursor-grabbing" style={{ transform: `translate(${i * 120}px, ${i * 60}px)` }}>{c}</div>
        ))}
      </Stage>
      <p className="text-sm text-muted">Drag a card and let go mid-move. Release speed: <span ref={speed} className="tabular-nums">0 px/s</span>. {reduced ? "Reduced motion: no glide; cards snap where you drop them." : "The glide always ends on a grid point."}</p>

      <h3>2. A carousel that snaps to slides</h3>
      <Stage className="h-45">
        {/* Absolutely positioned: a 500%-wide track in normal flow would widen the page on phones. */}
        <div className="slide-track absolute inset-y-0 left-0 flex cursor-grab touch-pan-y select-none active:cursor-grabbing" style={{ width: `${SLIDES.length * 100}%` }}>
          {SLIDES.map((s, i) => (
            <div key={s} className="flex flex-1 items-center justify-center p-3" aria-hidden={i !== slide}>
              <div className="flex size-full flex-col justify-between rounded-xl bg-linear-135 from-accent to-pink p-4 text-white"><span className="text-sm text-white/75">{i + 1} / {SLIDES.length}</span><strong className="text-[1.6rem]">{s}</strong></div>
            </div>
          ))}
        </div>
      </Stage>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={() => goTo(slide - 1)} disabled={slide === 0} aria-label="Previous slide">←</Button>
        <Button variant="ghost" onClick={() => goTo(slide + 1)} disabled={slide === SLIDES.length - 1} aria-label="Next slide">→</Button>
        <span className="text-sm text-muted" aria-live="polite">Slide {slide + 1} of {SLIDES.length}: drag sideways or use the buttons.</span>
      </div>

      <h3>3. A dial: type &quot;rotation&quot; with limits</h3>
      <div className="flex flex-wrap items-center gap-6">
        <div
          className="knob relative size-32 cursor-grab touch-none rounded-full border-4 border-line bg-surface shadow-inner focus-visible:outline-2 focus-visible:outline-accent active:cursor-grabbing"
          style={{ transform: "rotate(0deg)" }}
          role="slider" tabIndex={0} aria-label="Level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={level}
          onKeyDown={turn}
        >
          <span className="absolute top-2 left-1/2 h-6 w-1.5 -translate-x-1/2 rounded-full bg-accent" />
        </div>
        <div>
          <div className="text-4xl font-bold tabular-nums">{level}</div>
          <p className="m-0 text-sm text-muted">Spin it with a flick, or focus it and use the arrow keys.</p>
        </div>
      </div>
    </div>
  );
}

const toLevel = (rotation: number) => Math.round(((rotation - KNOB_MIN) / (KNOB_MAX - KNOB_MIN)) * 100);
