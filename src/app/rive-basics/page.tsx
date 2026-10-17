import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { RivePlayer } from "./RivePlayer";

export default function RiveBasicsPage() {
  return (
    <FeaturePage
      title="Rive playback"
      tagline="Play interactive vector animations designed in the Rive editor."
      docs="https://rive.app/docs/runtimes/react/react"
      whatItIs={<p>
        A <code>.riv</code> file holds <strong>artboards</strong> (scenes), timeline <strong>animations</strong> and{" "}
        <strong>state machines</strong>: the logic that decides which animation plays when, including reactions to the pointer.
        Designers build all of that in the Rive editor; the app only loads the file. The runtime is WebAssembly, served here from
        this site (<code>/rive/rive.wasm</code>) rather than a CDN, which is why only the Rive pages&apos; Content Security Policy
        allows <code>&apos;wasm-unsafe-eval&apos;</code>.
      </p>}
      whenToUse={[
        "Interactive icons, buttons and illustrations",
        "Onboarding and empty-state animations designers can update without code",
        "Characters and game-like UI that react to input",
      ]}
    >
      <Demo title="1. A looping animation">
        <RivePlayer src="/rive/truck.riv" label="Animated truck" />
      </Demo>

      <Demo title="2. An interactive state machine">
        <RivePlayer src="/rive/rating.riv" label="Interactive star rating" interactive />
      </Demo>

      <p className="text-sm text-muted">
        Both files are MIT-licensed examples from Rive&apos;s own repositories (see <code>public/rive/CREDITS.md</code>). Files
        exported from Rive&apos;s free plan show a small Rive splash screen.
      </p>

      <CodePeek file="app/rive-basics/RivePlayer.tsx" />
      <CodePeek file="lib/rive-runtime.ts" />
    </FeaturePage>
  );
}
