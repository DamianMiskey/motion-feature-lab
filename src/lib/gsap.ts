"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Registers every GSAP plugin the lab uses, once. All of them ship in the
// free `gsap` package (they were paid "Club" plugins before 2025). Import
// from here, in Client Components only: plugins touch window and document.
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, DrawSVGPlugin, MorphSVGPlugin);

export { DrawSVGPlugin, Flip, gsap, MorphSVGPlugin, ScrollTrigger, SplitText, useGSAP };
