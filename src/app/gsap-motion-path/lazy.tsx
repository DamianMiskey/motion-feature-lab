"use client";

import dynamic from "next/dynamic";
import { DemoPlaceholder, WhenVisible } from "@/components/Deferred";

// The demo and the GSAP plugin it registers (MotionPathPlugin) are split into their
// own chunk: downloaded only when the demo nears the viewport, never by a
// prefetch of this page. GSAP itself stays in the shared bundle.

// Sized like the demo, so nothing shifts when it arrives.
const placeholder = <DemoPlaceholder label="demo" className="h-[673px] md:h-[901px]" />;

const PathDemosChunk = dynamic(() => import("./PathDemos").then((m) => m.PathDemos), { ssr: false, loading: () => placeholder });

export function PathDemos() {
  return (
    <WhenVisible placeholder={placeholder}>
      <PathDemosChunk />
    </WhenVisible>
  );
}
