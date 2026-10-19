import Link from "next/link";
import type { ComponentProps } from "react";
import { needsWasm } from "@/lib/wasm-pages";

// A link to a feature page. A Content Security Policy belongs to the document,
// and a client-side navigation keeps the document, so arriving at a
// WebAssembly page (Rive, Rapier) through <Link> would leave the previous
// page's stricter policy in force, without 'wasm-unsafe-eval', and the demo
// would fail to start. Those pages get a plain <a>: a full page load, with
// their own headers. Every other page keeps Next's fast client navigation.
export function FeatureLink({ slug, ...props }: Omit<ComponentProps<"a">, "href"> & { slug: string }) {
  const href = `/${slug}`;
  return needsWasm(slug) ? <a href={href} {...props} /> : <Link href={href} {...props} />;
}
