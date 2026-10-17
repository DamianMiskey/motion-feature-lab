"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";

export type ScreenPoint = { x: number; y: number; visible: boolean };

// Tracks a point in the 3D scene on screen: every frame it projects the
// point to pixel coordinates within the canvas and reports them. The owner of
// a DOM overlay uses that to move it (through a ref: no React re-render).
export function Anchor({ position, onMove }: { position: [number, number, number]; onMove: (p: ScreenPoint) => void }) {
  const point = useRef(new Vector3());
  useFrame(({ camera, size }) => {
    const p = point.current.set(...position).project(camera); // -1…1 in both axes
    onMove({ x: ((p.x + 1) / 2) * size.width, y: ((1 - p.y) / 2) * size.height, visible: p.z <= 1 });
  });
  return null;
}
