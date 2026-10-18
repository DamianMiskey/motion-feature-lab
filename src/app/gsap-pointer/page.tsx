import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { PointerDemos } from "./PointerDemos";

export default function GsapPointerPage() {
  return (
    <FeaturePage
      title="Pointer effects"
      tagline="Cursor trails, magnetic buttons and tilt cards, done cheaply and only where they belong."
      docs="https://gsap.com/docs/v3/GSAP/gsap.quickTo()/"
      whatItIs={<p>
        Effects that follow the pointer fire on every <code>pointermove</code>, often more than 60 times a second.{" "}
        <code>gsap.quickTo()</code> creates one tween per property up front and retargets it on each move, so the element eases
        toward the pointer without a new animation being built each time. <code>gsap.matchMedia()</code> then decides where
        they run: only with a precise, hovering pointer, and it reverts all of them when that changes.
      </p>}
      whenToUse={[
        "Custom cursors on portfolio and marketing pages",
        "Calls to action that respond before the click",
        "Cards and product shots with a sense of depth",
      ]}
    >
      <Demo title="Follow, attract, tilt">
        <PointerDemos />
      </Demo>

      <p className="text-sm text-muted">
        Restraint helps here: the real cursor stays visible everywhere except the first demo, the buttons are ordinary{" "}
        <code>&lt;button&gt;</code>s that work with a keyboard, and nothing depends on the effect to be usable.
      </p>

      <CodePeek file="app/gsap-pointer/PointerDemos.tsx" />
    </FeaturePage>
  );
}
