import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { FlipDemo } from "./FlipDemo";

export default function GsapFlipPage() {
  return (
    <FeaturePage
      title="Flip"
      tagline="Animate any layout change, even ones CSS can't transition."
      docs="https://gsap.com/docs/v3/Plugins/Flip/"
      whatItIs={<p>
        Changing a grid&apos;s order, filtering items, or moving an element into another container all happen instantly: CSS
        can&apos;t transition between layouts. <strong>Flip</strong> (First, Last, Invert, Play) records where elements are,
        lets the layout change, then animates each element from its old place to its new one with transforms. In React, the
        state change happens normally and <code>Flip.from()</code> runs after the new layout renders.
      </p>}
      whenToUse={[
        "Filtering, sorting and shuffling lists or grids",
        "Expanding a card into a detail view",
        "Moving an element between containers (cart, favourites)",
      ]}
    >
      <Demo title="Shuffle, filter, expand">
        <FlipDemo />
      </Demo>

      <CodePeek file="app/gsap-flip/FlipDemo.tsx" />
    </FeaturePage>
  );
}
