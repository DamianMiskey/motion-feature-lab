"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories, features } from "@/lib/features";
import { cx } from "./ui";
import { MotionControls } from "./motion/MotionControls";

// The sidebar is a Client Component: it highlights the current page
// (usePathname) and holds the motion settings. On narrow screens it becomes
// a wrapping row of links above the content.
export function Nav() {
  const path = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 border-b border-line bg-surface px-3 py-4 md:sticky md:top-0 md:block md:h-screen md:overflow-y-auto md:border-r md:border-b-0">
      <Link href="/" className="flex w-full items-center gap-2 px-2 pb-1 font-bold text-fg no-underline md:pb-4">
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 18c4-12 8-12 10 0s6 12 10 0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
        <span>Motion Lab</span>
      </Link>
      {categories.map((cat) => (
        <div key={cat} className="contents md:block">
          <div className="hidden px-2 pt-3 pb-1 text-xs tracking-wider text-muted uppercase md:block">{cat}</div>
          {features.filter((f) => f.category === cat).map((f) => {
            const active = path === `/${f.slug}`;
            return (
              <Link
                key={f.slug}
                href={`/${f.slug}`}
                className={cx(
                  "block rounded-md border border-line px-2 py-1 text-sm no-underline md:border-0 md:text-[15px]",
                  active ? "bg-accent text-white" : f.ready ? "text-fg hover:bg-code" : "text-muted hover:bg-code",
                )}
              >
                {f.name}
              </Link>
            );
          })}
        </div>
      ))}
      <MotionControls />
    </nav>
  );
}
