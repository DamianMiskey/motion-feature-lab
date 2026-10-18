"use client";

import { Observer } from "gsap/Observer";
import { useRef, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { gsap, useGSAP } from "@/lib/gsap";
import { Button, Stage } from "@/components/ui";

gsap.registerPlugin(Observer);

const SLIDES = [
  { title: "Wheel", text: "Scroll over the gallery to move one slide at a time.", from: "#5b4bdb", to: "#e0577a" },
  { title: "Swipe", text: "Drag or swipe sideways, with a mouse, a finger or a pen.", from: "#1f8a70", to: "#4fb0c6" },
  { title: "Keys", text: "Focus the gallery and use the arrow keys.", from: "#c2410c", to: "#eab308" },
  { title: "Intent", text: "Observer reports a direction, not a distance: one gesture, one slide.", from: "#7c3aed", to: "#db2777" },
  { title: "Release", text: "At either end, the wheel scrolls the page again.", from: "#0f766e", to: "#65a30d" },
];

// One gesture → one slide, whatever the input. Observer listens to wheel,
// touch and pointer events and boils them down to onUp / onDown / onLeft /
// onRight. While a transition runs, further gestures are ignored, so a long
// trackpad swipe doesn't skip three slides.
export function ObserverGallery() {
  const { reduced } = useMotion();
  const stage = useRef<HTMLDivElement>(null);
  const index = useRef(0);
  const busy = useRef(false);
  const [current, setCurrent] = useState(0);
  const [last, setLast] = useState("nothing yet");

  const { contextSafe } = useGSAP({ scope: stage });

  // contextSafe is applied when a gesture happens (not during render), so
  // the transition tweens are still cleaned up with the component.
  const show = (next: number, direction: 1 | -1) => contextSafe(() => {
    if (busy.current || next < 0 || next >= SLIDES.length || next === index.current) return;
    busy.current = true;
    const slides = gsap.utils.toArray<HTMLElement>(".gallery-slide", stage.current);
    const [from, to] = [slides[index.current], slides[next]];
    index.current = next;
    setCurrent(next);
    const done = () => { busy.current = false; };

    if (reduced) {
      // A crossfade: no movement across the screen.
      gsap.timeline({ onComplete: done })
        .set(to, { zIndex: 2, autoAlpha: 0, clipPath: "inset(0% 0% 0% 0%)", yPercent: 0 })
        .to(to, { autoAlpha: 1, duration: 0.3 })
        .set(from, { autoAlpha: 0, zIndex: 0 })
        .set(to, { zIndex: 1 });
      return;
    }
    // The new slide wipes in over the old one with a clip-path, its heading
    // rises, and the old slide drifts away underneath.
    gsap.timeline({ defaults: { duration: 0.9, ease: "power3.inOut" }, onComplete: done })
      .set(to, { zIndex: 2, autoAlpha: 1, clipPath: direction > 0 ? "inset(100% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" })
      .to(to, { clipPath: "inset(0% 0% 0% 0%)" })
      .fromTo(to.querySelector("h3"), { yPercent: 120 * direction, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, 0.35)
      .fromTo(to.querySelector("p"), { y: 20 * direction, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, 0.45)
      .to(from, { yPercent: -15 * direction, duration: 0.9 }, 0)
      .set(from, { autoAlpha: 0, zIndex: 0, yPercent: 0 })
      .set(to, { zIndex: 1 });
  })();

  useGSAP(() => {
    const el = stage.current!;
    gsap.set(".gallery-slide", { autoAlpha: (i) => (i === index.current ? 1 : 0), zIndex: (i) => (i === index.current ? 1 : 0) });

    // Wheel: vertical. Pointer and touch: sideways, so a finger moving up and
    // down still scrolls the page (touch-action: pan-y on the stage).
    // tolerance ignores tiny jitters.
    const wheel = Observer.create({
      target: el, type: "wheel", tolerance: 10,
      onDown: () => { setLast("wheel ↓"); show(index.current + 1, 1); },
      onUp: () => { setLast("wheel ↑"); show(index.current - 1, -1); },
    });
    const swipe = Observer.create({
      target: el, type: "touch,pointer", tolerance: 30, dragMinimum: 5, lockAxis: true,
      onLeft: () => { setLast("swipe ←"); show(index.current + 1, 1); },
      onRight: () => { setLast("swipe →"); show(index.current - 1, -1); },
    });

    // Observer could block page scrolling itself (preventDefault: true), but
    // then the page would be stuck while the pointer is over the gallery.
    // Instead, only wheel movements that change the slide are swallowed; at
    // the first or last slide the wheel scrolls the page as usual.
    const onWheel = (e: WheelEvent) => {
      const atEnd = e.deltaY > 0 ? index.current === SLIDES.length - 1 : index.current === 0;
      if (!atEnd) e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      wheel.kill();
      swipe.kill();
      el.removeEventListener("wheel", onWheel);
    };
  }, { scope: stage, dependencies: [reduced] });

  const onKey = (e: React.KeyboardEvent) => {
    const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key] as 1 | -1 | undefined;
    if (!dir) return;
    e.preventDefault();
    setLast(`key ${e.key.replace("Arrow", "").toLowerCase()}`);
    show(index.current + dir, dir);
  };

  return (
    <>
      <Stage
        ref={stage}
        className="h-95 touch-pan-y select-none focus-visible:outline-2 focus-visible:outline-accent"
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label="Observer gallery"
        onKeyDown={onKey}
      >
        {/* Before GSAP takes over only the first slide shows. The class is
            static: React re-renders mustn't fight GSAP's inline styles. */}
        {SLIDES.map((s, i) => (
          <div
            key={s.title}
            className={`gallery-slide ${i === 0 ? "" : "invisible"} absolute inset-0 flex flex-col justify-end overflow-hidden p-6 text-white`}
            style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
            aria-hidden={i !== current}
          >
            <span className="absolute top-5 left-6 text-sm text-white/75">{i + 1} / {SLIDES.length}</span>
            <div className="overflow-hidden"><h3 className="m-0 text-5xl font-bold">{s.title}</h3></div>
            <p className="mb-0 max-w-md text-white/90">{s.text}</p>
          </div>
        ))}
        <div className="absolute top-1/2 right-4 z-10 flex -translate-y-1/2 flex-col gap-1.5" aria-hidden="true">
          {SLIDES.map((s, i) => <span key={s.title} className={`size-2 rounded-full ${i === current ? "bg-white" : "bg-white/40"}`} />)}
        </div>
      </Stage>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={() => show(current - 1, -1)} disabled={current === 0} aria-label="Previous slide">↑</Button>
        <Button variant="ghost" onClick={() => show(current + 1, 1)} disabled={current === SLIDES.length - 1} aria-label="Next slide">↓</Button>
        <span className="text-sm text-muted" aria-live="polite">Slide {current + 1} of {SLIDES.length} · last input: <code>{last}</code></span>
      </div>
      {reduced && <p className="text-sm text-muted">Reduced motion: slides crossfade instead of wiping.</p>}
    </>
  );
}
