import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { MotionDemo } from "./MotionDemo";

export default function MotionPage() {
  return (
    <FeaturePage
      title="Motion & accessibility"
      tagline="The rules every demo here follows: respect reduced motion, and don't animate what nobody can see."
      docs="https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion"
      whatItIs={<p>
        Some people get dizzy or nauseous from on-screen motion, so operating systems offer a <strong>reduce motion</strong>{" "}
        setting, which websites read as <code>prefers-reduced-motion</code>. This lab follows it by default, and the sidebar lets
        you override it. In reduced mode demos swap big movement for fades and don&apos;t start by themselves. Every demo also{" "}
        <strong>pauses when it scrolls off screen</strong>, and the <strong>FPS meter</strong> shows whether animations keep up
        with your screen&apos;s refresh rate.
      </p>}
      whenToUse={[
        "Always: reduced motion is an accessibility requirement (WCAG 2.3.3)",
        "Pausing off-screen work saves battery on every page with animation",
        "The FPS meter: spotting the demos that are too heavy for a device",
      ]}
    >
      <Demo title="1. One animation, two modes">
        <p>Switch <strong>Animation</strong> in the sidebar between Reduce and Full and watch the box change behaviour.</p>
        <MotionDemo />
      </Demo>

      <Demo title="2. How the setting reaches every demo">
        <ol>
          <li><code>MotionProvider</code> (in the root layout) reads the system setting with <code>matchMedia</code> and your override from <code>localStorage</code>.</li>
          <li>Demos call <code>useMotion()</code> and get <code>reduced: true | false</code>.</li>
          <li>Plain CSS can follow it too: the provider sets <code>data-motion=&quot;reduce&quot;</code> on <code>&lt;html&gt;</code>.</li>
        </ol>
      </Demo>

      <CodePeek file="app/motion/MotionDemo.tsx" />
      <CodePeek file="components/motion/MotionProvider.tsx" />
      <CodePeek file="components/motion/useInView.ts" />
    </FeaturePage>
  );
}
