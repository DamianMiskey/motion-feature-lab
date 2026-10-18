"use client";

import dynamic from "next/dynamic";
import { DemoPlaceholder, WhenVisible } from "@/components/Deferred";

// The demo and the GSAP plugin it registers (Observer) are split into their
// own chunk: downloaded only when the demo nears the viewport, never by a
// prefetch of this page. GSAP itself stays in the shared bundle.

// Sized like the demo, so nothing shifts when it arrives.
const placeholder = <DemoPlaceholder label="demo" className="h-[454px] md:h-[426px]" />;

const ObserverGalleryChunk = dynamic(() => import("./ObserverGallery").then((m) => m.ObserverGallery), { ssr: false, loading: () => placeholder });

export function ObserverGallery() {
  return (
    <WhenVisible placeholder={placeholder}>
      <ObserverGalleryChunk />
    </WhenVisible>
  );
}
