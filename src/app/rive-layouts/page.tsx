import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { LayoutDemo } from "./lazy";

export default function RiveLayoutsPage() {
  return (
    <FeaturePage
      title="Layouts & responsive"
      tagline="Fit and alignment, and artboards that reflow to their container."
      docs="https://rive.app/docs/runtimes/layout"
      whatItIs={<p>
        Every Rive file is drawn into a canvas, and <strong>fit</strong> decides how: <code>contain</code> scales the artboard to
        fit inside, <code>cover</code> fills and crops, <code>fill</code> stretches, and so on, with <strong>alignment</strong>{" "}
        choosing where it sits. <code>Fit.Layout</code> is the responsive one: the artboard itself takes the canvas&apos;s size and
        the layout rules the designer set (rows, padding, wrapping) rearrange its contents, much like CSS flexbox.
      </p>}
      whenToUse={[
        "Fit.Layout: Rive UI that must work from phone to desktop",
        "Contain or cover: illustrations in fixed slots",
        "Alignment: pinning a graphic to a corner of its space",
      ]}
    >
      <Demo title="Resize the container, change the fit">
        <LayoutDemo />
        <p className="text-sm text-muted">Start with <code>layout</code> and drag width: the contents rearrange. Switch to <code>contain</code> and they only scale.</p>
      </Demo>

      <p className="text-sm text-muted"><code>layout_test.riv</code> is an MIT example from Rive&apos;s own repository.</p>
      <CodePeek file="app/rive-layouts/LayoutDemo.tsx" />
    </FeaturePage>
  );
}
