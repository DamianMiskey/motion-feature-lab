# Motion Feature Lab

A hands-on tour of **GSAP**, **Rive** and **Three.js**. Each page demos one technique live, explains it, and shows the code behind it. A sibling of the [Vercel Feature Lab](https://vercel.djmiskey.com) and the [Cloudflare Feature Lab](https://lab.djmiskey.com), built to the same pattern.

**Stack:** Next.js 16 (App Router, TypeScript, Cache Components) · Tailwind CSS v4 · GSAP 3 with `@gsap/react` · Rive (`@rive-app/react-canvas`) · Three.js with react-three-fiber and drei · live at **https://motion.djmiskey.com** (`motion-feature-lab.vercel.app` redirects there with a 308).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000 (copies the Rive runtime into public/ first)
```

Production build locally: `npm run build && npm start`.

## Checks

```bash
npm run lint
npm run typecheck
npm test           # Vitest: feature registry, robots.txt and sitemap, Rive colour conversion
npm run build
```

CI (`.github/workflows/ci.yml`) runs all four on every pull request.

## Layout

| Path | What lives there |
|------|------------------|
| `src/lib/features.ts` | Registry of all pages; drives the nav, the home page and the placeholder pages |
| `src/app/<slug>/page.tsx` | One folder per built page; demos are Client Components next to it |
| `src/app/[slug]/page.tsx` | Placeholder pages for later phases |
| `src/components/motion/` | `MotionProvider` (reduced motion, FPS setting), `useInView`, `FpsMeter`, `MotionControls` |
| `src/components/` | `FeaturePage`, `Demo`, `CodePeek`, `Nav`, and `ui.tsx` (`Button`, `Stage`, `cx`) |
| `src/app/globals.css` | Tailwind import, light/dark colour tokens mapped into `@theme`, element defaults |
| `public/rive/` | `.riv` files (see `CREDITS.md`) and the Rive runtime, copied in at build time |
| `next.config.ts` | Cache Components, security headers, CSP |

**Adding a page:** create `src/app/<slug>/page.tsx` using `FeaturePage`, then set `ready: true` in `features.ts`. Rive pages must be named `rive-*` (a test enforces it), because only those paths get WebAssembly in the CSP.

## Notes

- **Styling** is Tailwind CSS v4 (CSS-first: no `tailwind.config`, just `@import "tailwindcss"` and `@theme` in `globals.css`, plus `postcss.config.mjs`). Colour tokens are CSS variables switched by `prefers-color-scheme`, exposed as theme colours (`bg-surface`, `text-muted`, `border-line`, `bg-accent`…), so dark mode needs no `dark:` variants. Repeated pieces are small components in `ui.tsx` rather than global classes. Some class names in the demos (`box`, `scrub-bar`, `lines-demo`, `morph`…) aren't styling: they're the hooks GSAP selects.
- **Motion settings**: `MotionProvider` follows the system's `prefers-reduced-motion` by default; the sidebar can override it (Reduce / Full) and toggle an FPS meter, both remembered in `localStorage`. Demos read `useMotion().reduced` and swap large movement for fades and skip autoplay; they also pause off screen with `useInView` (Rive uses its own IntersectionObserver option, Three.js switches `frameloop` to `"demand"`). Plain CSS can use `[data-motion="reduce"]` on `<html>`.
- **GSAP** is free for all uses, including the formerly paid plugins (ScrollTrigger, SplitText, MorphSVG, DrawSVG, Flip), all in the `gsap` package. The only restriction is building a no-code animation tool that competes with Webflow. Animations live in `useGSAP()`, which scopes selectors and reverts everything on unmount.
- **GSAP plugins** are registered once in `src/lib/gsap.ts` (import from there, in Client Components only). Animations started from event handlers go through `contextSafe` so `useGSAP` cleans them up. **ScrollTrigger** demos reveal, scrub and pin (with `invalidateOnRefresh` so distances are re-measured on resize). **SplitText** (rewritten in 3.13) uses `mask: "lines"`, `autoSplit` with `onSplit` returning the animation (re-split on resize, same progress), and `aria: "auto"` so screen readers get the original sentence as an `aria-label` and the fragments are `aria-hidden`. **Flip** records positions with `getState()` before a React state change and runs `Flip.from()` after the new layout renders. With reduced motion: no splitting, no pinning or scrubbing, drawings complete, morphs and layout changes instant.
- **Rive**: the runtime is WebAssembly. Rive loads it from the jsDelivr CDN by default; `src/lib/rive-runtime.ts` points it at `/rive/rive.wasm` on this site and turns the CDN fallback off, and `scripts/copy-rive-wasm.mjs` copies the file from `node_modules` before `dev` and `build`. Only `rive-*` pages get `'wasm-unsafe-eval'` in their CSP. State machine *inputs* are deprecated in favour of **data binding**: `/rive-data-binding` binds a view model instance (`useViewModel` + `useViewModelInstance` with `autoBind: false`) and uses the typed hooks for strings, enums, colours (ARGB numbers; `src/lib/rive-color.ts` converts), numbers and triggers, both ways: it reads a colour the file computes and counts a trigger fired inside the file. `/rive-layouts` switches `fit`/`alignment` on the running instance (`rive.layout = …`, one narrow lint exemption). `Fit.Layout` resizes the artboard itself and that size sticks, so switching to another fit calls `resetArtboardSize()` and switching back calls `resizeDrawingSurfaceToCanvas()`. Files exported from Rive's free plan carry a Rive splash screen; the examples here are MIT-licensed files from Rive's own repositories.
- **Three.js** runs through react-three-fiber 9 (React 19). The scene uses `fallback` for browsers without WebGL, and `frameloop="demand"` when motion is reduced or the canvas is off screen.
- **Hosting**: Vercel project `motion-feature-lab` (team two-seats), connected to GitHub, so every PR gets a preview and `main` deploys to production. `motion.djmiskey.com` is a DNS-only `CNAME` in Cloudflare (proxy off). `app/robots.ts` and `app/sitemap.ts` (generated from the registry) point crawlers at the custom domain.
- **CSP**: everything loads from this site (`connect-src 'self'`): `.riv` files, models and textures go in `public/`. Script-src allows `'unsafe-inline'` because the pages are prerendered (see the Vercel lab's Security page for the nonce version).

## Roadmap

- [x] **Phase 1: Scaffold.** Registry, motion settings (reduced motion, off-screen pausing, FPS meter), one working page each: GSAP timelines, Rive playback, a Three.js scene
- [x] **Phase 2: GSAP.** ScrollTrigger (reveal, scrub, pin), SplitText (masked lines, characters, scroll-lit words), DrawSVG and MorphSVG, Flip (shuffle, filter, expand)
- [x] **Phase 3: Rive.** Data binding both ways (stocks dashboard), fit/alignment and `Fit.Layout` responsive artboards
- [ ] **Phase 4: Three.js.** glTF models and animations, materials and lighting, custom shaders
- [ ] **Phase 5: Together.** GSAP driving a 3D camera on scroll, Rive with Three.js
- [ ] **Phase 6: Performance.** Lazy loading heavy libraries, frame budgets, no-WebGL fallbacks
