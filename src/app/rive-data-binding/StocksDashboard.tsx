"use client";

import "@/lib/rive-runtime";
import {
  Fit, Layout, useRive, useViewModel, useViewModelInstance, useViewModelInstanceColor, useViewModelInstanceEnum,
  useViewModelInstanceNumber, useViewModelInstanceString, useViewModelInstanceTrigger,
} from "@rive-app/react-canvas";
import { useEffect, useRef, useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";
import { argbToHex, hexToRgb } from "@/lib/rive-color";
import { Button, Stage } from "@/components/ui";

const STOCKS = [
  { key: "apple", label: "AAPL" },
  { key: "microsoft", label: "MSFT" },
  { key: "tesla", label: "TSLA" },
] as const;

const random = () => Math.round(Math.random() * 200 - 100);

// One stock's change, bound to `<key>/stockChange` in the Rive file.
function StockSlider({ path, label, value, onChange }: { path: string; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm">
      <span>{label}</span>
      <input className="min-w-0 flex-1 basis-35" type="range" min={-100} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={`${label} change`} />
      <code>{path}</code> <span className="tabular-nums">{value > 0 ? `+${value}` : value}</span>
    </label>
  );
}

// Data binding: the Rive file defines a view model ("Dashboard") with typed
// properties; the app reads and writes them. The designer decides what each
// value does visually; the code never touches shapes or animations.
export function StocksDashboard() {
  const { reduced } = useMotion();
  const { rive, RiveComponent } = useRive(
    { src: "/rive/stocks.riv", artboard: "Main", stateMachine: "State Machine 1", autoplay: true, autoBind: false, layout: new Layout({ fit: Fit.Contain }) },
    { shouldUseIntersectionObserver: true },
  );
  const viewModel = useViewModel(rive, { name: "Dashboard" });
  const vmi = useViewModelInstance(viewModel, { rive });

  const title = useViewModelInstanceString("title", vmi);
  const logo = useViewModelInstanceEnum("logoShape", vmi);
  const rootColor = useViewModelInstanceColor("rootColor", vmi);
  const spin = useViewModelInstanceTrigger("triggerSpinLogo", vmi);
  // Values flowing the other way: computed by the file, read by the app.
  const appleColor = useViewModelInstanceColor("apple/currentColor", vmi);
  const [buttonPresses, setButtonPresses] = useState(0);
  useViewModelInstanceTrigger("triggerButton", vmi, { onTrigger: () => setButtonPresses((n) => n + 1) });

  const apple = useViewModelInstanceNumber("apple/stockChange", vmi);
  const microsoft = useViewModelInstanceNumber("microsoft/stockChange", vmi);
  const tesla = useViewModelInstanceNumber("tesla/stockChange", vmi);
  const [changes, setChanges] = useState({ apple: 12, microsoft: -8, tesla: 30 });
  const [simulate, setSimulate] = useState(!reduced);

  // Fill in names and starting values once the instance is ready.
  const seeded = useRef(false);
  useEffect(() => {
    if (!vmi || seeded.current) return;
    seeded.current = true;
    title.setValue("Motion Lab Market");
    // Without a hook: the instance's own API, for one-off writes.
    vmi.string("apple/name")!.value = "AAPL";
    vmi.string("microsoft/name")!.value = "MSFT";
    vmi.string("tesla/name")!.value = "TSLA";
  }, [vmi, title]);

  // Push the slider values into the file whenever they change.
  useEffect(() => {
    if (!vmi) return;
    apple.setValue(changes.apple);
    microsoft.setValue(changes.microsoft);
    tesla.setValue(changes.tesla);
  }, [vmi, changes, apple, microsoft, tesla]);

  // "Simulate market": new values every 2 s; spin the logo when all agree.
  useEffect(() => {
    if (!simulate || !vmi) return;
    const id = setInterval(() => {
      const next = { apple: random(), microsoft: random(), tesla: random() };
      setChanges(next);
      const values = Object.values(next);
      if (values.every((v) => v > 0) || values.every((v) => v < 0)) spin.trigger();
    }, 2000);
    return () => clearInterval(id);
  }, [simulate, vmi, spin]);

  return (
    <>
      <Stage className="h-95">
        <RiveComponent role="img" aria-label="A stock dashboard drawn by Rive, showing the values set below" />
      </Stage>
      {!vmi ? <p className="text-muted">Loading the Rive file…</p> : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3 [&_fieldset]:grid [&_fieldset]:content-start [&_fieldset]:gap-2 [&_fieldset]:rounded-xl [&_fieldset]:border [&_fieldset]:border-line [&_fieldset]:p-3 [&_legend]:px-1 [&_legend]:font-semibold">
          <fieldset>
            <legend>App → Rive</legend>
            <label className="grid gap-1 text-sm">title (string)<input value={title.value ?? ""} onChange={(e) => title.setValue(e.target.value)} maxLength={40} /></label>
            <label className="grid gap-1 text-sm">logoShape (enum)
              <select value={logo.value ?? ""} onChange={(e) => logo.setValue(e.target.value)}>
                {logo.values.map((v) => <option key={v}>{v}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">rootColor (color)
              <input type="color" value={rootColor.value == null ? "#c0ffee" : argbToHex(rootColor.value)} onChange={(e) => rootColor.setRgb(...hexToRgb(e.target.value))} />
            </label>
            {STOCKS.map((s) => (
              <StockSlider key={s.key} path={`${s.key}/stockChange`} label={s.label} value={changes[s.key]}
                onChange={(v) => { setSimulate(false); setChanges((c) => ({ ...c, [s.key]: v })); }} />
            ))}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Button onClick={() => spin.trigger()}>Fire triggerSpinLogo</Button>
              <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={simulate} onChange={(e) => setSimulate(e.target.checked)} /> Simulate market</label>
            </div>
          </fieldset>
          <fieldset>
            <legend>Rive → App</legend>
            <p className="text-sm">
              <code>apple/currentColor</code>, worked out by the file from the value you set:{" "}
              <span className="inline-block size-[1em] rounded border border-line align-middle" style={{ background: appleColor.value == null ? "transparent" : argbToHex(appleColor.value) }} />{" "}
              <code>{appleColor.value == null ? "…" : argbToHex(appleColor.value)}</code>
            </p>
            <p className="text-sm"><code>triggerButton</code> fired inside the file: <strong>{buttonPresses}</strong> times. Click the button in the dashboard.</p>
            <p className="text-sm text-muted">The bound values also update when the file changes them itself; the inputs above show them live.</p>
          </fieldset>
        </div>
      )}
      {reduced && <p className="text-sm text-muted">Reduced motion: the market simulation starts switched off.</p>}
    </>
  );
}
