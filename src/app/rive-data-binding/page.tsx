import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { StocksDashboard } from "./StocksDashboard";

export default function RiveDataBindingPage() {
  return (
    <FeaturePage
      title="Data binding"
      tagline="Drive a Rive file from your app's data, and read values back."
      docs="https://rive.app/docs/runtimes/data-binding"
      whatItIs={<p>
        In the Rive editor, a designer defines a <strong>view model</strong>: named, typed properties (strings, numbers,
        colours, enums, triggers, lists) and binds them to what the file shows. At runtime the app gets an{" "}
        <strong>instance</strong> of that view model and sets its properties; the file reacts however the designer decided.
        It works both ways: values the file computes, and triggers fired inside it, reach the app too. Data binding replaces
        state machine <em>inputs</em>, which are deprecated.
      </p>}
      whenToUse={[
        "Dashboards, scores and counters drawn by Rive",
        "Theming a Rive file from app settings (colours, labels)",
        "Rive UI that reports back: buttons, toggles, selections",
      ]}
    >
      <Demo title="A dashboard bound to the controls below">
        <StocksDashboard />
      </Demo>

      <p className="small muted"><code>stocks.riv</code> is an MIT example from Rive&apos;s own repository.</p>
      <CodePeek file="app/rive-data-binding/StocksDashboard.tsx" />
      <CodePeek file="lib/rive-color.ts" />
    </FeaturePage>
  );
}
