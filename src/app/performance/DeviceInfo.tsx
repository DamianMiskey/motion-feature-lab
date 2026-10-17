"use client";

import { useSyncExternalStore } from "react";
import { useMotion } from "@/components/motion/MotionProvider";

// What the browser can tell us about this device, read once on the client.
const detect = () => {
  const canvas = document.createElement("canvas");
  const webgl2 = Boolean(canvas.getContext("webgl2"));
  return JSON.stringify({
    webgl: webgl2 ? "WebGL 2" : canvas.getContext("webgl") ? "WebGL 1 only" : "none",
    dpr: window.devicePixelRatio,
    cores: navigator.hardwareConcurrency ?? null,
    memory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null,
  });
};
let cached: string | null = null;
const read = () => (cached ??= detect());
const noop = () => () => {};

export function DeviceInfo() {
  const { reduced } = useMotion();
  const snapshot = useSyncExternalStore(noop, read, () => "");
  if (!snapshot) return <p className="text-sm text-muted">Checking this device…</p>;
  const info = JSON.parse(snapshot) as { webgl: string; dpr: number; cores: number | null; memory: number | null };
  const rows: [string, string, string][] = [
    ["3D graphics", info.webgl, info.webgl === "none" ? "3D demos show a text fallback instead of a canvas." : "3D demos render normally."],
    ["Pixel density", `${info.dpr}×`, info.dpr > 2 ? "Very dense screen: capping a canvas's pixel ratio at 2 saves GPU work you can't see." : "Canvases render at the screen's density."],
    ["CPU cores", info.cores ? String(info.cores) : "unknown", "Fewer cores means less headroom for JavaScript-driven animation."],
    ["Memory", info.memory ? `${info.memory} GB (rounded)` : "not reported", "Only some browsers report it; useful for skipping heavy scenes."],
    ["Reduced motion", reduced ? "on" : "off", reduced ? "Demos fade instead of moving and don't autoplay." : "Full animation."],
  ];
  return (
    <table className="block w-full overflow-x-auto text-sm [&_td]:border-b [&_td]:border-line [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top">
      <tbody>{rows.map(([k, v, note]) => <tr key={k}><td className="font-semibold">{k}</td><td className="tabular-nums">{v}</td><td className="text-muted">{note}</td></tr>)}</tbody>
    </table>
  );
}
