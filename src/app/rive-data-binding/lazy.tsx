"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { DemoPlaceholder, WhenVisible } from "@/components/Deferred";

// The heavy demo code (and the library it imports) is split into its own
// chunk: downloaded only when the demo nears the viewport, never by a
// prefetch of this page. ssr: false because it only runs in the browser.

const StocksDashboardChunk = dynamic(() => import("./StocksDashboard").then((m) => m.StocksDashboard), {
  ssr: false,
  loading: () => <DemoPlaceholder label="Rive dashboard" className="h-95" />,
});

export function StocksDashboard(props: ComponentProps<typeof StocksDashboardChunk>) {
  return (
    <WhenVisible placeholder={<DemoPlaceholder label="Rive dashboard" className="h-95" />}>
      <StocksDashboardChunk {...props} />
    </WhenVisible>
  );
}
