"use client";

import "@/lib/rive-runtime";
import { Alignment, Fit, Layout, useRive } from "@rive-app/react-canvas";
import { useEffect, useState } from "react";
import { Stage } from "@/components/ui";

const FITS = [Fit.Layout, Fit.Contain, Fit.Cover, Fit.Fill, Fit.FitWidth, Fit.FitHeight, Fit.ScaleDown, Fit.None];
const ALIGNMENTS = [Alignment.Center, Alignment.TopLeft, Alignment.TopCenter, Alignment.TopRight, Alignment.CenterLeft, Alignment.CenterRight, Alignment.BottomLeft, Alignment.BottomCenter, Alignment.BottomRight];

// Fit decides how the artboard is sized into the canvas. Fit.Layout is
// different from the rest: instead of scaling a fixed drawing, it resizes the
// artboard itself, and the designer's layout rules reflow its contents.
export function LayoutDemo() {
  const [fit, setFit] = useState<Fit>(Fit.Layout);
  const [alignment, setAlignment] = useState<Alignment>(Alignment.Center);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(320);

  const { rive, RiveComponent } = useRive(
    { src: "/rive/layout_test.riv", artboard: "Artboard", stateMachine: "State Machine 1", autoplay: true, layout: new Layout({ fit: Fit.Layout }) },
    { shouldUseIntersectionObserver: true },
  );

  // The layout can change while the file is running, through Rive's own
  // `layout` setter. React's lint rule assumes values from hooks are React
  // state; this one is Rive's player object, made to be configured this way.
  // Fit.Layout resizes the artboard itself, and that size sticks: switching to
  // another fit restores the designed size first, otherwise there'd be
  // nothing left to scale. Switching back re-measures the canvas.
  const [artboard, setArtboard] = useState("");
  useEffect(() => {
    if (!rive) return;
    // eslint-disable-next-line react-hooks/immutability
    rive.layout = new Layout({ fit, alignment });
    if (fit === Fit.Layout) rive.resizeDrawingSurfaceToCanvas();
    else rive.resetArtboardSize();
  }, [rive, fit, alignment]);

  // Show the artboard's size as the container changes.
  useEffect(() => {
    if (!rive) return;
    const id = setInterval(() => setArtboard(`${Math.round(rive.artboardWidth)} × ${Math.round(rive.artboardHeight)}`), 250);
    return () => clearInterval(id);
  }, [rive]);

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <label className="text-sm">fit{" "}
          <select value={fit} onChange={(e) => setFit(e.target.value as Fit)}>{FITS.map((f) => <option key={f}>{f}</option>)}</select>
        </label>
        <label className="text-sm">alignment{" "}
          <select value={alignment} onChange={(e) => setAlignment(e.target.value as Alignment)} disabled={fit === Fit.Layout}>
            {ALIGNMENTS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <label className="flex flex-1 items-center gap-2 text-sm"><span>width</span><input className="min-w-0 flex-1" type="range" min={30} max={100} value={width} onChange={(e) => setWidth(Number(e.target.value))} aria-label="Container width" /><span className="tabular-nums">{width}%</span></label>
        <label className="flex flex-1 items-center gap-2 text-sm"><span>height</span><input className="min-w-0 flex-1" type="range" min={160} max={480} value={height} onChange={(e) => setHeight(Number(e.target.value))} aria-label="Container height" /><span className="tabular-nums">{height}px</span></label>
      </div>
      <p className="text-sm text-muted">Artboard size now: <strong className="tabular-nums">{artboard || "…"}</strong> {fit === Fit.Layout ? "(follows the container)" : "(as designed; the drawing is scaled to fit)"}</p>
      {/* The canvas follows its container; Rive redraws at the new size. */}
      <Stage style={{ width: `${width}%`, height }}>
        <RiveComponent role="img" aria-label={`A Rive layout drawn with fit ${fit}`} />
      </Stage>
    </>
  );
}
