"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { DemoPlaceholder, WhenVisible } from "@/components/Deferred";

// The heavy demo code (and the library it imports) is split into its own
// chunk: downloaded only when the demo nears the viewport, never by a
// prefetch of this page. ssr: false because it only runs in the browser.

const ShaderSceneChunk = dynamic(() => import("./ShaderScene").then((m) => m.ShaderScene), {
  ssr: false,
  loading: () => <DemoPlaceholder label="shader" className="h-95" />,
});

export function ShaderScene(props: ComponentProps<typeof ShaderSceneChunk>) {
  return (
    <WhenVisible placeholder={<DemoPlaceholder label="shader" className="h-95" />}>
      <ShaderSceneChunk {...props} />
    </WhenVisible>
  );
}
