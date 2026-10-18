"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { DemoPlaceholder, WhenVisible } from "@/components/Deferred";

// The heavy demo code (and the library it imports) is split into its own
// chunk: downloaded only when the demo nears the viewport, never by a
// prefetch of this page. ssr: false because it only runs in the browser.

const RiveInputChunk = dynamic(() => import("./RiveInput").then((m) => m.RiveInput), {
  ssr: false,
  loading: () => <DemoPlaceholder label="Rive file" className="h-90" />,
});

export function RiveInput(props: ComponentProps<typeof RiveInputChunk>) {
  return (
    <WhenVisible placeholder={<DemoPlaceholder label="Rive file" className={props.className ?? "h-90"} />}>
      <RiveInputChunk {...props} />
    </WhenVisible>
  );
}
