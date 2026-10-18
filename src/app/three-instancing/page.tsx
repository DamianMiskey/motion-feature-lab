import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { InstancingScene } from "./lazy";

export default function ThreeInstancingPage() {
  return (
    <FeaturePage
      title="Instancing"
      tagline="Draw 50,000 objects in one go instead of one at a time."
      docs="https://threejs.org/docs/#api/en/objects/InstancedMesh"
      whatItIs={<p>
        Every mesh costs a <strong>draw call</strong>: the CPU telling the GPU &quot;draw this, with these settings&quot;. A few
        hundred are fine; thousands make the CPU the bottleneck long before the GPU breaks a sweat. An{" "}
        <strong>InstancedMesh</strong> draws many copies of one geometry and material in a <em>single</em> call, each copy with
        its own transform matrix and colour. The GPU is happy to draw millions of triangles; what it hates is being asked
        thousands of times.
      </p>}
      whenToUse={[
        "Particles, stars, debris, crowds of identical objects",
        "Forests, grass, buildings, tiles: anything repeated",
        "Data visualisations with thousands of points",
      ]}
    >
      <Demo title="One draw call against thousands">
        <InstancingScene />
      </Demo>

      <p className="text-sm text-muted">
        Switch to <strong>Separate meshes</strong> and the draw calls jump to one per cube on screen (Three.js skips cubes
        outside the camera&apos;s view: frustum culling), while the triangles stay the same. Turn on the FPS meter in the
        sidebar to feel the difference: 2,000 separate meshes can struggle on a laptop, while 50,000 instances usually
        don&apos;t. Separate meshes are capped at 2,000 here for that reason.
      </p>

      <CodePeek file="app/three-instancing/InstancingScene.tsx" />
    </FeaturePage>
  );
}
