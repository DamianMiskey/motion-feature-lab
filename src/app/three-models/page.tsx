import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { FoxScene } from "./FoxScene";

export default function ThreeModelsPage() {
  return (
    <FeaturePage
      title="Models"
      tagline="Load a glTF model, play its animations, and frame it."
      docs="https://drei.docs.pmnd.rs/loaders/gltf-use-gltf"
      whatItIs={<p>
        <strong>glTF</strong> (<code>.glb</code> for the single-file version) is the standard format for 3D on the web: meshes,
        materials, textures, skeletons and animations in one file. drei&apos;s <code>useGLTF</code> loads and caches it inside a{" "}
        <code>&lt;Suspense&gt;</code> boundary, <code>useAnimations</code> turns its clips into actions you can play and
        cross-fade, and <code>&lt;Center&gt;</code> and <code>&lt;ContactShadows&gt;</code> place it neatly on the ground.
      </p>}
      whenToUse={[
        "Product viewers and configurators",
        "Characters and mascots",
        "Anything modelled in Blender or another 3D tool",
      ]}
    >
      <Demo title="An animated fox">
        <FoxScene />
        <p className="text-sm text-muted">
          Model: Fox from the Khronos glTF sample assets, © 2014 tomkranis, glTF conversion © 2017 @AsoboStudio and @scurest,
          licensed <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. It weighs 160 KB.
        </p>
      </Demo>

      <CodePeek file="app/three-models/FoxScene.tsx" />
    </FeaturePage>
  );
}
