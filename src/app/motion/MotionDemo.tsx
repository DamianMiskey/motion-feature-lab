"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { useInView } from "@/components/motion/useInView";
import { Stage } from "@/components/ui";

gsap.registerPlugin(useGSAP);

// One looping animation that follows both rules every demo in the lab uses:
// 1. Reduced motion: no travel across the screen, just a gentle fade.
// 2. Off screen: paused, so it costs nothing while you can't see it.
export function MotionDemo() {
  const { reduced } = useMotion();
  const stage = useRef<HTMLDivElement>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const inView = useInView(stage);

  // useGSAP scopes the animation to this component and reverts it on unmount
  // (or when `reduced` changes), so nothing leaks between pages.
  useGSAP(() => {
    tween.current = reduced
      ? gsap.fromTo(".box", { opacity: 0.4 }, { opacity: 1, duration: 1.5, repeat: -1, yoyo: true, ease: "sine.inOut" })
      : gsap.to(".box", { x: () => (stage.current?.clientWidth ?? 300) - 96, rotation: 360, duration: 2, repeat: -1, yoyo: true, ease: "power2.inOut" });
  }, { scope: stage, dependencies: [reduced], revertOnUpdate: true });

  useGSAP(() => {
    if (inView) tween.current?.resume();
    else tween.current?.pause();
  }, { dependencies: [inView, reduced] });

  return (
    <>
      <Stage ref={stage} className="h-30 p-7">
        <div className="box size-16 rounded-xl bg-accent" />
      </Stage>
      <p className="text-sm text-muted">
        Mode: <strong>{reduced ? "reduced (fade only)" : "full (moves and spins)"}</strong> · {inView ? "on screen: playing" : "off screen: paused"}
      </p>
    </>
  );
}
