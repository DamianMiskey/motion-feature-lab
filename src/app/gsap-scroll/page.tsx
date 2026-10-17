import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { ScrollDemos } from "./ScrollDemos";

export default function GsapScrollPage() {
  return (
    <FeaturePage
      title="ScrollTrigger"
      tagline="Tie animations to the scroll position: reveal, scrub and pin."
      docs="https://gsap.com/docs/v3/Plugins/ScrollTrigger/"
      whatItIs={<p>
        <strong>ScrollTrigger</strong> connects a GSAP animation to scrolling. <code>start</code> and <code>end</code> say where
        (&quot;top 85%&quot;: when the element&apos;s top reaches 85% down the viewport). <code>toggleActions</code> plays an
        animation when it&apos;s reached; <code>scrub</code> makes its progress follow the scrollbar; <code>pin</code> holds an
        element in place while you scroll past. Turn on the markers below to see the start and end lines.
      </p>}
      whenToUse={[
        "Reveal content as it scrolls into view",
        "Storytelling pages and product tours",
        "Progress indicators and parallax",
      ]}
    >
      <Demo title="Scroll down through the demos">
        <ScrollDemos />
      </Demo>

      <CodePeek file="app/gsap-scroll/ScrollDemos.tsx" />
      <CodePeek file="lib/gsap.ts" />
    </FeaturePage>
  );
}
