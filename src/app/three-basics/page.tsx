import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { Scene } from "./Scene";

export default function ThreeBasicsPage() {
  return (
    <FeaturePage
      title="A first 3D scene"
      tagline="Camera, lights, meshes and controls, written as React components with react-three-fiber."
      docs="https://r3f.docs.pmnd.rs/getting-started/introduction"
      whatItIs={<p>
        <strong>Three.js</strong> draws 3D with WebGL: a <strong>scene</strong> of meshes (geometry + material), lit by{" "}
        <strong>lights</strong> and seen through a <strong>camera</strong>. <strong>react-three-fiber</strong> lets you write that
        scene as JSX (<code>&lt;mesh&gt;</code>, <code>&lt;directionalLight&gt;</code>) and runs your code every frame with{" "}
        <code>useFrame</code>. <strong>drei</strong> adds ready-made pieces such as <code>&lt;OrbitControls&gt;</code>.
      </p>}
      whenToUse={[
        "Product viewers and configurators",
        "Data visualisation in 3D",
        "Hero scenes and interactive backgrounds",
      ]}
    >
      <Demo title="Drag to orbit, scroll to zoom">
        <Scene />
        <p className="text-sm text-muted">
          With motion reduced or the scene off screen, it stops spinning and only redraws when you move the camera
          (<code>frameloop=&quot;demand&quot;</code>, set by the shared <code>ThreeCanvas</code>). Turn on <strong>Show FPS</strong> in the sidebar to see the difference.
        </p>
      </Demo>

      <CodePeek file="app/three-basics/Scene.tsx" />
      <CodePeek file="components/three/ThreeCanvas.tsx" />
    </FeaturePage>
  );
}
