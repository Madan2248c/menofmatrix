"use client";

import React, { useState, useEffect, useMemo } from "react";

// ---------------------------------------------------------------------------
// Procedural Organic SVG Path Generator for Smooth Amorphous Splines
// ---------------------------------------------------------------------------
function generateSmoothBlob(w, h, seed = 0, lobes = 9, irregularity = 0.22) {
  const cx = w / 2;
  const cy = h / 2;
  const rx = (w / 2) * 0.96;
  const ry = (h / 2) * 0.96;
  const pts = [];

  for (let i = 0; i < lobes; i++) {
    const angle = (i / lobes) * Math.PI * 2 - Math.PI / 2;
    const wave = 1 + irregularity * Math.sin(i * 2.5 + seed * 1.8) + (irregularity * 0.5) * Math.cos(i * 1.4 + seed * 2.2);
    const x = cx + Math.cos(angle) * rx * wave;
    const y = cy + Math.sin(angle) * ry * wave;
    pts.push([Math.max(4, Math.min(w - 4, x)), Math.max(4, Math.min(h - 4, y))]);
  }

  const p = (i) => pts[((i % lobes) + lobes) % lobes];
  let d = `M ${p(0)[0].toFixed(1)} ${p(0)[1].toFixed(1)}`;

  for (let i = 0; i < lobes; i++) {
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }

  return `${d} Z`;
}

// ---------------------------------------------------------------------------
// Static Organic Blob Component (Pure Aesthetics, Zero Movement/Hover)
// ---------------------------------------------------------------------------
function PureOrganicBlob({
  width,
  height,
  seed = 1,
  lobes = 9,
  irregularity = 0.22,
  tone = "white", // "white" | "black" | "smoke"
  className = "",
  style = {},
}) {
  const pathD = useMemo(
    () => generateSmoothBlob(width, height, seed, lobes, irregularity),
    [width, height, seed, lobes, irregularity]
  );

  const toneConfigs = {
    white: {
      fill: "bg-white",
      borderStroke: "rgba(255, 255, 255, 0.95)",
      innerStroke: "rgba(0, 0, 0, 0.02)",
      shadow: "drop-shadow(0 40px 100px rgba(60,50,35,0.12))",
      sheen: "from-white via-white/80 to-transparent",
    },
    black: {
      fill: "bg-neutral-950",
      borderStroke: "rgba(255, 255, 255, 0.22)",
      innerStroke: "rgba(255, 255, 255, 0.08)",
      shadow: "drop-shadow(0 48px 110px rgba(0,0,0,0.55)) drop-shadow(0 6px 24px rgba(0,0,0,0.35))",
      sheen: "from-white/30 via-white/10 to-transparent",
    },
    smoke: {
      fill: "bg-[#e5e1da]",
      borderStroke: "rgba(255, 255, 255, 0.85)",
      innerStroke: "rgba(0, 0, 0, 0.04)",
      shadow: "drop-shadow(0 38px 90px rgba(60,50,35,0.1))",
      sheen: "from-white via-white/60 to-transparent",
    },
  };

  const cfg = toneConfigs[tone] || toneConfigs.white;

  return (
    <div
      style={{
        width,
        height,
        filter: cfg.shadow,
        ...style,
      }}
      className={`absolute select-none pointer-events-none ${className}`}
    >
      {/* Liquid SVG Backdrop */}
      <div
        className={`absolute inset-0 ${cfg.fill} backdrop-blur-3xl`}
        style={{
          clipPath: `path('${pathD}')`,
        }}
      />

      {/* Top Specular Sheen */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${cfg.sheen} opacity-90`}
        style={{ clipPath: `path('${pathD}')` }}
      />

      {/* SVG Specular Rim */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${width} ${height}`}>
        <path
          d={pathD}
          fill="none"
          stroke={cfg.borderStroke}
          strokeWidth="2"
        />
        <path
          d={pathD}
          fill="none"
          stroke={cfg.innerStroke}
          strokeWidth="5"
          strokeOpacity="0.6"
          className="blur-[1px]"
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main 3 Solid Space-Filling Blobs (100% Space Covered, Zero Gaps, Static)
// ---------------------------------------------------------------------------
export default function FeedPage() {
  const [viewport, setViewport] = useState({ w: 1440, h: 900 });

  useEffect(() => {
    function updateSize() {
      setViewport({
        w: window.innerWidth,
        h: window.innerHeight,
      });
    }
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Extra-large dimensions ensuring 100% full screen coverage with deep overlapping boundaries
  const blob1W = Math.max(900, Math.round(viewport.w * 1.05));
  const blob1H = Math.max(800, Math.round(viewport.h * 1.25));

  const blob2W = Math.max(850, Math.round(viewport.w * 0.95));
  const blob2H = Math.max(750, Math.round(viewport.h * 1.15));

  const blob3W = Math.max(880, Math.round(viewport.w * 0.98));
  const blob3H = Math.max(750, Math.round(viewport.h * 1.08));

  return (
    <div className="relative h-screen w-screen bg-white overflow-hidden select-none">
      {/* ------------------------------------------------------------------ */}
      {/* 3 Giant Static Interlocking Blobs (100% Screen Covered, 0 Dead Space) */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative z-10 w-full h-full overflow-hidden">
        {/* BLOB 1: Left / Top-Left Titan Pod (White Glass) */}
        <PureOrganicBlob
          width={blob1W}
          height={blob1H}
          seed={3}
          lobes={9}
          irregularity={0.2}
          tone="white"
          className="-top-[20%] -left-[20%] z-10"
        />

        {/* BLOB 2: Top-Right Smoke Pod (Warm Smoke Glass) - Closes any gap completely */}
        <PureOrganicBlob
          width={blob2W}
          height={blob2H}
          seed={14}
          lobes={9}
          irregularity={0.22}
          tone="smoke"
          className="-top-[22%] -right-[18%] z-20"
        />

        {/* BLOB 3: Bottom-Right Obsidian Void (Deep Black) */}
        <PureOrganicBlob
          width={blob3W}
          height={blob3H}
          seed={9}
          lobes={9}
          irregularity={0.24}
          tone="black"
          className="bottom-[-22%] -right-[15%] z-30"
        />
      </div>
    </div>
  );
}