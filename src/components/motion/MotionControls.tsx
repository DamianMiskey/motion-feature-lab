"use client";

import { type MotionPreference, useMotion } from "./MotionProvider";

// The settings in the sidebar, on every page.
export function MotionControls() {
  const { preference, setPreference, systemReduced, reduced, showFps, setShowFps } = useMotion();
  return (
    <div className="mt-2 grid w-full gap-1.5 p-2">
      <div className="text-xs tracking-wider text-muted uppercase">Motion</div>
      <label className="grid gap-1 text-sm text-muted">
        Animation
        <select value={preference} onChange={(e) => setPreference(e.target.value as MotionPreference)}>
          <option value="system">System ({systemReduced ? "reduced" : "full"})</option>
          <option value="reduce">Reduce</option>
          <option value="full">Full</option>
        </select>
      </label>
      <label className="flex items-center gap-1.5 text-sm text-muted">
        <input type="checkbox" checked={showFps} onChange={(e) => setShowFps(e.target.checked)} /> Show FPS
      </label>
      {reduced && <p className="m-0 text-sm text-muted">Reduced: demos skip big movement and don&apos;t autoplay.</p>}
    </div>
  );
}
