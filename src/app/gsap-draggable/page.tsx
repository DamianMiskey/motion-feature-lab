import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { DragDemos } from "./lazy";

export default function GsapDraggablePage() {
  return (
    <FeaturePage
      title="Draggable & Inertia"
      tagline="Drag, throw and spin things, and have them land exactly where they should."
      docs="https://gsap.com/docs/v3/Plugins/Draggable/"
      whatItIs={<p>
        <strong>Draggable</strong> makes any element draggable with mouse, touch or pen: freely, along one axis, or spun around
        its centre (<code>type: &quot;rotation&quot;</code>), within bounds. Add <strong>InertiaPlugin</strong> and a release keeps
        the element moving with the speed it was thrown at, slowing down naturally. Because the plugin works out where the glide
        will end before it starts, a <code>snap</code> function can pick the landing spot, so a flick of the carousel always stops
        on a whole slide.
      </p>}
      whenToUse={[
        "Carousels and sliders that feel physical",
        "Drag-to-sort, sortable boards, image croppers",
        "Dials, knobs and other custom controls",
      ]}
    >
      <Demo title="Throw, snap, spin">
        <DragDemos />
      </Demo>

      <p className="text-sm text-muted">
        A custom control still needs to work without a pointer: the carousel has buttons, and the dial is a focusable{" "}
        <code>role=&quot;slider&quot;</code> that answers the arrow keys. <code>touch-action</code> is set so that dragging a card
        doesn&apos;t scroll the page on a phone, while swiping up and down over the carousel still does.
      </p>

      <CodePeek file="app/gsap-draggable/DragDemos.tsx" />
    </FeaturePage>
  );
}
