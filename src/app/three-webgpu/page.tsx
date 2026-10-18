import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { TslScene } from "./lazy";

export default function ThreeWebgpuPage() {
  return (
    <FeaturePage
      title="WebGPU & TSL"
      tagline="Three.js's next renderer, and shaders written in JavaScript instead of GLSL strings."
      docs="https://threejs.org/docs/#manual/en/introduction/WebGPU"
      whatItIs={<p>
        <strong>WebGPU</strong> is the successor to WebGL: a modern GPU API with less overhead and compute shaders.
        Three.js&apos;s <code>WebGPURenderer</code> uses it where available and falls back to WebGL 2 automatically.
        Materials for it are written in <strong>TSL</strong>, the Three Shading Language: you build the shader from JavaScript
        functions (<code>positionLocal.add(…)</code>, <code>mix(…)</code>, <code>mx_noise_float(…)</code>), and Three.js
        compiles that graph to WGSL or GLSL as needed. Compare it with the hand-written GLSL on the{" "}
        <a href="/three-shaders">Shaders</a> page: same idea, no strings.
      </p>}
      whenToUse={[
        "New projects that want to be ready for WebGPU",
        "Custom materials without maintaining GLSL by hand",
        "Heavy scenes and compute effects (particles, simulations)",
      ]}
    >
      <Demo title="A noise-displaced blob in TSL">
        <TslScene />
      </Demo>

      <p className="text-sm text-muted">
        The renderer is created by a factory passed to react-three-fiber&apos;s <code>gl</code> prop, because{" "}
        <code>WebGPURenderer</code> has to <code>await init()</code> before its first frame. Its code lives in{" "}
        <code>three/webgpu</code> and <code>three/tsl</code>, a separate build that only this page downloads. Not everything
        made for the WebGL renderer works with it yet: the post-processing library on the previous page, for example, is
        WebGL-only (WebGPU has its own node-based post-processing).
      </p>

      <CodePeek file="app/three-webgpu/TslScene.tsx" />
    </FeaturePage>
  );
}
