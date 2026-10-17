"use client";

import { useRef, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { gsap, useGSAP } from "@/lib/gsap";

const PANELS = ["Design", "Animate", "Scroll", "Ship"];

// Three ScrollTrigger patterns. With reduced motion, the same content shows
// without movement: cards simply fade in, nothing is pinned or scrubbed.
export function ScrollDemos() {
  const { reduced } = useMotion();
  const root = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState(false);

  useGSAP(() => {
    // 1. Reveal: each card animates in once as it enters the viewport.
    gsap.utils.toArray<HTMLElement>(".reveal-card").forEach((card) => {
      gsap.from(card, {
        opacity: 0,
        y: reduced ? 0 : 60,
        duration: reduced ? 0.4 : 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: card, start: "top 85%", toggleActions: "play none none reverse", markers },
      });
    });

    if (reduced) return;

    // 2. Scrub: the animation's progress follows the scroll position exactly.
    gsap.to(".scrub-bar", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: { trigger: ".scrub-section", start: "top 80%", end: "bottom 30%", scrub: true, markers },
    });
    gsap.to(".scrub-spinner", {
      rotation: 720,
      ease: "none",
      scrollTrigger: { trigger: ".scrub-section", start: "top 80%", end: "bottom 30%", scrub: 0.5, markers },
    });

    // 3. Pin: the section stays put while scrolling moves the panels sideways.
    const track = root.current!.querySelector<HTMLElement>(".panel-track")!;
    gsap.to(track, {
      x: () => -(track.scrollWidth - track.clientWidth),
      ease: "none",
      scrollTrigger: {
        trigger: ".pin-section",
        start: "top 15%",
        end: () => `+=${track.scrollWidth - track.clientWidth}`,
        pin: true,
        scrub: 1,
        // ScrollTrigger measures positions up front; this re-measures on resize.
        invalidateOnRefresh: true,
        markers,
      },
    });
  }, { scope: root, dependencies: [reduced, markers], revertOnUpdate: true });

  return (
    <div ref={root}>
      <label className="small check controls">
        <input type="checkbox" checked={markers} onChange={(e) => setMarkers(e.target.checked)} /> Show ScrollTrigger markers (start/end lines)
      </label>

      <h3>1. Reveal on enter</h3>
      <div className="cards">
        {["Enters at 85% of the viewport", "Plays once, reverses when you scroll back up", "toggleActions controls all four events"].map((t) => (
          <div key={t} className="reveal-card cell">{t}</div>
        ))}
      </div>

      <h3>2. Scrub: progress follows the scrollbar</h3>
      <div className="scrub-section cell">
        <div className="scrub-track"><div className="scrub-bar" style={{ transform: reduced ? "scaleX(1)" : "scaleX(0)" }} /></div>
        <div className="scrub-spinner box" />
        <p className="small muted">{reduced ? "Reduced motion: shown in its finished state." : "Scroll up and down slowly: the bar and the square move with you. scrub: 0.5 adds half a second of smoothing to the square."}</p>
      </div>

      <h3>3. Pin and scroll sideways</h3>
      <div className="pin-section">
        <div className={`panel-track${reduced ? " stacked" : ""}`}>
          {PANELS.map((p, i) => <div key={p} className="panel"><span className="small muted">{i + 1} / {PANELS.length}</span><strong>{p}</strong></div>)}
        </div>
      </div>
      <p className="small muted">{reduced ? "Reduced motion: the panels are listed instead of pinned." : "The section pins while you scroll, then lets go after the last panel."}</p>
      <div style={{ height: "40vh" }} aria-hidden="true" />
    </div>
  );
}
