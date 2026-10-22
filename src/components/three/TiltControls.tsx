"use client";

import { cx } from "@/components/ui";

// Phone-tilt steering controls, drawn inside the game (bottom-left, next to
// the full-screen button) so they're reachable in full screen too, and above
// the start/end panels so tilt can be switched on before playing.
const pill = "pointer-events-auto h-10 cursor-pointer rounded-full border border-white/40 bg-black/45 px-3.5 text-sm font-medium text-white hover:bg-black/65";

export function TiltControls({ available, on, enableLabel, onEnable, onRecalibrate, onDisable }: {
  /** Only phones and tablets with motion sensors get the controls at all. */
  available: boolean;
  on: boolean;
  enableLabel: string;
  onEnable: () => void;
  onRecalibrate: () => void;
  onDisable: () => void;
}) {
  if (!available) return null;
  return (
    <div className="absolute bottom-3 left-16 z-20 flex flex-wrap gap-2" role="group" aria-label="Tilt steering">
      {on ? (
        <>
          <button type="button" className={pill} onClick={onRecalibrate}>Recalibrate</button>
          <button type="button" className={cx(pill, "text-white/80")} onClick={onDisable}>Tilt off</button>
        </>
      ) : (
        <button type="button" className={pill} onClick={onEnable}>{enableLabel}</button>
      )}
    </div>
  );
}
