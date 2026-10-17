import { describe, expect, it } from "vitest";
import { argbToHex, hexToRgb } from "@/lib/rive-color";

describe("Rive colours", () => {
  it("turns ARGB numbers into #rrggbb, ignoring alpha", () => {
    expect(argbToHex(0xffc0ffee)).toBe("#c0ffee");
    expect(argbToHex(0x80000000)).toBe("#000000");
    expect(argbToHex(-1)).toBe("#ffffff"); // negative: a signed 32-bit int with every bit set
  });

  it("parses #rrggbb into channels", () => {
    expect(hexToRgb("#c0ffee")).toEqual([0xc0, 0xff, 0xee]);
    expect(() => hexToRgb("red")).toThrow();
  });
});
