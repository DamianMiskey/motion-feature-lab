"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { DemoPlaceholder, WhenVisible } from "@/components/Deferred";

// The heavy demo code (and the library it imports) is split into its own
// chunk: downloaded only when the demo nears the viewport, never by a
// prefetch of this page. ssr: false because it only runs in the browser.

const FoxSceneChunk = dynamic(() => import("./FoxScene").then((m) => m.FoxScene), {
  ssr: false,
  loading: () => <DemoPlaceholder label="3D model" className="h-95" />,
});

export function FoxScene(props: ComponentProps<typeof FoxSceneChunk>) {
  return (
    <WhenVisible placeholder={<DemoPlaceholder label="3D model" className="h-95" />}>
      <FoxSceneChunk {...props} />
    </WhenVisible>
  );
}
