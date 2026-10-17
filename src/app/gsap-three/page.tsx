import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { ScrollCamera } from "./ScrollCamera";

export default function GsapThreePage() {
  return (
    <FeaturePage
      title="GSAP × Three.js"
      tagline="Scroll-driven camera moves: GSAP owns the timing, Three.js draws the frames."
      docs="https://gsap.com/docs/v3/Plugins/ScrollTrigger/"
      whatItIs={<p>
        GSAP can tween <strong>any</strong> JavaScript number, not just CSS. Here a ScrollTrigger timeline animates a plain object
        holding the camera&apos;s position and target, and react-three-fiber&apos;s <code>useFrame</code> copies it onto the camera
        every frame. Keeping that object outside React state matters: scrolling changes it sixty times a second, and none of
        those changes should re-render components. The 3D view stays put with CSS <code>position: sticky</code> while its section
        scrolls past.
      </p>}
      whenToUse={[
        "Scroll-told product stories and landing pages",
        "Guided tours through a 3D model or space",
        "Any time scroll position should drive 3D values",
      ]}
    >
      <Demo title="Scroll to fly the camera">
        <ScrollCamera />
      </Demo>

      <CodePeek file="app/gsap-three/ScrollCamera.tsx" />
    </FeaturePage>
  );
}
