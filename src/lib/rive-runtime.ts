import { RuntimeLoader } from "@rive-app/react-canvas";

// Load Rive's WebAssembly runtime from this site (public/rive/rive.wasm,
// copied there by scripts/copy-rive-wasm.mjs) instead of the jsDelivr CDN
// Rive uses by default, and turn the CDN fallback off. Import this module
// before any Rive component renders.
RuntimeLoader.setWasmUrl("/rive/rive.wasm");
RuntimeLoader.setWasmFallbackUrl(null);
