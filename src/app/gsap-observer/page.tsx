import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { ObserverGallery } from "./lazy";

export default function GsapObserverPage() {
  return (
    <FeaturePage
      title="Observer"
      tagline="One gesture, one step: wheel, swipe and drag turned into intent."
      docs="https://gsap.com/docs/v3/Plugins/Observer/"
      whatItIs={<p>
        <strong>Observer</strong> listens to wheel, touch and pointer events and reports what the visitor meant: up, down, left
        or right, with a velocity. It doesn&apos;t scroll anything itself. That makes it the tool for &quot;one slide per
        gesture&quot; sections, where ScrollTrigger (which follows the scrollbar) would let a fast swipe fly past several slides.
        Here a mouse wheel or trackpad moves the gallery vertically, a drag or swipe moves it sideways, and the arrow keys do
        both.
      </p>}
      whenToUse={[
        "Full-screen section galleries and story pages",
        "Swipe navigation on touch devices",
        "Reacting to scroll intent on pages that don't scroll",
      ]}
    >
      <Demo title="A gesture-driven gallery">
        <ObserverGallery />
      </Demo>

      <p className="text-sm text-muted">
        Hijacking the wheel is what makes these galleries annoying, so this one gives it back: only wheel movements that change
        the slide are blocked, and once the last slide is showing, the page scrolls on. Swipes are sideways so that a phone can
        still scroll past the gallery with a vertical swipe.
      </p>

      <CodePeek file="app/gsap-observer/ObserverGallery.tsx" />
    </FeaturePage>
  );
}
