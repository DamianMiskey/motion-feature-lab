"use client";

import { useRef } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { Button } from "@/components/ui";

// SplitText wraps lines, words or characters in their own elements so each
// can be animated. Screen readers would then read the fragments one by one,
// so each sentence has a visually hidden copy to be read instead, and the
// animated version is hidden from them (aria-hidden, aria: "none").
// (aria: "none", which puts the sentence in an aria-label, only suits
// elements that may carry a label, such as headings: a <p> may not.)
const LINES = "Motion is a language. Used well it explains what changed, where things went, and what to look at next. Used badly it just gets in the way.";
const CHARS = "Every letter on its own.";
const WORDS = "Scroll slowly and each word brightens in turn, as if the page were reading itself to you. Scroll back and they fade again.";

function Animated({ className, text }: { className: string; text: string }) {
  return (
    <>
      <p className="sr-only">{text}</p>
      <p className={`${className} text-[clamp(1.25rem,2.6vw,1.75rem)] leading-snug font-semibold`} aria-hidden="true">{text}</p>
    </>
  );
}
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
      aria: "none",
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
    const chars = SplitText.create(".chars-demo", { type: "chars,words", aria: "none" });
    charsTween.current = gsap.from(chars.chars, {
      opacity: 0, y: -24, rotation: () => gsap.utils.random(-40, 40), duration: 0.6, stagger: 0.025, ease: "back.out(2)", paused: true,
    });

    // 3. Words brighten one by one as you scroll (scrub).
    SplitText.create(".words-demo", {
      type: "words",
      aria: "none",
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
      <Animated className="lines-demo" text={LINES} />

      <h3>2. Characters</h3>
      <Animated className="chars-demo" text={CHARS} />
      <Button onClick={() => charsTween.current?.restart()} disabled={reduced}>Play</Button>

      <h3>3. Words lit by scrolling</h3>
      <Animated className="words-demo" text={WORDS} />
      {reduced && <p className="text-sm text-muted">Reduced motion: the text isn&apos;t split or animated.</p>}
      <div className="h-[30vh]" aria-hidden="true" />
    </div>
  );
}
