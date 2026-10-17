"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { DemoPlaceholder, WhenVisible } from "@/components/Deferred";

// The heavy demo code (and the library it imports) is split into its own
// chunk: downloaded only when the demo nears the viewport, never by a
// prefetch of this page. ssr: false because it only runs in the browser.

const ScrollCameraChunk = dynamic(() => import("./ScrollCamera").then((m) => m.ScrollCamera), {
  ssr: false,
  loading: () => <DemoPlaceholder label="3D scene" className="h-[min(70vh,520px)]" />,
});

export function ScrollCamera(props: ComponentProps<typeof ScrollCameraChunk>) {
  return (
    <WhenVisible placeholder={<DemoPlaceholder label="3D scene" className="h-[min(70vh,520px)]" />}>
      <ScrollCameraChunk {...props} />
    </WhenVisible>
  );
}
