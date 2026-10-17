"use client";

import { type MotionPreference, useMotion } from "./MotionProvider";

// The settings in the sidebar, on every page.
export function MotionControls() {
  const { preference, setPreference, systemReduced, reduced, showFps, setShowFps } = useMotion();
  return (
    <div className="motion-controls">
      <div className="nav-cat">Motion</div>
      <label className="small">
        Animation
        <select value={preference} onChange={(e) => setPreference(e.target.value as MotionPreference)}>
          <option value="system">System ({systemReduced ? "reduced" : "full"})</option>
          <option value="reduce">Reduce</option>
          <option value="full">Full</option>
        </select>
      </label>
      <label className="small check">
        <input type="checkbox" checked={showFps} onChange={(e) => setShowFps(e.target.checked)} /> Show FPS
      </label>
      {reduced && <p className="small muted">Reduced: demos skip big movement and don&apos;t autoplay.</p>}
    </div>
  );
}
