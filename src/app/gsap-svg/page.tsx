import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { SvgDemos } from "./SvgDemos";

export default function GsapSvgPage() {
  return (
    <FeaturePage
      title="SVG: draw & morph"
      tagline="Draw lines as if by hand, and turn one shape into another."
      docs="https://gsap.com/docs/v3/Plugins/MorphSVGPlugin/"
      whatItIs={<p>
        <strong>DrawSVGPlugin</strong> animates how much of a stroke is visible, using the browser&apos;s dash properties under the
        hood, so any path can draw itself. <strong>MorphSVGPlugin</strong> morphs one path&apos;s shape into another, matching up
        their points even when the shapes have different numbers of them. Both used to be paid plugins; they&apos;re now in the
        free <code>gsap</code> package.
      </p>}
      whenToUse={[
        "Signatures, diagrams and route lines that draw in",
        "Icon transitions: play → pause, menu → close",
        "Playful logo and illustration moments",
      ]}
    >
      <Demo title="Lines and shapes">
        <SvgDemos />
      </Demo>

      <CodePeek file="app/gsap-svg/SvgDemos.tsx" />
    </FeaturePage>
  );
}
