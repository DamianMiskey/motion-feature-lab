// Single source of truth for the dashboard: every technique in the lab,
// grouped by category. `ready: false` marks pages from later phases.
export type Category = "Foundations" | "GSAP" | "Rive" | "Three.js" | "Together" | "Performance";

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

  { slug: "rive-basics", name: "Rive playback", category: "Rive", phase: 1, ready: true,
    summary: "Play .riv files, control playback, react to the pointer." },
  { slug: "rive-data-binding", name: "Data binding", category: "Rive", phase: 3, ready: true,
    summary: "Drive a Rive file from your app's data, and read values back." },
  { slug: "rive-layouts", name: "Layouts & responsive", category: "Rive", phase: 3, ready: true,
    summary: "Fit, alignment and artboards that resize with the page." },

  { slug: "three-basics", name: "A first 3D scene", category: "Three.js", phase: 1, ready: true,
    summary: "Camera, lights, meshes and orbit controls with react-three-fiber." },
  { slug: "three-models", name: "Models", category: "Three.js", phase: 4, ready: true,
    summary: "Load glTF models, play their animations, frame them." },
  { slug: "three-materials", name: "Materials & lighting", category: "Three.js", phase: 4, ready: true,
    summary: "Physically based materials, environment lighting, shadows." },
  { slug: "three-shaders", name: "Shaders", category: "Three.js", phase: 4, ready: true,
    summary: "Write a custom GLSL shader and animate its uniforms." },

  { slug: "gsap-three", name: "GSAP × Three.js", category: "Together", phase: 5, ready: false,
    summary: "Scroll-driven camera moves through a 3D scene." },
  { slug: "rive-three", name: "Rive × Three.js", category: "Together", phase: 5, ready: false,
    summary: "A Rive interface layered over, or textured onto, a 3D scene." },

  { slug: "performance", name: "Performance", category: "Performance", phase: 6, ready: false,
    summary: "Lazy loading, frame budgets, and fallbacks without WebGL." },
];

export const categories = [...new Set(features.map((f) => f.category))];
export const getFeature = (slug: string) => features.find((f) => f.slug === slug);
