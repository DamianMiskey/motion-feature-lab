"use client";

import dynamic from "next/dynamic";
import { DemoPlaceholder, WhenVisible } from "@/components/Deferred";

// The heavy demo code (and the libraries it imports) is split into its own
// chunk: downloaded only when the demo nears the viewport, never by a
// prefetch of this page. ssr: false because it only runs in the browser.

// Sized like the demo, so nothing shifts when it arrives.
const placeholder = <DemoPlaceholder label="game" className="h-[480px] sm:h-[560px]" />;

const GameChunk = dynamic(() => import("./Game").then((m) => m.Game), { ssr: false, loading: () => placeholder });

export function Game() {
  return (
    <WhenVisible placeholder={placeholder}>
      <GameChunk />
    </WhenVisible>
  );
}
