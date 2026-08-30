"use client";

import React, { useState, useEffect } from "react";

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
      {/* Region 1: Left / Top-Left (Crisp White Glass)                       */}
      {/* ------------------------------------------------------------------ */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{
          filter: "drop-shadow(0 20px 50px rgba(0,0,0,0.45)) drop-shadow(0 4px 16px rgba(0,0,0,0.3))",
        }}
        viewBox={`0 0 ${w} ${h}`}
      >
        <path d={pathLeftWhite} fill="#0d0d0f" />
      </svg>

      {/* ------------------------------------------------------------------ */}
      {/* Region 2: Top-Right (Warm Smoke / Light Grey Glass)                 */}
      {/* ------------------------------------------------------------------ */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
        style={{
          filter: "drop-shadow(0 20px 50px rgba(60,50,35,0.1))",
        }}
        viewBox={`0 0 ${w} ${h}`}
      >
        <path d={pathTopRightSmoke} fill="#e5e2dc" />
      </svg>

      {/* ------------------------------------------------------------------ */}
      {/* Region 3: Bottom-Right (Obsidian Black) - Overlaps with Soft Shadow */}
      {/* ------------------------------------------------------------------ */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-30"
        style={{
          filter: "drop-shadow(0 -20px 60px rgba(60,50,35,0.12)) drop-shadow(-15px 0 35px rgba(0,0,0,0.06))",
        }}
        viewBox={`0 0 ${w} ${h}`}
      >
        <path d={pathBottomRightBlack} fill="#ffffff" />
      </svg>

      {/* ------------------------------------------------------------------ */}
      {/* Specular Organic Border Highlights along the Partition Lines        */}
      {/* ------------------------------------------------------------------ */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-40" viewBox={`0 0 ${w} ${h}`}>
        {/* Top dividing line highlight */}
        <path d={curveTop} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" />
        {/* Left dividing line highlight */}
        <path d={curveLeft} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        {/* Right dividing line highlight */}
        <path d={curveRight} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      </svg>
    </div>
  );
}