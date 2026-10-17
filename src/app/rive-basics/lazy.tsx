"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { DemoPlaceholder, WhenVisible } from "@/components/Deferred";

// The heavy demo code (and the library it imports) is split into its own
// chunk: downloaded only when the demo nears the viewport, never by a
// prefetch of this page. ssr: false because it only runs in the browser.

const RivePlayerChunk = dynamic(() => import("./RivePlayer").then((m) => m.RivePlayer), {
  ssr: false,
  loading: () => <DemoPlaceholder label="Rive animation" className="h-65" />,
});

export function RivePlayer(props: ComponentProps<typeof RivePlayerChunk>) {
  return (
    <WhenVisible placeholder={<DemoPlaceholder label="Rive animation" className="h-65" />}>
      <RivePlayerChunk {...props} />
    </WhenVisible>
  );
}
