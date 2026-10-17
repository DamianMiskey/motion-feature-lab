import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content Security Policy. Everything loads from this site: Rive's runtime,
// .riv files, 3D models and textures are all served from public/.
// Prerendered pages carry Next.js's inline scripts, so script-src allows
// 'unsafe-inline' (see the Vercel lab's Security page for the nonce version).
const policy = (extraScript = "") => [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${extraScript}${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  // blob: is for 3D models: the glTF loader unpacks embedded textures into
  // blob: URLs created by the page itself, then fetches them.
  "connect-src 'self' blob:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Cache Components: pages are static shells; the animations run in the browser.
  cacheComponents: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: [...securityHeaders, { key: "Content-Security-Policy", value: policy() }] },
      // Rive runs on WebAssembly, which needs 'wasm-unsafe-eval'. Only the
      // Rive pages get it (their slugs start with "rive-"); the later rule wins.
      { source: "/:slug(rive-.*)", headers: [{ key: "Content-Security-Policy", value: policy(" 'wasm-unsafe-eval'") }] },
    ];
  },
};

export default nextConfig;
