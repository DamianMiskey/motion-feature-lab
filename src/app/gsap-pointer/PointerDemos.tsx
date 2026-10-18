"use client";

import { useRef } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { gsap, useGSAP } from "@/lib/gsap";
import { cx, Stage } from "@/components/ui";

// Effects that follow a mouse only make sense with a mouse: gsap.matchMedia
// sets them up when the pointer can hover precisely, and reverts every one
// of them (listeners included) the moment that stops being true, such as
// when a tablet gets its keyboard detached. Reduced motion turns them off too.
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

export function PointerDemos() {
  const { reduced } = useMotion();
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (reduced) return;
    const mm = gsap.matchMedia();
    mm.add(FINE_POINTER, () => {
      const el = root.current!;
      const off: (() => void)[] = [];
      const on = <K extends keyof HTMLElementEventMap>(target: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void) => {
        target.addEventListener(type, fn);
        off.push(() => target.removeEventListener(type, fn));
      };

      // 1. Cursor follower. quickTo() builds one reusable tween per property
      // and just retargets it on every pointer move: far cheaper than
      // creating a new tween 60+ times a second. Two speeds give the trail.
      const area = el.querySelector<HTMLElement>(".cursor-area")!;
      const [dot, ring] = [".cursor-dot", ".cursor-ring"].map((s) => area.querySelector<HTMLElement>(s)!);
      const dotX = gsap.quickTo(dot, "x", { duration: 0.15, ease: "power3" });
      const dotY = gsap.quickTo(dot, "y", { duration: 0.15, ease: "power3" });
      const ringX = gsap.quickTo(ring, "x", { duration: 0.6, ease: "power3" });
      const ringY = gsap.quickTo(ring, "y", { duration: 0.6, ease: "power3" });
      on(area, "pointermove", (e) => {
        const box = area.getBoundingClientRect();
        const [x, y] = [e.clientX - box.left, e.clientY - box.top];
        dotX(x); dotY(y); ringX(x); ringY(y);
      });
      on(area, "pointerenter", () => gsap.to([dot, ring], { autoAlpha: 1, duration: 0.2 }));
      on(area, "pointerleave", () => gsap.to([dot, ring], { autoAlpha: 0, duration: 0.2 }));
      area.querySelectorAll<HTMLElement>(".cursor-target").forEach((t) => {
        on(t, "pointerenter", () => gsap.to(ring, { scale: 2.2, backgroundColor: "rgb(224 87 122 / 0.15)", duration: 0.3 }));
        on(t, "pointerleave", () => gsap.to(ring, { scale: 1, backgroundColor: "rgb(224 87 122 / 0)", duration: 0.3 }));
      });

      // 2. Magnetic buttons: pulled a fraction of the way toward the pointer,
      // label pulled a little further for depth, then sprung back on leave.
      el.querySelectorAll<HTMLElement>(".magnet").forEach((btn) => {
        const label = btn.querySelector("span")!;
        const [bx, by, lx, ly] = [gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3" }), gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3" }),
          gsap.quickTo(label, "x", { duration: 0.4, ease: "power3" }), gsap.quickTo(label, "y", { duration: 0.4, ease: "power3" })];
        on(btn, "pointermove", (e) => {
          const box = btn.getBoundingClientRect();
          const [dx, dy] = [e.clientX - (box.left + box.width / 2), e.clientY - (box.top + box.height / 2)];
          bx(dx * 0.35); by(dy * 0.35); lx(dx * 0.15); ly(dy * 0.15);
        });
        on(btn, "pointerleave", () => gsap.to([btn, label], { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)", overwrite: true }));
      });

      // 3. Tilt cards: the pointer's position over the card sets its 3D
      // rotation, and a highlight follows the pointer across the surface.
      el.querySelectorAll<HTMLElement>(".tilt").forEach((card) => {
        const glare = card.querySelector<HTMLElement>(".glare")!;
        const rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3" });
        const ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3" });
        gsap.set(card, { transformPerspective: 700 });
        on(card, "pointermove", (e) => {
          const box = card.getBoundingClientRect();
          const [px, py] = [(e.clientX - box.left) / box.width, (e.clientY - box.top) / box.height];
          ry((px - 0.5) * 24); rx((0.5 - py) * 24);
          gsap.set(glare, { background: `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgb(255 255 255 / 0.35), transparent 60%)` });
        });
        on(card, "pointerenter", () => gsap.to(glare, { opacity: 1, duration: 0.3 }));
        on(card, "pointerleave", () => { rx(0); ry(0); gsap.to(glare, { opacity: 0, duration: 0.3 }); });
      });

      // matchMedia reverts the tweens itself; the listeners are ours to remove.
      return () => off.forEach((fn) => fn());
    });
    return () => mm.revert();
  }, { scope: root, dependencies: [reduced] });

  return (
    <div ref={root}>
      <h3>1. A cursor that trails behind: quickTo()</h3>
      {/* The real cursor is hidden only where the follower replaces it. */}
      <Stage className={cx("cursor-area flex h-60 flex-wrap items-center justify-center gap-4 p-4", !reduced && "[@media(hover:hover)_and_(pointer:fine)]:cursor-none")}>
        {["Hover me", "And me"].map((t) => (
          <span key={t} className="cursor-target rounded-full border border-line bg-surface px-5 py-2.5 font-semibold">{t}</span>
        ))}
        <span className="cursor-ring pointer-events-none invisible absolute top-0 left-0 -mt-4 -ml-4 size-8 rounded-full border-2 border-pink" aria-hidden="true" />
        <span className="cursor-dot pointer-events-none invisible absolute top-0 left-0 -mt-1 -ml-1 size-2 rounded-full bg-pink" aria-hidden="true" />
      </Stage>

      <h3>2. Magnetic buttons</h3>
      <div className="mb-3 flex flex-wrap gap-6 rounded-xl border border-line bg-bg px-6 py-8">
        {["Get started", "Learn more", "★"].map((t) => (
          <button key={t} type="button" className="magnet cursor-pointer rounded-full bg-accent px-6 py-3 font-semibold text-white">
            <span className="inline-block">{t}</span>
          </button>
        ))}
      </div>

      <h3>3. Tilt cards with a moving highlight</h3>
      <div className="mb-3 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
        {["Perspective", "Rotation", "Glare"].map((t) => (
          <div key={t} className="tilt relative flex h-44 flex-col justify-end overflow-hidden rounded-xl bg-linear-135 from-accent to-pink p-4 text-white shadow-lg">
            <div className="glare pointer-events-none absolute inset-0 opacity-0" aria-hidden="true" />
            <strong className="text-xl">{t}</strong>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted">
        {reduced
          ? "Reduced motion: these effects are off, and everything works as normal elements."
          : "Needs a mouse or trackpad. On a touch screen nothing follows your finger, by design."}
      </p>
    </div>
  );
}
