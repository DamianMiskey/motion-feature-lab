import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { PhysicsScene } from "./lazy";

export default function ThreePhysicsPage() {
  return (
    <FeaturePage
      title="Physics"
      tagline="Gravity, collisions and stacking, simulated by Rapier."
      docs="https://pmndrs.github.io/react-three-rapier/"
      whatItIs={<p>
        Three.js draws things; it doesn&apos;t know they&apos;re solid. A <strong>physics engine</strong> keeps a parallel,
        invisible world of <strong>rigid bodies</strong> and <strong>colliders</strong>, steps it forward 60 times a second
        (gravity, collisions, friction, bounce), and copies the results onto the meshes. <strong>Rapier</strong> is written in
        Rust and compiled to WebAssembly; <code>@react-three/rapier</code> lets each body be a component. Bodies are{" "}
        <strong>dynamic</strong> (pushed around), <strong>fixed</strong> (the floor) or <strong>kinematic</strong> (moved by
        code, pushing others, like the pointer ball here).
      </p>}
      whenToUse={[
        "Games and playful interactions",
        "Things that should tumble, stack and bounce believably",
        "Product configurators where parts drop into place",
      ]}
    >
      <Demo title="Knock it over">
        <PhysicsScene />
      </Demo>

      <p className="text-sm text-muted">
        Rapier&apos;s engine is WebAssembly embedded in its JavaScript (over 800 KB compressed, more than everything else on the page), so this page loads it only
        when the demo comes into view, and its Content Security Policy allows <code>&apos;wasm-unsafe-eval&apos;</code>, like the
        Rive pages. &quot;Show colliders&quot; draws the shapes the engine actually uses, which is how you debug a body that
        falls through the floor.
      </p>

      <CodePeek file="app/three-physics/PhysicsScene.tsx" />
    </FeaturePage>
  );
}
