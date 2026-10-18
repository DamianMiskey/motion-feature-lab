// Pages that run WebAssembly and so need 'wasm-unsafe-eval' in their Content
// Security Policy: every Rive page (rive-*) and the pages using the Rapier
// physics engine (including the game). Used by next.config.ts as a path pattern; tests check it.
export const WASM_PAGES = "rive-.*|three-physics|game";

export const needsWasm = (slug: string) => new RegExp(`^(${WASM_PAGES})$`).test(slug);
