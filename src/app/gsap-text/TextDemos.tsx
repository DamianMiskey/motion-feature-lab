"use client";

import { useRef } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";

// SplitText wraps lines, words or characters in their own elements so each
// can be animated. aria: "auto" puts the original sentence in an aria-label
// and hides the pieces, so screen readers read it once, normally.
export function TextDemos() {
  const { reduced } = useMotion();
  const root = useRef<HTMLDivElement>(null);
  const charsTween = useRef<gsap.core.Tween | null>(null);

  useGSAP(() => {
    if (reduced) return; // the text simply shows; nothing is split

    // 1. Lines slide up from behind a mask. autoSplit re-splits when the
    //    container resizes (lines change), and because onSplit returns the
    //    animation, GSAP rebuilds it at the same progress.
    SplitText.create(".lines-demo", {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      aria: "auto",
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 0.9,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: ".lines-demo", start: "top 85%" },
        }),
    });

    // 2. Characters, on demand.
    const chars = SplitText.create(".chars-demo", { type: "chars,words", aria: "auto" });
    charsTween.current = gsap.from(chars.chars, {
      opacity: 0, y: -24, rotation: () => gsap.utils.random(-40, 40), duration: 0.6, stagger: 0.025, ease: "back.out(2)", paused: true,
    });

    // 3. Words brighten one by one as you scroll (scrub).
    SplitText.create(".words-demo", {
      type: "words",
      aria: "auto",
      autoSplit: true,
      onSplit: (self) =>
        gsap.fromTo(self.words, { opacity: 0.15 }, {
          opacity: 1, stagger: 0.1, ease: "none",
          scrollTrigger: { trigger: ".words-demo", start: "top 80%", end: "bottom 45%", scrub: true },
        }),
    });
  }, { scope: root, dependencies: [reduced], revertOnUpdate: true });

  return (
    <div ref={root}>
      <h3>1. Lines from behind a mask</h3>
      <p className="lines-demo big-text">
        Motion is a language. Used well it explains what changed, where things went, and what to look at next. Used badly it just
        gets in the way.
      </p>

      <h3>2. Characters</h3>
      <p className="chars-demo big-text">Every letter on its own.</p>
      <button onClick={() => charsTween.current?.restart()} disabled={reduced}>Play</button>

      <h3>3. Words lit by scrolling</h3>
      <p className="words-demo big-text">
        Scroll slowly and each word brightens in turn, as if the page were reading itself to you. Scroll back and they fade again.
      </p>
      {reduced && <p className="small muted">Reduced motion: the text isn&apos;t split or animated.</p>}
      <div style={{ height: "30vh" }} aria-hidden="true" />
    </div>
  );
}
