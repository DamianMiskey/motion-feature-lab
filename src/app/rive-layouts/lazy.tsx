"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { DemoPlaceholder, WhenVisible } from "@/components/Deferred";

// The heavy demo code (and the library it imports) is split into its own
// chunk: downloaded only when the demo nears the viewport, never by a
// prefetch of this page. ssr: false because it only runs in the browser.

const LayoutDemoChunk = dynamic(() => import("./LayoutDemo").then((m) => m.LayoutDemo), {
  ssr: false,
  loading: () => <DemoPlaceholder label="Rive layout" className="h-80" />,
});

export function LayoutDemo(props: ComponentProps<typeof LayoutDemoChunk>) {
  return (
    <WhenVisible placeholder={<DemoPlaceholder label="Rive layout" className="h-80" />}>
      <LayoutDemoChunk {...props} />
    </WhenVisible>
  );
}
