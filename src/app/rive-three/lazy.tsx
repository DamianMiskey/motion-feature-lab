"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { DemoPlaceholder, WhenVisible } from "@/components/Deferred";

// The heavy demo code (and the library it imports) is split into its own
// chunk: downloaded only when the demo nears the viewport, never by a
// prefetch of this page. ssr: false because it only runs in the browser.

const RiveTextureChunk = dynamic(() => import("./RiveTexture").then((m) => m.RiveTexture), {
  ssr: false,
  loading: () => <DemoPlaceholder label="3D scene" className="h-95" />,
});

export function RiveTexture(props: ComponentProps<typeof RiveTextureChunk>) {
  return (
    <WhenVisible placeholder={<DemoPlaceholder label="3D scene" className="h-95" />}>
      <RiveTextureChunk {...props} />
    </WhenVisible>
  );
}

const RiveInSpaceChunk = dynamic(() => import("./RiveInSpace").then((m) => m.RiveInSpace), {
  ssr: false,
  loading: () => <DemoPlaceholder label="3D scene" className="h-95" />,
});

export function RiveInSpace(props: ComponentProps<typeof RiveInSpaceChunk>) {
  return (
    <WhenVisible placeholder={<DemoPlaceholder label="3D scene" className="h-95" />}>
      <RiveInSpaceChunk {...props} />
    </WhenVisible>
  );
}
