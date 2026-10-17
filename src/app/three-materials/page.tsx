import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { MaterialsScene } from "./MaterialsScene";

export default function ThreeMaterialsPage() {
  return (
    <FeaturePage
      title="Materials & lighting"
      tagline="Physically based materials, environment lighting and shadows."
      docs="https://threejs.org/docs/#api/en/materials/MeshPhysicalMaterial"
      whatItIs={<p>
        Three.js renders with <strong>physically based materials</strong>: <code>MeshStandardMaterial</code> takes a colour, a{" "}
        <strong>roughness</strong> (sharp to blurry reflections) and a <strong>metalness</strong>; <code>MeshPhysicalMaterial</code>{" "}
        adds layers such as <strong>clearcoat</strong> and <strong>transmission</strong> (glass). They look right only when
        there&apos;s something to reflect, which is what <strong>environment lighting</strong> provides. Real-time{" "}
        <strong>shadows</strong> come from lights with <code>castShadow</code> and meshes that cast or receive them.
      </p>}
      whenToUse={[
        "Product renders: metal, plastic, glass, paint",
        "Making simple shapes look premium",
        "Lighting a scene without baking textures",
      ]}
    >
      <Demo title="Metal, paint and glass">
        <MaterialsScene />
      </Demo>

      <CodePeek file="app/three-materials/MaterialsScene.tsx" />
    </FeaturePage>
  );
}
