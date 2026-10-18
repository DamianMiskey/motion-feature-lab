import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { PostScene } from "./lazy";

export default function ThreePostprocessingPage() {
  return (
    <FeaturePage
      title="Post-processing"
      tagline="Bloom, depth of field and lens effects: the finishing pass that makes a scene look shot, not rendered."
      docs="https://react-postprocessing.docs.pmnd.rs/"
      whatItIs={<p>
        Normally Three.js draws straight to the screen. With <strong>post-processing</strong> it draws into an image first, then
        runs full-screen shader passes over it, like filters on a photo. <strong>Bloom</strong> makes very bright pixels glow,{" "}
        <strong>depth of field</strong> blurs what&apos;s out of focus using the depth buffer, and <strong>chromatic
        aberration</strong>, <strong>vignette</strong> and <strong>grain</strong> imitate a real lens and film.{" "}
        <code>@react-three/postprocessing</code> wraps the <code>postprocessing</code> library, which merges compatible effects
        into a single pass.
      </p>}
      whenToUse={[
        "Neon, sci-fi and night scenes (bloom)",
        "Drawing the eye to one object (depth of field)",
        "A cinematic finish on product shots and hero scenes",
      ]}
    >
      <Demo title="Toggle the effects">
        <PostScene />
      </Demo>

      <p className="text-sm text-muted">
        Only the rings glow because their emissive colour is pushed past 1.0 (<code>emissiveIntensity={"{4}"}</code>,{" "}
        <code>toneMapped={"{false}"}</code>) and Bloom&apos;s <code>luminanceThreshold</code> is 1. Each effect costs a little
        GPU time per pixel, so on a large screen it&apos;s worth turning off what the scene doesn&apos;t need: watch the FPS meter
        (sidebar) as you toggle.
      </p>

      <CodePeek file="app/three-postprocessing/PostScene.tsx" />
    </FeaturePage>
  );
}
