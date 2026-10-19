"use client";

import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

// Where the player wants the board tilted, as x (left −1 … right +1) and
// y (towards you −1 … away +1). Three sources, in order of priority:
// - the phone itself (DeviceOrientation), once the player turns it on
// - the arrow keys or WASD, while the game has keyboard focus
// - dragging on the board, like a joystick (mouse, finger or pen)

export type Tilt = { x: number; y: number };
const clamp = (v: number) => Math.max(-1, Math.min(1, v));
const DRAG_RANGE = 110; // px of drag for a full tilt
const DEVICE_RANGE = 22; // degrees of phone tilt for a full tilt

type OrientationEventWithPermission = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

export function useTilt(layer: RefObject<HTMLElement | null>, active: boolean) {
  const target = useRef<Tilt>({ x: 0, y: 0 });
  const keys = useRef(new Set<string>());
  const drag = useRef<{ x0: number; y0: number; tilt: Tilt } | null>(null);
  const device = useRef<{ neutral: { beta: number; gamma: number } | null; tilt: Tilt } | null>(null);
  const [deviceOn, setDeviceOn] = useState(false);

  const update = useCallback(() => {
    if (device.current) { target.current = device.current.tilt; return; }
    const k = keys.current;
    const kx = (k.has("ArrowRight") || k.has("d") ? 1 : 0) - (k.has("ArrowLeft") || k.has("a") ? 1 : 0);
    const ky = (k.has("ArrowUp") || k.has("w") ? 1 : 0) - (k.has("ArrowDown") || k.has("s") ? 1 : 0);
    target.current = kx || ky ? { x: kx, y: ky } : drag.current?.tilt ?? { x: 0, y: 0 };
  }, []);

  useEffect(() => {
    const el = layer.current;
    if (!el || !active) return;
    const KEYS = new Set(["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "w", "a", "s", "d"]);
    const down = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (!KEYS.has(key)) return;
      e.preventDefault(); // arrows would scroll the page
      keys.current.add(key);
      update();
    };
    const up = (e: KeyboardEvent) => { keys.current.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key); update(); };
    const blur = () => { keys.current.clear(); update(); };
    const press = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      drag.current = { x0: e.clientX, y0: e.clientY, tilt: { x: 0, y: 0 } };
    };
    const move = (e: PointerEvent) => {
      if (!drag.current) return;
      drag.current.tilt = { x: clamp((e.clientX - drag.current.x0) / DRAG_RANGE), y: clamp(-(e.clientY - drag.current.y0) / DRAG_RANGE) };
      update();
    };
    const release = () => { drag.current = null; update(); };
    el.addEventListener("keydown", down);
    el.addEventListener("keyup", up);
    el.addEventListener("blur", blur);
    el.addEventListener("pointerdown", press);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    return () => {
      el.removeEventListener("keydown", down);
      el.removeEventListener("keyup", up);
      el.removeEventListener("blur", blur);
      el.removeEventListener("pointerdown", press);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", release);
      el.removeEventListener("pointercancel", release);
      blur();
    };
  }, [layer, active, update]);

  // Phone tilt. beta is front-to-back and gamma left-to-right, relative to
  // the screen's natural orientation, so in landscape the two swap. The first
  // reading becomes "level", so the phone can be held at any comfortable angle.
  useEffect(() => {
    if (!deviceOn) return;
    device.current = { neutral: null, tilt: { x: 0, y: 0 } };
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null || !device.current) return;
      const d = device.current;
      d.neutral ??= { beta: e.beta, gamma: e.gamma };
      const db = e.beta - d.neutral.beta;
      const dg = e.gamma - d.neutral.gamma;
      const angle = screen.orientation?.angle ?? 0;
      const [x, y] = angle === 90 ? [db, dg] : angle === 270 || angle === -90 ? [-db, -dg] : angle === 180 ? [-dg, db] : [dg, -db];
      d.tilt = { x: clamp(x / DEVICE_RANGE), y: clamp(y / DEVICE_RANGE) };
      update();
    };
    window.addEventListener("deviceorientation", onOrientation);
    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
      device.current = null;
      update();
    };
  }, [deviceOn, update]);

  /** Must run inside a tap: iOS only asks for permission in response to one. */
  const enableDevice = useCallback(async () => {
    const DOE = (typeof DeviceOrientationEvent !== "undefined" ? DeviceOrientationEvent : undefined) as OrientationEventWithPermission | undefined;
    if (!DOE) return false;
    if (DOE.requestPermission && (await DOE.requestPermission()) !== "granted") return false;
    setDeviceOn(true);
    return true;
  }, []);

  const recalibrate = useCallback(() => { if (device.current) device.current.neutral = null; }, []);
  const disableDevice = useCallback(() => setDeviceOn(false), []);

  return { target, deviceOn, enableDevice, disableDevice, recalibrate };
}
