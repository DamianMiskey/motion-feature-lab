"use client";

import "@/lib/rive-runtime";
import { Fit, Layout, SemanticMode, useRive } from "@rive-app/react-canvas";
import { useState } from "react";
import { Stage } from "@/components/ui";

// A Rive file that handles keyboard and text input itself. The file defines
// focusable elements, keyboard listeners and text fields; the app's part is
// small: give the canvas a tabIndex so it can take focus, and (optionally)
// turn on semantics so assistive technology can see what's inside.
export function RiveInput({
  src, artboard, label, semantics = false, className = "h-90",
}: {
  src: string; artboard?: string; label: string; semantics?: boolean; className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const { RiveComponent } = useRive(
    {
      src,
      artboard,
      stateMachine: "State Machine 1",
      autoplay: true,
      // Binds the file's default view model, which these files use to show
      // what was typed and how many keys were pressed.
      autoBind: true,
      // Lets the canvas be focused with Tab or a click; Rive then routes keys
      // to the focused element inside the file.
      tabIndex: 0,
      // Fonts are embedded in these files; never fetch assets from Rive's CDN
      // (the CSP would block it anyway).
      enableRiveAssetCDN: false,
      // Experimental: mirrors the file's buttons and text fields as hidden
      // DOM elements, so screen readers and the browser's Tab order see them.
      ...(semantics ? { semanticsMode: SemanticMode.Enabled } : {}),
      layout: new Layout({ fit: Fit.Contain }),
    },
    { shouldUseIntersectionObserver: true },
  );

  return (
    // position: relative on the container is what the semantics overlay needs.
    <Stage className={className} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
      <RiveComponent aria-label={label} className="size-full" />
      <span className={`pointer-events-none absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs ${focused ? "bg-accent text-white" : "bg-code text-muted"}`}>
        {focused ? "focused: keys go to Rive" : "click or Tab in"}
      </span>
    </Stage>
  );
}
