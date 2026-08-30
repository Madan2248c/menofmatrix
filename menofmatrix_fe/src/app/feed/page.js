"use client";

import React, { useState, useEffect } from "react";
import { Caveat, Montserrat } from "next/font/google";
import SocialFab from "@/components/SocialFab";
import FluidButton from "@/components/FluidButton";

const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["500", "600"] });

export default function FeedPage() {
  const [size, setSize] = useState({ w: 1440, h: 900 });

  useEffect(() => {
    function update() {
      setSize({
        w: window.innerWidth,
        h: window.innerHeight,
      });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { w, h } = size;

  // Exact curve parameters based on the hand-drawn organic partition:
  // Junction point J at (45% w, 42% h)
  const jX = 0.45 * w;
  const jY = 0.42 * h;

  // Path 1: Region 1 (Left / White Frosted Glass)
  const pathLeftWhite = `M 0 0 L ${0.52 * w} 0 C ${0.48 * w} ${0.08 * h}, ${0.43 * w} ${0.22 * h}, ${jX} ${jY} C ${0.44 * w} ${0.52 * h}, ${0.32 * w} ${0.60 * h}, ${0.23 * w} ${0.72 * h} C ${0.20 * w} ${0.78 * h}, ${0.21 * w} ${0.90 * h}, ${0.20 * w} ${h} L 0 ${h} Z`;

  // Path 2: Region 2 (Top-Right / Warm Smoke Glass)
  const pathTopRightSmoke = `M ${0.52 * w} 0 L ${w} 0 L ${w} ${0.70 * h} C ${0.88 * w} ${0.66 * h}, ${0.80 * w} ${0.44 * h}, ${0.72 * w} ${0.45 * h} C ${0.60 * w} ${0.47 * h}, ${0.50 * w} ${0.48 * h}, ${jX} ${jY} C ${0.43 * w} ${0.22 * h}, ${0.48 * w} ${0.08 * h}, ${0.52 * w} 0 Z`;

  // Path 3: Region 3 (Bottom-Right / Obsidian Black)
  const pathBottomRightBlack = `M ${0.20 * w} ${h} C ${0.21 * w} ${0.90 * h}, ${0.20 * w} ${0.78 * h}, ${0.23 * w} ${0.72 * h} C ${0.32 * w} ${0.60 * h}, ${0.44 * w} ${0.52 * h}, ${jX} ${jY} C ${0.50 * w} ${0.48 * h}, ${0.60 * w} ${0.47 * h}, ${0.72 * w} ${0.45 * h} C ${0.80 * w} ${0.44 * h}, ${0.88 * w} ${0.66 * h}, ${w} ${0.70 * h} L ${w} ${h} Z`;

  // Shared Dividing Curves for Specular Strokes
  const curveTop = `M ${0.52 * w} 0 C ${0.48 * w} ${0.08 * h}, ${0.43 * w} ${0.22 * h}, ${jX} ${jY}`;
  const curveLeft = `M ${jX} ${jY} C ${0.44 * w} ${0.52 * h}, ${0.32 * w} ${0.60 * h}, ${0.23 * w} ${0.72 * h} C ${0.20 * w} ${0.78 * h}, ${0.21 * w} ${0.90 * h}, ${0.20 * w} ${h}`;
  const curveRight = `M ${jX} ${jY} C ${0.50 * w} ${0.48 * h}, ${0.60 * w} ${0.47 * h}, ${0.72 * w} ${0.45 * h} C ${0.80 * w} ${0.44 * h}, ${0.88 * w} ${0.66 * h}, ${w} ${0.70 * h}`;

  return (
    <div className="relative h-screen w-screen overflow-hidden select-none bg-[#f4f2ee]">
      {/* ------------------------------------------------------------------ */}
      {/* Region 1: Left / Top-Left — BOTTOM LAYER (z-10, Black)             */}
      {/* Lowest in z-stack: no shadow cast (nothing is below it)            */}
      {/* ------------------------------------------------------------------ */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox={`0 0 ${w} ${h}`}
      >
        <path d={pathLeftWhite} fill="#0d0d0f" />
      </svg>

      {/* ------------------------------------------------------------------ */}
      {/* Region 2: Top-Right — MIDDLE LAYER (z-20, Smoke)                   */}
      {/* Sits above Region 1: casts a very soft shadow onto the black below  */}
      {/* ------------------------------------------------------------------ */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
        style={{
          filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.14))",
        }}
        viewBox={`0 0 ${w} ${h}`}
      >
        <path d={pathTopRightSmoke} fill="#e5e2dc" />
      </svg>

      {/* ------------------------------------------------------------------ */}
      {/* Region 3: Bottom-Right — TOP LAYER (z-30, White)                   */}
      {/* Sits above both: casts a slightly stronger but still soft shadow    */}
      {/* ------------------------------------------------------------------ */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-30"
        style={{
          filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.18))",
        }}
        viewBox={`0 0 ${w} ${h}`}
      >
        <path d={pathBottomRightBlack} fill="#ffffff" />
      </svg>

      {/* ------------------------------------------------------------------ */}
      {/* Partition Line Highlights: subtle specular strokes on boundaries    */}
      {/* ------------------------------------------------------------------ */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-40" viewBox={`0 0 ${w} ${h}`}>
        {/* Top boundary: white blob meets black — subtle white specular rim */}
        <path d={curveTop} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
        {/* Left boundary: white meets black going down */}
        <path d={curveLeft} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
        {/* Right boundary: smoke meets white — very subtle light seam */}
        <path d={curveRight} fill="none" stroke="rgba(200,196,190,0.5)" strokeWidth="1.2" />
      </svg>

      {/* Social FAB + handwriting label + support button — top-right quadrant */}
      <div className="absolute left-3/4 top-[20%] z-50 flex -translate-x-1/2 -translate-y-1/2 flex-col items-start gap-5">
        <div className="flex items-center gap-5">
          <div className="translate-y-[10px]">
            <SocialFab fabSize={68} />
          </div>
          <div className={`${caveat.className} -mt-[26px] -rotate-[4deg] flex select-none flex-col text-neutral-900`}>
            <span
              className="mb-0.5 ml-1"
              style={{ fontSize: "1.05rem", fontWeight: 500, letterSpacing: "0.02em", opacity: 0.75 }}
            >
              Meet me
            </span>
            <span style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.02 }}>Lokesh</span>
            <span style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.02 }}>Yarramallu..!</span>
          </div>
        </div>

        <FluidButton
          className={`${montserrat.className} ml-[64px]`}
          href="https://www.buymeacoffee.com/"
          newTab
          baseScale={0.82}
          borderColor="#0d0d0f"
          firstTextColor="#0d0d0f"
          secondTextColor="#ffffff"
          overlayColor="#0d0d0f"
        >
          <span
            aria-hidden
            className="inline-block shrink-0"
            style={{
              width: 17,
              height: 17,
              background: "currentColor",
              WebkitMaskImage: "url(/assets/llm-token.png)",
              maskImage: "url(/assets/llm-token.png)",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          />
          Buy me few tokens
        </FluidButton>
      </div>
    </div>
  );
}