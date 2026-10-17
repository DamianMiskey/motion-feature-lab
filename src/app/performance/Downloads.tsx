"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { DemoPlaceholder } from "@/components/Deferred";
import { Button } from "@/components/ui";

// The first 3D scene, loaded only when asked for: its chunk (and Three.js
// with it) isn't requested until the button is pressed.
const Scene = dynamic(() => import("../three-basics/Scene").then((m) => m.Scene), {
  ssr: false,
  loading: () => <DemoPlaceholder label="Three.js" />,
});

type Totals = { js: number; media: number; requests: number };

const tally = (): Totals => {
  const t = { js: 0, media: 0, requests: 0 };
  for (const e of performance.getEntriesByType("resource") as PerformanceResourceTiming[]) {
    t.requests++;
    if (e.name.endsWith(".js")) t.js += e.encodedBodySize; // compressed bytes over the network
    else if (/\.(wasm|riv|glb)$/.test(e.name)) t.media += e.encodedBodySize;
  }
  return t;
};

const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;

// Watches every request this page makes, live.
export function Downloads() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [before3d, setBefore3d] = useState<Totals | null>(null);
  const [show3d, setShow3d] = useState(false);

  useEffect(() => {
    const update = () => setTotals(tally());
    const observer = new PerformanceObserver(update);
    observer.observe({ type: "resource", buffered: true });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="mb-3 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">
        {[
          ["JavaScript", totals && kb(totals.js)],
          ["WASM, .riv, .glb", totals && kb(totals.media)],
          ["Requests", totals?.requests],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-lg border border-line bg-bg px-3 py-2.5">
            <span className="text-sm text-muted">{label}</span>
            <strong className="block text-xl tabular-nums">{value ?? "…"}</strong>
          </div>
        ))}
      </div>
      {!show3d ? (
        <Button onClick={() => { setBefore3d(totals); setShow3d(true); }}>Load a 3D scene</Button>
      ) : (
        <>
          <Scene />
          {before3d && totals && (
            <p className="text-sm">That added <strong className="tabular-nums">{kb(totals.js - before3d.js)}</strong> of JavaScript, downloaded just now.</p>
          )}
        </>
      )}
    </>
  );
}
