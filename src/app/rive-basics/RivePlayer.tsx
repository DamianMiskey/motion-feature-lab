"use client";

import "@/lib/rive-runtime";
import { Fit, Layout, useRive } from "@rive-app/react-canvas";
import { useState } from "react";
import { useMotion } from "@/components/motion/MotionProvider";

type Info = { artboard: string; stateMachines: string[]; animations: string[] };

// Plays a .riv file. Rive files carry their own artboards, timeline
// animations and state machines (the interactive logic); the component lists
// what it found and plays the first state machine, or else the first animation.
export function RivePlayer({ src, label, interactive = false }: { src: string; label: string; interactive?: boolean }) {
  const { reduced } = useMotion();
  const [info, setInfo] = useState<Info | null>(null);
  const [playing, setPlaying] = useState(false);

  const { rive, RiveComponent } = useRive(
    {
      src,
      autoplay: false,
      layout: new Layout({ fit: Fit.Contain }),
      // Called once the file has loaded: inspect it, then start it unless the
      // visitor prefers reduced motion. (Interactive files start either way:
      // they only move when the visitor points at them.)
      onRiveReady: (r) => {
        const found = { artboard: r.activeArtboard, stateMachines: r.stateMachineNames, animations: r.animationNames };
        setInfo(found);
        if (!reduced || interactive) r.play(found.stateMachines[0] ?? found.animations[0]);
      },
      onPlay: () => setPlaying(true),
      onPause: () => setPlaying(false),
      onStop: () => setPlaying(false),
    },
    // Rive pauses rendering by itself while the canvas is off screen.
    { shouldUseIntersectionObserver: true },
  );

  const toggle = () => {
    if (!rive || !info) return;
    if (playing) rive.pause();
    else rive.play(info.stateMachines[0] ?? info.animations[0]);
  };

  return (
    <figure style={{ margin: 0 }}>
      <div className="stage" style={{ height: 260 }}>
        <RiveComponent aria-label={label} role="img" />
      </div>
      <div className="controls">
        <button onClick={toggle} disabled={!info}>{playing ? "Pause" : "Play"}</button>
        {interactive && <span className="small muted">Hover and click the animation: its state machine reacts to the pointer.</span>}
      </div>
      {info && (
        <figcaption className="small muted">
          Artboard <code>{info.artboard}</code> · state machines: {info.stateMachines.map((n) => <code key={n}>{n} </code>)}
          {info.stateMachines.length === 0 && "none"} · animations: {info.animations.map((n) => <code key={n}>{n} </code>)}
          {info.animations.length === 0 && "none"}
        </figcaption>
      )}
    </figure>
  );
}
