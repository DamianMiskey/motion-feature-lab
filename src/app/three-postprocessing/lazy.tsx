"use client";

import dynamic from "next/dynamic";
import { DemoPlaceholder, WhenVisible } from "@/components/Deferred";

// The heavy demo code (and the libraries it imports) is split into its own
// chunk: downloaded only when the demo nears the viewport, never by a
// prefetch of this page. ssr: false because it only runs in the browser.

// Sized like the demo, so nothing shifts when it arrives.
const placeholder = <DemoPlaceholder label="3D scene" className="h-[480px]" />;

const PostSceneChunk = dynamic(() => import("./PostScene").then((m) => m.PostScene), { ssr: false, loading: () => placeholder });

export function PostScene() {
  return (
    <WhenVisible placeholder={placeholder}>
      <PostSceneChunk />
    </WhenVisible>
  );
}
