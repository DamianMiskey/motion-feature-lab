import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { ShaderScene } from "./ShaderScene";

export default function ThreeShadersPage() {
  return (
    <FeaturePage
      title="Shaders"
      tagline="Write the GPU programs yourself: move vertices and colour pixels with GLSL."
      docs="https://threejs.org/docs/#api/en/materials/ShaderMaterial"
      whatItIs={<p>
        Every material is really a pair of small programs that run on the graphics card. With a <code>ShaderMaterial</code> you
        write them yourself in <strong>GLSL</strong>: the <strong>vertex shader</strong> positions each vertex, the{" "}
        <strong>fragment shader</strong> colours each pixel, and <strong>uniforms</strong> carry values in from JavaScript, such as
        the time, the sliders below, or the scroll position. drei&apos;s <code>shaderMaterial()</code> turns that into a JSX element
        with typed props.
      </p>}
      whenToUse={[
        "Effects no built-in material can do: waves, dissolves, noise",
        "Animating thousands of points cheaply on the GPU",
        "Backgrounds and hero visuals that react to input",
      ]}
    >
      <Demo title="A wave surface driven by uniforms">
        <ShaderScene />
        <p className="text-sm text-muted">Each frame JavaScript only updates <code>uTime</code>; the roughly 26,000 vertices are moved on the GPU.</p>
      </Demo>

      <CodePeek file="app/three-shaders/waveMaterial.ts" />
      <CodePeek file="app/three-shaders/ShaderScene.tsx" />
    </FeaturePage>
  );
}
