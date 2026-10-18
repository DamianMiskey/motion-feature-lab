"use client";

import dynamic from "next/dynamic";
import { DemoPlaceholder, WhenVisible } from "@/components/Deferred";

// The heavy demo code (and the libraries it imports) is split into its own
// chunk: downloaded only when the demo nears the viewport, never by a
// prefetch of this page. ssr: false because it only runs in the browser.

// Sized like the demo, so nothing shifts when it arrives.
const placeholder = <DemoPlaceholder label="physics scene" className="h-[490px]" />;

const PhysicsSceneChunk = dynamic(() => import("./PhysicsScene").then((m) => m.PhysicsScene), { ssr: false, loading: () => placeholder });

export function PhysicsScene() {
  return (
    <WhenVisible placeholder={placeholder}>
      <PhysicsSceneChunk />
    </WhenVisible>
  );
}
