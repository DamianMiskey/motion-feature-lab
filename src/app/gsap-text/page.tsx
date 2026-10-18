import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { TextDemos } from "./TextDemos";

export default function GsapTextPage() {
  return (
    <FeaturePage
      title="SplitText"
      tagline="Animate text by line, word or character, without breaking it for screen readers."
      docs="https://gsap.com/docs/v3/Plugins/SplitText/"
      whatItIs={<p>
        <strong>SplitText</strong> wraps each line, word or character of an element in its own <code>&lt;div&gt;</code>, ready to
        animate. Since its 2025 rewrite it can <strong>mask</strong> lines (so they slide in from behind an edge),{" "}
        <strong>re-split automatically</strong> when the layout changes (<code>autoSplit</code>), and keep text accessible:{" "}
        <code>aria: &quot;auto&quot;</code> gives a heading an <code>aria-label</code> with the original text and hides the
        fragments. Paragraphs may not carry a label, so here each one has a visually hidden copy for screen readers and the
        animated version is <code>aria-hidden</code>.
      </p>}
      whenToUse={[
        "Headlines and hero copy",
        "Scroll-driven reading effects",
        "Short, playful labels (not body text)",
      ]}
    >
      <Demo title="Three ways to split">
        <TextDemos />
      </Demo>

      <CodePeek file="app/gsap-text/TextDemos.tsx" />
    </FeaturePage>
  );
}
