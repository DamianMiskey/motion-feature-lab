import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { PathDemos } from "./lazy";

export default function GsapMotionPathPage() {
  return (
    <FeaturePage
      title="MotionPath"
      tagline="Move anything along a curve, and keep it facing the way it's going."
      docs="https://gsap.com/docs/v3/Plugins/MotionPathPlugin/"
      whatItIs={<p>
        <strong>MotionPathPlugin</strong> animates an element along a path: an SVG <code>&lt;path&gt;</code> on the page, a path
        string, or simply a list of points that GSAP joins into a smooth curve. <code>align</code> lines the element up with an
        SVG path wherever both sit, <code>autoRotate</code> turns it to face its direction of travel, and like any tween it can
        go on a timeline or be scrubbed by ScrollTrigger.
      </p>}
      whenToUse={[
        "A route or journey drawn on a map or illustration",
        "Objects that swoop and arc instead of sliding in straight lines",
        "Scroll stories where something travels down the page",
      ]}
    >
      <Demo title="Paths and points">
        <PathDemos />
      </Demo>

      <CodePeek file="app/gsap-motion-path/PathDemos.tsx" />
    </FeaturePage>
  );
}
