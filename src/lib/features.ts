// Single source of truth for the dashboard: every technique in the lab,
// grouped by category. `ready: false` would mark an unbuilt page (bring back
// the src/app/[slug] placeholder route if you add one).
export type Category = "Foundations" | "GSAP" | "Rive" | "Three.js" | "Together" | "Performance" | "Capstone";

export type Feature = {
  slug: string;
  name: string;
  category: Category;
  summary: string;
  phase: number;
  ready: boolean;
};

export const features: Feature[] = [
  { slug: "motion", name: "Motion & accessibility", category: "Foundations", phase: 1, ready: true,
    summary: "Reduced motion, pausing off-screen, and an FPS meter for every demo." },

  { slug: "gsap-basics", name: "Tweens & timelines", category: "GSAP", phase: 1, ready: true,
    summary: "Animate anything, sequence it, and scrub through it." },
  { slug: "gsap-scroll", name: "ScrollTrigger", category: "GSAP", phase: 2, ready: true,
    summary: "Animations driven by scrolling: pinning, scrubbing, parallax." },
  { slug: "gsap-text", name: "SplitText", category: "GSAP", phase: 2, ready: true,
    summary: "Animate words, lines and characters, accessibly." },
  { slug: "gsap-svg", name: "SVG: draw & morph", category: "GSAP", phase: 2, ready: true,
    summary: "DrawSVG and MorphSVG: line drawing and shape morphing." },
  { slug: "gsap-flip", name: "Flip", category: "GSAP", phase: 2, ready: true,
    summary: "Smooth layout changes: reorder, filter, expand." },
  { slug: "gsap-draggable", name: "Draggable & Inertia", category: "GSAP", phase: 7, ready: true,
    summary: "Drag, throw and spin, landing on snap points." },
  { slug: "gsap-observer", name: "Observer", category: "GSAP", phase: 7, ready: true,
    summary: "One wheel, swipe or key press, one slide." },
  { slug: "gsap-motion-path", name: "MotionPath", category: "GSAP", phase: 7, ready: true,
    summary: "Move along SVG paths and curves through points." },
  { slug: "gsap-pointer", name: "Pointer effects", category: "GSAP", phase: 7, ready: true,
    summary: "Cursor trails, magnetic buttons and tilt cards." },

  { slug: "rive-basics", name: "Rive playback", category: "Rive", phase: 1, ready: true,
    summary: "Play .riv files, control playback, react to the pointer." },
  { slug: "rive-data-binding", name: "Data binding", category: "Rive", phase: 3, ready: true,
    summary: "Drive a Rive file from your app's data, and read values back." },
  { slug: "rive-layouts", name: "Layouts & responsive", category: "Rive", phase: 3, ready: true,
    summary: "Fit, alignment and artboards that resize with the page." },
  { slug: "rive-input", name: "Keyboard & text input", category: "Rive", phase: 7, ready: true,
    summary: "Focus, key listeners and text fields inside a Rive file." },

  { slug: "three-basics", name: "A first 3D scene", category: "Three.js", phase: 1, ready: true,
    summary: "Camera, lights, meshes and orbit controls with react-three-fiber." },
  { slug: "three-models", name: "Models", category: "Three.js", phase: 4, ready: true,
    summary: "Load glTF models, play their animations, frame them." },
  { slug: "three-materials", name: "Materials & lighting", category: "Three.js", phase: 4, ready: true,
    summary: "Physically based materials, environment lighting, shadows." },
  { slug: "three-shaders", name: "Shaders", category: "Three.js", phase: 4, ready: true,
    summary: "Write a custom GLSL shader and animate its uniforms." },
  { slug: "three-postprocessing", name: "Post-processing", category: "Three.js", phase: 8, ready: true,
    summary: "Bloom, depth of field and lens effects as a final pass." },
  { slug: "three-instancing", name: "Instancing", category: "Three.js", phase: 8, ready: true,
    summary: "50,000 objects in a single draw call." },
  { slug: "three-physics", name: "Physics", category: "Three.js", phase: 8, ready: true,
    summary: "Rapier rigid bodies: fall, stack, collide, get pushed." },
  { slug: "three-webgpu", name: "WebGPU & TSL", category: "Three.js", phase: 8, ready: true,
    summary: "The WebGPU renderer and shaders written in TSL." },

  { slug: "gsap-three", name: "GSAP × Three.js", category: "Together", phase: 5, ready: true,
    summary: "Scroll-driven camera moves through a 3D scene." },
  { slug: "rive-three", name: "Rive × Three.js", category: "Together", phase: 5, ready: true,
    summary: "A Rive interface layered over, or textured onto, a 3D scene." },

  { slug: "performance", name: "Performance", category: "Performance", phase: 6, ready: true,
    summary: "Lazy loading, frame budgets, and fallbacks without WebGL." },

  { slug: "game", name: "Tower Toppler", category: "Capstone", phase: 9, ready: true,
    summary: "A small physics game: Three.js, Rapier, GSAP and Rive together." },
  { slug: "marble", name: "Marble Maze", category: "Capstone", phase: 10, ready: true,
    summary: "Tilt the board, or your phone, to roll a marble through three mazes." },
  { slug: "stacker", name: "Stacker", category: "Capstone", phase: 11, ready: true,
    summary: "A one-button tower game: drop each slab exactly on the last." },
  { slug: "runner", name: "Starfield Runner", category: "Capstone", phase: 12, ready: true,
    summary: "Dodge asteroids in an endless field that keeps speeding up." },
];

export const categories = [...new Set(features.map((f) => f.category))];
export const getFeature = (slug: string) => features.find((f) => f.slug === slug);
