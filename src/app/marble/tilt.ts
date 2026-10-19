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

// ---- Phone tilt maths (pure, so it's unit-tested) ---------------------------

type Vec = [number, number, number];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const unit = (v: Vec): Vec => { const l = Math.hypot(...v) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Which way is "up", in screen coordinates (x right, y up the screen, z out
 * of it), from a deviceorientation reading. beta and gamma are Euler angles,
 * and Euler angles misbehave when the phone is held in landscape: gamma runs
 * into its ±90° limit and beta flips. The up direction they describe doesn't:
 * it's smooth however the phone is held. Then the screen's own rotation
 * (screen.orientation.angle) turns device axes into screen axes.
 */
export function upOnScreen(beta: number, gamma: number, screenAngle: number): Vec {
  const b = rad(beta), g = rad(gamma), a = rad(screenAngle);
  // World "up" seen from the device: the rotation is Z(alpha)·X(beta)·Y(gamma),
  // and alpha (compass heading) drops out.
  const ux = -Math.sin(g) * Math.cos(b), uy = Math.sin(b), uz = Math.cos(g) * Math.cos(b);
  // Rotated a degrees anticlockwise, screen-right is the device axis rotated by -a.
  return [ux * Math.cos(a) - uy * Math.sin(a), ux * Math.sin(a) + uy * Math.cos(a), uz];
}

/**
 * Tilt relative to a neutral pose (how the phone was held at "Play"): the
 * screen's right and up directions are flattened onto the neutral "level",
 * and the current up direction is measured along them. Same sensitivity
 * whether the phone is held flat or steeply.
 */
export function tiltFrom(up: Vec, neutral: Vec, rangeDeg = DEVICE_RANGE): Tilt {
  const n = unit(neutral);
  const along = (axis: Vec) => unit([axis[0] - dot(axis, n) * n[0], axis[1] - dot(axis, n) * n[1], axis[2] - dot(axis, n) * n[2]]);
  const right = along([1, 0, 0]);
  const upScreen = along([0, 1, 0]);
  const scale = Math.sin(rad(rangeDeg));
  // Right side down: "up" leans towards the screen's left. Far edge down: it
  // leans towards the bottom of the screen.
  return { x: clamp(-dot(up, right) / scale), y: clamp(-dot(up, upScreen) / scale) };
}

type OrientationEventWithPermission = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

export function useTilt(layer: RefObject<HTMLElement | null>, active: boolean) {
  const target = useRef<Tilt>({ x: 0, y: 0 });
  const keys = useRef(new Set<string>());
  const drag = useRef<{ x0: number; y0: number; tilt: Tilt } | null>(null);
  const device = useRef<{ neutral: Vec | null; tilt: Tilt } | null>(null);
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

  // Phone tilt. The first reading becomes "level", so the phone can be held at
  // any comfortable angle; turning the phone (portrait ↔ landscape) starts
  // a new "level", since the old one no longer means anything.
  useEffect(() => {
    if (!deviceOn) return;
    device.current = { neutral: null, tilt: { x: 0, y: 0 } };
    const screenAngle = () => screen.orientation?.angle ?? Number((window as { orientation?: number }).orientation ?? 0);
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null || !device.current) return;
      const d = device.current;
      const up = upOnScreen(e.beta, e.gamma, screenAngle());
      d.neutral ??= up;
      d.tilt = tiltFrom(up, d.neutral);
      update();
    };
    const onRotate = () => { if (device.current) device.current.neutral = null; };
    window.addEventListener("deviceorientation", onOrientation);
    screen.orientation?.addEventListener("change", onRotate);
    window.addEventListener("orientationchange", onRotate);
    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
      screen.orientation?.removeEventListener("change", onRotate);
      window.removeEventListener("orientationchange", onRotate);
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
