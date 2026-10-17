"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

// The lab's motion settings, shared by every demo:
// - preference: follow the operating system's "reduce motion" setting, or
//   override it (Reduce / Full) for this browser
// - showFps: overlay a frames-per-second meter
// Both are remembered in localStorage. Every demo reads `reduced` and tones
// itself down: no large movement, no autoplay, instant transitions.

export type MotionPreference = "system" | "reduce" | "full";

type MotionSettings = {
  preference: MotionPreference;
  setPreference: (p: MotionPreference) => void;
  systemReduced: boolean;
  reduced: boolean;
  showFps: boolean;
  setShowFps: (on: boolean) => void;
};

const MotionContext = createContext<MotionSettings | null>(null);

const PREF_KEY = "motion-lab:preference";
const FPS_KEY = "motion-lab:fps";
const CHANGE = "motion-lab:settings";

// localStorage can throw (private windows, blocked storage); the lab then
// simply forgets settings between visits.
const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
  window.dispatchEvent(new Event(CHANGE));
};

const subscribeSettings = (onChange: () => void) => {
  window.addEventListener(CHANGE, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE, onChange);
    window.removeEventListener("storage", onChange);
  };
};

const reduceQuery = () => window.matchMedia("(prefers-reduced-motion: reduce)");
const subscribeSystem = (onChange: () => void) => {
  const mq = reduceQuery();
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

export function MotionProvider({ children }: { children: ReactNode }) {
  // Server snapshots: "system", not reduced, no FPS meter. The real values are
  // read on the client right after hydration.
  const stored = useSyncExternalStore(subscribeSettings, () => read(PREF_KEY), () => null);
  const preference: MotionPreference = stored === "reduce" || stored === "full" ? stored : "system";
  const showFps = useSyncExternalStore(subscribeSettings, () => read(FPS_KEY) === "1", () => false);
  const systemReduced = useSyncExternalStore(subscribeSystem, () => reduceQuery().matches, () => false);
  const reduced = preference === "reduce" || (preference === "system" && systemReduced);

  const setPreference = useCallback((p: MotionPreference) => write(PREF_KEY, p), []);
  const setShowFps = useCallback((on: boolean) => write(FPS_KEY, on ? "1" : "0"), []);

  // Lets plain CSS follow the setting too: [data-motion="reduce"] …
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduce" : "full";
  }, [reduced]);

  const value = useMemo(
    () => ({ preference, setPreference, systemReduced, reduced, showFps, setShowFps }),
    [preference, setPreference, systemReduced, reduced, showFps, setShowFps],
  );
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion() {
  const settings = useContext(MotionContext);
  if (!settings) throw new Error("useMotion must be used inside <MotionProvider>");
  return settings;
}
