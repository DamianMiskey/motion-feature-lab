"use client";

import { type RefObject, useCallback, useEffect, useState } from "react";

export type FullscreenMode = "off" | "native" | "takeover";

/**
 * Full screen for one element. Where the browser supports the Fullscreen API
 * for ordinary elements (desktop, Android, iPad) it's the real thing. iPhone
 * Safari only allows it for video, so there the element "takes over" instead:
 * fixed over the whole viewport, with the page behind it unable to scroll.
 * Escape leaves either way.
 */
export function useFullscreen(ref: RefObject<HTMLElement | null>) {
  const [mode, setMode] = useState<FullscreenMode>("off");

  const exit = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    setMode("off");
  }, []);

  const enter = useCallback(async () => {
    const el = ref.current;
    if (!el) return;
    if (document.fullscreenEnabled && el.requestFullscreen) {
      try {
        await el.requestFullscreen({ navigationUI: "hide" });
        setMode("native");
        return;
      } catch { /* refused (e.g. not from a user gesture): take over instead */ }
    }
    setMode("takeover");
  }, [ref]);

  const toggle = useCallback(() => (mode === "off" ? void enter() : exit()), [mode, enter, exit]);

  // Native full screen can end without us (Escape, the browser's own UI): follow it.
  useEffect(() => {
    const sync = () => { if (!document.fullscreenElement) setMode((m) => (m === "native" ? "off" : m)); };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  // Takeover: no page scrolling behind the game, and Escape leaves.
  useEffect(() => {
    if (mode !== "takeover") return;
    const { overflow } = document.documentElement.style;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMode("off"); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mode]);

  return { mode, active: mode !== "off", toggle };
}
