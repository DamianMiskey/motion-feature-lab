"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button, cx } from "./ui";

// The games' leaderboards live in the API lab (https://api.djmiskey.com/idempotency).
// This panel shows a game's top five live, over Server-Sent Events, and lets
// the player put a finished run on the board with three initials.
export const SCORES_API = process.env.NEXT_PUBLIC_SCORES_API ?? "https://api.djmiskey.com";

export type GameId = "toppler" | "marble" | "stacker" | "runner";
type Entry = { rank: number; id: string; initials: string; value: number };
type Board = { entries: Entry[]; latest?: { id: string } };
type Sent = { state: "idle" | "sending" | "done" | "error"; message?: string; id?: string; rank?: number };

const INITIALS_KEY = "motion-lab:initials";
const LISTEN_MS = 120_000; // stop listening after two minutes: an open stream keeps a server function running
const readInitials = () => { try { return localStorage.getItem(INITIALS_KEY) ?? ""; } catch { return ""; } };
const writeInitials = (s: string) => { try { localStorage.setItem(INITIALS_KEY, s); } catch {} };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POST the score, retrying network failures and 5xx/409 answers with the SAME
 * Idempotency-Key: if the first attempt did reach the server and only its
 * answer was lost, the retry gets that answer back instead of a second entry.
 */
async function submit(game: GameId, initials: string, value: number, key: string) {
  for (let attempt = 1; ; attempt++) {
    try {
      const r = await fetch(`${SCORES_API}/api/scores`, {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": `"${key}"` },
        body: JSON.stringify({ game, initials, value }),
      });
      if (r.ok) return (await r.json()) as { id: string; rank: number };
      if (r.status === 429) throw new Error("Too many scores in a minute. Try again shortly.");
      if (r.status < 500 && r.status !== 409) throw new Error(((await r.json()) as { detail?: string }).detail ?? `Refused (${r.status}).`);
      if (attempt === 3) throw new Error("The leaderboard isn't answering. Try again later.");
    } catch (e) {
      if (!(e instanceof TypeError) || attempt === 3) throw e instanceof TypeError ? new Error("Couldn't reach the leaderboard.") : e;
    }
    await wait(1000 * 2 ** (attempt - 1)); // 1 s, then 2 s
  }
}

export function Leaderboard({ game, value, format = (v) => v.toLocaleString("en") }: {
  game: GameId;
  /** The finished run's result. (The panel is only shown after a run, so nobody opens a stream just by visiting.) */
  value: number;
  format?: (value: number) => string;
}) {
  const [board, setBoard] = useState<Board | null>(null);
  const [offline, setOffline] = useState(false);
  const [initials, setInitials] = useState(readInitials);
  const [sent, setSent] = useState<Sent>({ state: "idle" });
  const key = useRef<string | null>(null);

  // The live board: EventSource reconnects by itself when a stream ends, and
  // the server resumes from Last-Event-ID.
  useEffect(() => {
    const es = new EventSource(`${SCORES_API}/api/scores/stream?game=${game}&limit=5`);
    es.addEventListener("board", (e) => { setBoard(JSON.parse(e.data)); setOffline(false); });
    es.addEventListener("error", () => { if (es.readyState === EventSource.CLOSED) setOffline(true); });
    const stop = setTimeout(() => es.close(), LISTEN_MS);
    return () => { clearTimeout(stop); es.close(); };
  }, [game]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (initials.length !== 3 || sent.state === "sending") return;
    writeInitials(initials);
    // One key per run, made on the first try and reused by every retry,
    // including the player pressing Submit again after an error.
    key.current ??= crypto.randomUUID();
    setSent({ state: "sending" });
    try {
      const created = await submit(game, initials, value, key.current);
      setSent({ state: "done", id: created.id, rank: created.rank });
    } catch (err) {
      setSent({ state: "error", message: (err as Error).message });
    }
  };

  // Highlight the player's own entry, or else the newest arrival.
  const highlight = sent.id ?? board?.latest?.id;
  return (
    <div className="panel-item mt-3 text-left" data-testid="leaderboard">
      {value > 0 && (sent.state === "done"
        ? <p className="m-0 mb-2 text-center text-sm font-semibold" role="status">On the board at #{sent.rank}!</p>
        : (
          <form className="mb-2 flex items-center justify-center gap-2" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor={`initials-${game}`}>Your initials (three letters)</label>
            <input
              id={`initials-${game}`}
              className="w-20 rounded-md border border-white/30 bg-white/10 px-2 py-1 text-center font-mono text-lg tracking-[0.3em] text-white uppercase placeholder:text-white/40"
              value={initials}
              onChange={(e) => setInitials(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3))}
              placeholder="AAA"
              autoComplete="nickname"
              spellCheck={false}
            />
            <Button type="submit" disabled={initials.length !== 3 || sent.state === "sending"}>{sent.state === "sending" ? "Sending…" : "Submit score"}</Button>
          </form>
        ))}
      {sent.state === "error" && <p className="m-0 mb-2 text-center text-xs text-[#ff9b8e]" role="alert">{sent.message}</p>}

      <p className="m-0 mb-1 text-xs tracking-wider text-white/60 uppercase">Leaderboard</p>
      {offline && !board
        ? <p className="m-0 text-sm text-white/60">Unavailable right now.</p>
        : !board
          ? <p className="m-0 text-sm text-white/60">Loading…</p>
          : board.entries.length === 0
            ? <p className="m-0 text-sm text-white/60">No scores yet. Be the first!</p>
            : (
              <ol className="m-0 list-none p-0 font-mono text-sm">
                {board.entries.map((e) => (
                  <li key={e.id} className={cx("flex justify-between gap-3 rounded px-1", e.id === highlight && "bg-white/15 font-bold")}>
                    <span>{e.rank}. {e.initials}</span>
                    <span className="tabular-nums">{format(e.value)}</span>
                  </li>
                ))}
              </ol>
            )}
    </div>
  );
}
