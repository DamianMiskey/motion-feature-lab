import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { FpsMeter } from "@/components/motion/FpsMeter";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Motion Feature Lab",
  description: "GSAP, Rive and Three.js: one page per technique, each with a live demo and its code.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <MotionProvider>
          <div className="grid min-h-screen md:grid-cols-[240px_1fr]">
            <Nav />
            <main className="w-full max-w-250 px-[clamp(16px,4vw,3rem)] py-8">{children}</main>
          </div>
          <FpsMeter />
        </MotionProvider>
      </body>
    </html>
  );
}
