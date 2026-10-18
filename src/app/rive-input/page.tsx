import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { RiveInput } from "./lazy";

export default function RiveInputPage() {
  return (
    <FeaturePage
      title="Keyboard & text input"
      tagline="Rive files that take focus, answer the arrow keys and accept typing."
      docs="https://rive.app/docs/editor/state-machine/listeners"
      whatItIs={<p>
        State machine <strong>listeners</strong> aren&apos;t only for the pointer. A Rive file can mark elements as{" "}
        <strong>focusable</strong>, react to <strong>key presses</strong>, and contain real <strong>text input fields</strong>{" "}
        with a caret, selection and copy and paste, all designed in the editor. The app makes the canvas focusable with{" "}
        <code>tabIndex</code>; Rive moves focus between its own elements. The newer, experimental{" "}
        <strong>semantics</strong> mode mirrors those elements as hidden DOM nodes, so screen readers and the Tab key reach
        inside the canvas too.
      </p>}
      whenToUse={[
        "Interactive Rive UI that must work without a mouse",
        "Animated forms and sign-in screens",
        "Game-like menus driven by the arrow keys",
      ]}
    >
      <Demo title="1. Focus moved by the arrow keys">
        <RiveInput src="/rive/focus-tray.riv" artboard="Grid" label="A grid of buttons; use the arrow keys to move between them" className="h-95" />
        <p className="text-sm text-muted">Click the grid or Tab into it, then use the arrow keys to move between the buttons; Enter presses one.</p>
      </Demo>

      <Demo title="2. Keyboard and text listeners">
        <RiveInput src="/rive/key-and-text-listeners.riv" artboard="Main" label="Nodes that count key presses and typed characters" className="h-80" />
        <p className="text-sm text-muted">
          Click a box and press <kbd>a</kbd>. &quot;Both&quot; has a key listener (counts presses of A) and a text listener (counts
          characters typed); &quot;KeysOnly&quot; has just the key listener. No app code counts anything: it all happens in the file.
        </p>
      </Demo>

      <Demo title="3. A sign-in form with semantics">
        <RiveInput src="/rive/text_input_semantics.riv" label="A sign-in form drawn by Rive" semantics className="h-95" />
        <p className="text-sm text-muted">
          Click the email field and type; Tab moves to the password field (obscured) and then out of the canvas. With semantics on,
          the fields also exist as hidden inputs, so a screen reader announces them and the browser&apos;s Tab order includes them.
        </p>
      </Demo>

      <p className="text-sm text-muted">
        All three files are MIT-licensed test files from Rive&apos;s React runtime repository (see <code>public/rive/CREDITS.md</code>).
        Rive&apos;s semantics support is marked experimental, so its API may still change.
      </p>

      <CodePeek file="app/rive-input/RiveInput.tsx" />
    </FeaturePage>
  );
}
