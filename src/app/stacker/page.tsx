import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { Stacker } from "./lazy";

export default function StackerPage() {
  return (
    <FeaturePage
      title="Stacker"
      tagline="One button, one tower: drop each slab exactly on the last."
      docs="https://threejs.org/docs/#api/en/cameras/OrthographicCamera"
      whatItIs={<p>
        A fast one-button game built to feel good on a phone. There&apos;s no physics engine and no WebAssembly: the rules are a
        few lines of geometry (<code>stack.ts</code>), so it loads quickly and runs smoothly. When a slab lands off-centre, the
        overlap stays and the overhang is cut off and tumbles away; land within a few hundredths of a unit and it snaps into a
        <strong> Perfect</strong>, and a streak of them grows the slab back. An <strong>orthographic camera</strong> (no
        perspective) gives the clean isometric look; GSAP lifts it as the tower grows and drives the score pops and menus.
      </p>}
      whenToUse={[
        "Quick, replayable games for mobile",
        "One-input controls that work with tap, click or keyboard alike",
        "Seeing how little code a satisfying game loop needs",
      ]}
    >
      <Demo title="Play">
        <Stacker />
      </Demo>

      <p className="text-sm text-muted">
        The slab&apos;s position is kept in a ref and updated every frame without re-rendering React; React state changes only
        when a slab is dropped. Only the top 40 slabs are drawn, since older ones are out of view. Your best height is kept in
        this browser only.
      </p>

      <CodePeek file="app/stacker/stack.ts" />
      <CodePeek file="app/stacker/Stacker.tsx" />
      <CodePeek file="app/stacker/StackerScene.tsx" />
    </FeaturePage>
  );
}
