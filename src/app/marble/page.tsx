import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { Marble } from "./lazy";

export default function MarblePage() {
  return (
    <FeaturePage
      title="Marble Maze"
      tagline="Tilt the board, or your phone, to roll a marble through three mazes."
      docs="https://developer.mozilla.org/en-US/docs/Web/API/Window/deviceorientation_event"
      whatItIs={<p>
        A second capstone, built on the same pieces as <a href="/game">Tower Toppler</a>, with one new trick: on a phone you
        steer by <strong>tilting the phone itself</strong>. The browser&apos;s <code>deviceorientation</code> event reports how
        the phone is tilted (iOS asks permission first, in response to a tap), and the first reading becomes &quot;level&quot;
        so you can hold it at any angle. In the physics, the board never moves: <strong>gravity tilts</strong> instead, and the
        camera tilts the opposite way, which looks exactly like the board tilting. The floor is one seamless triangle mesh, so
        the marble doesn&apos;t catch on the edges between tiles.
      </p>}
      whenToUse={[
        "Motion controls for mobile games and playful pages",
        "Seeing physics, GSAP and Rive work together a second time",
        "A keyboard-playable 3D game: arrow keys or WASD",
      ]}
    >
      <Demo title="Play">
        <Marble />
      </Demo>

      <p className="text-sm text-muted">
        Levels are text grids (<code>#</code> wall, <code>O</code> hole, <code>S</code> start, <code>G</code> goal), and a unit
        test runs a breadth-first search on each one to prove the goal can be reached. Best times are kept in this browser only.
      </p>

      <CodePeek file="app/marble/Marble.tsx" />
      <CodePeek file="app/marble/MarbleWorld.tsx" />
      <CodePeek file="app/marble/tilt.ts" />
      <CodePeek file="app/marble/levels.ts" />
    </FeaturePage>
  );
}
