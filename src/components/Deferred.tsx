"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cx } from "./ui";

// A placeholder the same size as the demo it stands in for, so nothing jumps
// when the real thing arrives (no layout shift).
export function DemoPlaceholder({ label, className = "h-95" }: { label: string; className?: string }) {
  return (
    <div className={cx("mb-3 grid place-items-center rounded-xl border border-dashed border-line bg-bg text-sm text-muted", className)}>
      Loading {label}…
    </div>
  );
}

// Renders its children only once they come near the viewport. Combined with
// next/dynamic, a heavy library (Three.js, Rive) is downloaded only when its
// demo is about to be seen, not when the page loads, and not when another
// page prefetches this one.
export function WhenVisible({ placeholder, children, margin = "300px" }: { placeholder: ReactNode; children: ReactNode; margin?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setShow(true), { rootMargin: margin });
    observer.observe(el);
    return () => observer.disconnect();
  }, [show, margin]);
  return show ? <>{children}</> : <div ref={ref}>{placeholder}</div>;
}
