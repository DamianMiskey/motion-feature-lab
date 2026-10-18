"use client";

import dynamic from "next/dynamic";
import { DemoPlaceholder, WhenVisible } from "@/components/Deferred";

// The demo and the GSAP plugin it registers (Draggable and InertiaPlugin) are split into their
// own chunk: downloaded only when the demo nears the viewport, never by a
// prefetch of this page. GSAP itself stays in the shared bundle.

// Sized like the demo, so nothing shifts when it arrives.
const placeholder = <DemoPlaceholder label="demo" className="h-[806px]" />;

const DragDemosChunk = dynamic(() => import("./DragDemos").then((m) => m.DragDemos), { ssr: false, loading: () => placeholder });

export function DragDemos() {
  return (
    <WhenVisible placeholder={placeholder}>
      <DragDemosChunk />
    </WhenVisible>
  );
}
