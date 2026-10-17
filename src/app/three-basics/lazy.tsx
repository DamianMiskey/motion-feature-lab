"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { DemoPlaceholder, WhenVisible } from "@/components/Deferred";

// The heavy demo code (and the library it imports) is split into its own
// chunk: downloaded only when the demo nears the viewport, never by a
// prefetch of this page. ssr: false because it only runs in the browser.

const SceneChunk = dynamic(() => import("./Scene").then((m) => m.Scene), {
  ssr: false,
  loading: () => <DemoPlaceholder label="3D scene" className="h-95" />,
});

export function Scene(props: ComponentProps<typeof SceneChunk>) {
  return (
    <WhenVisible placeholder={<DemoPlaceholder label="3D scene" className="h-95" />}>
      <SceneChunk {...props} />
    </WhenVisible>
  );
}
