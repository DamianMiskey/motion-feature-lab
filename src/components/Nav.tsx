"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories, features } from "@/lib/features";
import { MotionControls } from "./motion/MotionControls";

// The sidebar is a Client Component: it highlights the current page
// (usePathname) and holds the motion settings.
export function Nav() {
  const path = usePathname();
  return (
    <nav className="sidebar">
      <Link href="/" className="brand">
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 18c4-12 8-12 10 0s6 12 10 0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
        <span>Motion Lab</span>
      </Link>
      {categories.map((cat) => (
        <div key={cat} className="nav-group">
          <div className="nav-cat">{cat}</div>
          {features.filter((f) => f.category === cat).map((f) => (
            <Link
              key={f.slug}
              href={`/${f.slug}`}
              className={`nav-link${path === `/${f.slug}` ? " active" : ""}${f.ready ? "" : " pending"}`}
            >
              {f.name}
            </Link>
          ))}
        </div>
      ))}
      <MotionControls />
    </nav>
  );
}
