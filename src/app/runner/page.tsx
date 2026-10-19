import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { Runner } from "./lazy";

export default function RunnerPage() {
  return (
    <FeaturePage
      title="Starfield Runner"
      tagline="Fly through an endless asteroid field that keeps getting faster."
      docs="https://threejs.org/docs/#api/en/objects/InstancedMesh"
      whatItIs={<p>
        A fast arcade game with no physics engine and no WebAssembly, built to run smoothly on a phone. All the asteroids are
        one <strong>InstancedMesh</strong> (a single draw call), and they&apos;re never created or destroyed while you play:
        each one that passes the ship is moved back to the far end with a new position and size (<strong>object
        pooling</strong>), so there&apos;s no garbage-collection stutter. Collisions are a distance check at the moment a rock
        crosses the ship; passing close earns a bonus. The field comes from a <strong>seeded random generator</strong>, so the
        rules are repeatable in tests. GSAP drives the score pops, menus and crash shake; the camera banks into turns and widens
        when you boost.
      </p>}
      whenToUse={[
        "Endless and procedural games",
        "Thousands of moving objects on modest hardware (instancing, pooling)",
        "Speed effects: field of view, streaks, camera roll",
      ]}
    >
      <Demo title="Play">
        <Runner />
      </Demo>

      <p className="text-sm text-muted">
        Steering reuses Marble Maze&apos;s input code: keys, drag, or phone tilt (with the landscape-safe tilt maths). The
        game&apos;s state lives in a ref and is updated once per frame; the score and boost bar are written straight to the page,
        so React doesn&apos;t re-render while you fly. Your best score is kept in this browser only.
      </p>

      <CodePeek file="app/runner/field.ts" />
      <CodePeek file="app/runner/Runner.tsx" />
      <CodePeek file="app/runner/RunnerScene.tsx" />
    </FeaturePage>
  );
}
