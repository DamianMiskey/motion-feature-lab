// Rive stores colours as one 32-bit ARGB number (0xAARRGGBB); HTML colour
// inputs use "#rrggbb". These convert between the two.

export function argbToHex(argb: number) {
  return `#${((argb >>> 0) & 0xffffff).toString(16).padStart(6, "0")}`;
}

export function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`Not a #rrggbb colour: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
