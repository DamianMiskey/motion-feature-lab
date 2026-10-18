import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { Game } from "./lazy";

export default function GamePage() {
  return (
    <FeaturePage
      title="Tower Toppler"
      tagline="The capstone: a small game that uses all three tools together."
      docs="https://pmndrs.github.io/react-three-rapier/"
      whatItIs={<p>
        Three levels of towers on a floating platform, and a few balls to knock every block off. <strong>Three.js</strong> and{" "}
        <strong>Rapier</strong> run the world: the blocks, the throws, the falls (a throw is a ray from the camera through the
        crosshair, the same raycasting that picks objects under the mouse). <strong>GSAP</strong> runs everything around it:
        the camera swooping in, menus with split-text titles, the score counting up, &quot;+100&quot; pops where blocks fall,
        the ball counter. <strong>Rive</strong> draws the star rating at the end of each round.
      </p>}
      whenToUse={[
        "Seeing how the techniques from every other page fit together",
        "A starting point for a playful landing page or campaign game",
        "Keyboard-playable 3D: aim with the arrows, throw with Space",
      ]}
    >
      <Demo title="Play">
        <Game />
      </Demo>

      <p className="text-sm text-muted">
        How the parts talk: the 3D world reports each fallen block (with its position projected to the screen) through a
        callback; the game shell, plain React state, decides when a round ends (all blocks down, or a few seconds after the last
        ball) and scores it. The camera follows a plain object that GSAP tweens, so nothing re-renders per frame. The star file
        predates Rive&apos;s data binding, so it&apos;s driven by a state machine input, which is deprecated in new files (see the
        Data binding page for the current way). Your best total is kept in this browser only.
      </p>

      <CodePeek file="app/game/Game.tsx" />
      <CodePeek file="app/game/GameWorld.tsx" />
      <CodePeek file="app/game/levels.ts" />
      <CodePeek file="app/game/RiveBits.tsx" />
    </FeaturePage>
  );
}
