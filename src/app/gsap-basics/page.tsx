import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { TimelineDemo } from "./TimelineDemo";

export default function GsapBasicsPage() {
  return (
    <FeaturePage
      title="Tweens & timelines"
      tagline="GSAP animates any property of anything, and sequences it on a timeline you can control like a video."
      docs="https://gsap.com/docs/v3/GSAP/Timeline"
      whatItIs={<p>
        A <strong>tween</strong> (<code>gsap.to()</code>, <code>from()</code>, <code>fromTo()</code>) animates properties from one
        value to another: positions, colours, SVG attributes, even plain JavaScript numbers. A <strong>timeline</strong> chains
        tweens, with the position parameter (<code>&quot;&lt;0.15&quot;</code>, <code>&quot;-=0.3&quot;</code>) controlling
        overlaps, and can be played, paused, reversed or scrubbed as one unit. In React, <code>useGSAP()</code> from{" "}
        <code>@gsap/react</code> scopes selectors to the component and cleans everything up when it unmounts.
      </p>}
      whenToUse={[
        "Intro and transition sequences with precise timing",
        "Anything that should be scrubbable or reversible",
        "Animating SVG, canvas or 3D values, not just CSS",
      ]}
    >
      <Demo title="A timeline you can scrub">
        <p>Three tweens, staggered with the position parameter, then a colour change that overlaps the end. Try different eases.</p>
        <TimelineDemo />
      </Demo>

      <CodePeek file="app/gsap-basics/TimelineDemo.tsx" />
    </FeaturePage>
  );
}
