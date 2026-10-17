import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { DeviceInfo } from "./DeviceInfo";
import { Downloads } from "./Downloads";
import { FrameBudget } from "./FrameBudget";

// Measured with headless Edge on the production build (compressed JavaScript
// downloaded on first load, including Next.js prefetching of linked pages).
const MEASURED = [
  ["Home page", "598 KB", "227 KB"],
  ["A GSAP page", "598 KB", "227 KB"],
  ["A Rive page", "598 KB", "292 KB + Rive runtime (WASM)"],
  ["A Three.js page", "598 KB", "470–540 KB"],
];

export default function PerformancePage() {
  return (
    <FeaturePage
      title="Performance"
      tagline="Download only what a page uses, animate only what the GPU can move cheaply, and adapt to the device."
      docs="https://web.dev/articles/animations-guide"
      whatItIs={<p>
        Three things decide whether motion feels smooth. <strong>Bytes</strong>: Three.js and Rive are large, so this lab loads
        them with <code>next/dynamic</code> only when a demo nears the screen. <strong>Frame budget</strong>: at 60 frames a second
        each frame has about 16 ms; animating <code>transform</code> and <code>opacity</code> stays on the GPU, while layout
        properties make the browser recalculate the page every frame. <strong>The device</strong>: no WebGL, dense screens, few
        cores, or a preference for reduced motion all call for less.
      </p>}
      whenToUse={[
        "Lazy-load any library a page doesn't need on first paint",
        "Animate transform and opacity; avoid width, height, top, left",
        "Pause what's off screen; respect reduced motion",
      ]}
    >
      <Demo title="1. What lazy loading saved">
        <p>Before this phase, every page in the lab downloaded Three.js and Rive, because Next.js prefetches the code of every page linked in the sidebar and those pages imported them directly. Now each heavy demo is a separate chunk, loaded when it nears the viewport.</p>
        <table className="mb-3 block w-full overflow-x-auto text-sm [&_td]:border-b [&_td]:border-line [&_td]:px-2 [&_td]:py-1.5 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:text-xs [&_th]:text-muted [&_th]:uppercase">
          <thead><tr><th>Page</th><th>Before</th><th>After</th></tr></thead>
          <tbody>{MEASURED.map(([page, before, after]) => <tr key={page}><td>{page}</td><td className="tabular-nums">{before}</td><td className="tabular-nums">{after}</td></tr>)}</tbody>
        </table>
        <p className="text-sm text-muted">What remains everywhere: about 140 KB of Next.js and React, and 79 KB of GSAP. GSAP stays eager on purpose: it&apos;s small, and lazy-loading it would make animations start late on the pages built around them.</p>
      </Demo>

      <Demo title="2. Watch it happen on this page">
        <Downloads />
      </Demo>

      <Demo title="3. The frame budget: transform vs layout">
        <FrameBudget />
        <p className="text-sm text-muted">On a fast machine both may hold 60 fps; on a phone, or with many more dots, the layout version drops first. Turn on <strong>Show FPS</strong> for the whole page.</p>
      </Demo>

      <Demo title="4. This device">
        <DeviceInfo />
      </Demo>

      <CodePeek file="components/Deferred.tsx" />
      <CodePeek file="app/three-basics/lazy.tsx" />
      <CodePeek file="app/performance/FrameBudget.tsx" />
    </FeaturePage>
  );
}
