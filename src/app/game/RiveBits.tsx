"use client";

import "@/lib/rive-runtime";
import { Fit, Layout, Rive, RuntimeLoader, useRive, useStateMachineInput } from "@rive-app/react-canvas";
import { useEffect } from "react";

// rating.riv predates Rive's data binding: its stars are driven by a state
// machine *input* called "rating" (0–5). Inputs still work but are deprecated
// (new files should expose a view model), so the warning is acknowledged here.
Rive.suppressDeprecationWarnings = ["state-machine-inputs"];

/** Rive's star rating, animated to the score. Display only: no pointer input. */
export function RiveStars({ value, label }: { value: number; label: string }) {
  const { rive, RiveComponent } = useRive({
    src: "/rive/rating.riv",
    stateMachine: "State Machine 1",
    autoplay: true,
    // The artboard is a square with the stars across its middle: Cover in a
    // wide, short box crops it to a band of stars.
    layout: new Layout({ fit: Fit.Cover }),
  });
  const rating = useStateMachineInput(rive, "State Machine 1", "rating");
  useEffect(() => {
    // An input is a mutable handle into the running file, which React's
    // immutability rule can't know.
    // eslint-disable-next-line react-hooks/immutability
    if (rating) rating.value = value;
  }, [rating, value]);
  return (
    <div className="pointer-events-none mx-auto my-2 h-16 w-64 max-w-full overflow-hidden rounded-lg" role="img" aria-label={label}>
      <RiveComponent />
    </div>
  );
}

/** Starts downloading Rive's runtime (WebAssembly, ~800 KB) ahead of the first results screen. */
export const warmRive = () => { void RuntimeLoader.awaitInstance(); };
