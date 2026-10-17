import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { RiveInSpace } from "./RiveInSpace";
import { RiveTexture } from "./RiveTexture";

export default function RiveThreePage() {
  return (
    <FeaturePage
      title="Rive × Three.js"
      tagline="Two ways to combine them: Rive as a live texture, and Rive UI placed in 3D space."
      docs="https://threejs.org/docs/#api/en/textures/CanvasTexture"
      whatItIs={<p>
        Rive draws into a canvas, and Three.js can use <strong>any canvas as a texture</strong>: wrap it in a{" "}
        <code>CanvasTexture</code>, mark it for update each frame, and the animation plays on a 3D surface. For interactive Rive
        UI, a <strong>real DOM element</strong> is laid over the canvas and pinned to a point in the scene: each frame the point is
        projected to screen coordinates (<code>vector.project(camera)</code>) and the element moved there, so it follows the 3D
        object but keeps normal pointer events and accessibility.
      </p>}
      whenToUse={[
        "Texture: animated screens, signs and labels inside a 3D scene",
        "Pinned DOM: interactive panels, tooltips and controls attached to 3D objects",
        "Either: designers own the 2D motion, developers own the scene",
      ]}
    >
      <Demo title="1. Rive as a texture">
        <RiveTexture />
        <p className="text-sm text-muted">The truck plays on the TV screen. The texture is only re-uploaded while the scene is animating.</p>
      </Demo>

      <Demo title="2. Rive UI in 3D space">
        <RiveInSpace />
        <p className="text-sm text-muted">Orbit the camera: the rating card stays attached to the gem. Click a star.</p>
      </Demo>

      <CodePeek file="app/rive-three/RiveTexture.tsx" />
      <CodePeek file="app/rive-three/RiveInSpace.tsx" />
      <CodePeek file="components/three/Anchor.tsx" />
    </FeaturePage>
  );
}
