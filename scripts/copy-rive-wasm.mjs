// Copies the Rive runtime (WebAssembly) from node_modules into public/, so the
// browser loads it from this site instead of the jsDelivr CDN Rive uses by
// default. Runs before `next dev` and `next build` (see package.json).
import { copyFile, mkdir } from "node:fs/promises";

await mkdir(new URL("../public/rive/", import.meta.url), { recursive: true });
await copyFile(new URL("../node_modules/@rive-app/canvas/rive.wasm", import.meta.url), new URL("../public/rive/rive.wasm", import.meta.url));
console.log("✓ public/rive/rive.wasm");
