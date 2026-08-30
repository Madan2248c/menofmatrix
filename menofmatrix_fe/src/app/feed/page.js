"use client";

import React, { useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Poppins } from "next/font/google";
import { HiOutlineSparkles } from "react-icons/hi2";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

// ---------------------------------------------------------------------------
// Procedural Organic SVG Path Generator for Smooth Amorphous Splines
// ---------------------------------------------------------------------------
function generateSmoothBlob(w, h, seed = 0, lobes = 9, irregularity = 0.24) {
  const cx = w / 2;
  const cy = h / 2;
  const rx = (w / 2) * 0.94;
  const ry = (h / 2) * 0.94;
  const pts = [];

  for (let i = 0; i < lobes; i++) {
    const angle = (i / lobes) * Math.PI * 2 - Math.PI / 2;
    const wave = 1 + irregularity * Math.sin(i * 2.6 + seed * 1.8) + (irregularity * 0.55) * Math.cos(i * 1.5 + seed * 2.2);
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
// Solid Organic Blob Component (No Hover Effects, Pure Fluid Motion)
// ---------------------------------------------------------------------------
function SolidOrganicBlob({
  id,
  width = 800,
  height = 650,
  seed = 1,
  lobes = 9,
  irregularity = 0.24,
  tone = "white", // "white" | "black" | "graphite"
  floatDuration = 20,
  floatDelay = 0,
  className = "",
  style = {},
  label = "",
  mouseSpringX,
  mouseSpringY,
  parallaxFactor = 0.03,
}) {
  const pathD = useMemo(
    () => generateSmoothBlob(width, height, seed, lobes, irregularity),
    [width, height, seed, lobes, irregularity]
  );

  // Soft Parallax Translation
  const translateX = useTransform(mouseSpringX, (x) => x * parallaxFactor);
  const translateY = useTransform(mouseSpringY, (y) => y * parallaxFactor);

  const toneConfigs = {
    white: {
      fill: "bg-white/94",
      borderStroke: "rgba(255, 255, 255, 0.95)",
      innerStroke: "rgba(0, 0, 0, 0.03)",
      shadow: "drop-shadow(0 36px 80px rgba(60,50,35,0.1)) drop-shadow(0 2px 8px rgba(0,0,0,0.03))",
      sheen: "from-white via-white/80 to-transparent",
      badge: "bg-neutral-900 text-white",
      textColor: "text-neutral-900",
    },
    black: {
      fill: "bg-neutral-950/95",
      borderStroke: "rgba(255, 255, 255, 0.2)",
      innerStroke: "rgba(255, 255, 255, 0.08)",
      shadow: "drop-shadow(0 40px 90px rgba(0,0,0,0.45)) drop-shadow(0 4px 16px rgba(0,0,0,0.3))",
      sheen: "from-white/30 via-white/10 to-transparent",
      badge: "bg-white text-neutral-950",
      textColor: "text-white",
    },
    graphite: {
      fill: "bg-neutral-900/90",
      borderStroke: "rgba(255, 255, 255, 0.16)",
      innerStroke: "rgba(255, 255, 255, 0.06)",
      shadow: "drop-shadow(0 34px 75px rgba(0,0,0,0.32))",
      sheen: "from-white/20 via-transparent to-transparent",
      badge: "bg-white/90 text-neutral-900",
      textColor: "text-neutral-100",
    },
  };

  const cfg = toneConfigs[tone] || toneConfigs.white;

  return (
    <motion.div
      style={{
        width,
        height,
        filter: cfg.shadow,
        x: translateX,
        y: translateY,
        ...style,
      }}
      className={`absolute select-none pointer-events-auto ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: [1, 1.025, 0.985, 1],
        rotate: [-1.2, 1.5, -1.8, -1.2],
        y: [-14, 16, -10, -14],
      }}
      transition={{
        opacity: { duration: 1.2, ease: "easeOut" },
        scale: { duration: floatDuration, repeat: Infinity, ease: "easeInOut", delay: floatDelay },
        rotate: { duration: floatDuration * 1.2, repeat: Infinity, ease: "easeInOut", delay: floatDelay },
        y: { duration: floatDuration * 0.95, repeat: Infinity, ease: "easeInOut", delay: floatDelay },
      }}
    >
      {/* Morphing Liquid SVG Container */}
      <div
        className={`absolute inset-0 ${cfg.fill} backdrop-blur-3xl`}
        style={{
          clipPath: `path('${pathD}')`,
        }}
      />

      {/* Internal Liquid Refraction Gradient */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${cfg.sheen} opacity-90`}
        style={{ clipPath: `path('${pathD}')` }}
      />

      {/* Specular SVG Border Hull */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${width} ${height}`}>
        <path
          d={pathD}
          fill="none"
          stroke={cfg.borderStroke}
          strokeWidth="1.6"
        />
        <path
          d={pathD}
          fill="none"
          stroke={cfg.innerStroke}
          strokeWidth="4"
          strokeOpacity="0.5"
          className="blur-[1px]"
        />
      </svg>

      {/* Centered Safe-Area Preview Badge / Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center pointer-events-none">
        {label && (
          <div className="flex flex-col items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider shadow-sm ${cfg.badge}`}>
              <HiOutlineSparkles className="h-3.5 w-3.5" />
              <span>{label}</span>
            </span>
            <span className={`text-xs font-semibold opacity-60 ${cfg.textColor}`}>
              Solid Organic Blob #{id}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Organic 3-Blob Canvas Stage Page
// ---------------------------------------------------------------------------
export default function FeedPage() {
  // Raw mouse coordinates for interactive parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for buttery deceleration
  const springConfig = { damping: 30, stiffness: 60 };
  const mouseSpringX = useSpring(mouseX, springConfig);
  const mouseSpringY = useSpring(mouseY, springConfig);

  function handleMouseMove(e) {
    const { innerWidth, innerHeight } = window;
    mouseX.set(((e.clientX - innerWidth / 2) / (innerWidth / 2)) * 45);
    mouseY.set(((e.clientY - innerHeight / 2) / (innerHeight / 2)) * 45);
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`${poppins.className} relative min-h-screen w-full bg-[#f6f4f0] text-neutral-900 overflow-hidden select-none`}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Ambient Radial Atmosphere                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(240,235,225,0.85),rgba(246,244,240,1))]" />
      
      {/* Soft Ambient Depth Spheres */}
      <div className="pointer-events-none fixed -top-40 -left-40 h-[650px] w-[650px] rounded-full bg-gradient-to-tr from-neutral-300/35 via-neutral-200/20 to-transparent blur-[140px]" />
      <div className="pointer-events-none fixed top-1/4 -right-40 h-[750px] w-[750px] rounded-full bg-gradient-to-bl from-neutral-400/20 via-neutral-200/10 to-transparent blur-[150px]" />
      <div className="pointer-events-none fixed -bottom-40 left-1/3 h-[650px] w-[650px] rounded-full bg-gradient-to-tr from-neutral-300/30 via-stone-200/15 to-transparent blur-[140px]" />

      {/* Subtle Texture Mesh */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ------------------------------------------------------------------ */}
      {/* The 3 Solid Overlapping Blobs Spatial Canvas                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative z-10 w-full h-screen min-h-[900px] overflow-hidden">
        {/* SOLID BLOB 1: Top-Left Titan Pod (White Frosted Glass) */}
        {/* Dominates the upper-left quadrant and bleeds off top & left */}
        <SolidOrganicBlob
          id="01"
          label="Titan Apex Pod"
          width={860}
          height={680}
          seed={3}
          lobes={9}
          irregularity={0.24}
          tone="white"
          floatDuration={22}
          floatDelay={0}
          className="-top-24 -left-28 z-10"
          mouseSpringX={mouseSpringX}
          mouseSpringY={mouseSpringY}
          parallaxFactor={0.035}
        />

        {/* SOLID BLOB 2: Center-Right Hero Obsidian Void (Deep Black) */}
        {/* Dominates the center & right quadrant, overlapping Blob 1 */}
        <SolidOrganicBlob
          id="02"
          label="Obsidian Nexus Void"
          width={820}
          height={640}
          seed={9}
          lobes={9}
          irregularity={0.26}
          tone="black"
          floatDuration={19}
          floatDelay={2}
          className="top-[18%] right-[-5%] z-30"
          mouseSpringX={mouseSpringX}
          mouseSpringY={mouseSpringY}
          parallaxFactor={-0.045}
        />

        {/* SOLID BLOB 3: Bottom Anchor Pod (Smoked Graphite) */}
        {/* Spans across the lower viewport, interlocking Blobs 1 & 2 */}
        <SolidOrganicBlob
          id="03"
          label="Graphite Anchor Basin"
          width={880}
          height={600}
          seed={17}
          lobes={8}
          irregularity={0.23}
          tone="graphite"
          floatDuration={24}
          floatDelay={3.5}
          className="bottom-[-12%] left-[12%] z-20"
          mouseSpringX={mouseSpringX}
          mouseSpringY={mouseSpringY}
          parallaxFactor={0.04}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Top Floating Control Capsule: Canvas Stage HUD                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border border-white/80 bg-white/90 px-6 py-2.5 shadow-[0_16px_40px_rgba(60,50,35,0.12)] backdrop-blur-2xl">
        <div className="flex items-center gap-2 pr-3 border-r border-neutral-200">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-black uppercase tracking-wider text-neutral-900">
            3 Solid Organic Blobs Canvas
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-600">
          <span>Screen-Spanning Layout</span>
          <span className="text-neutral-300">•</span>
          <span className="text-neutral-400">Pure Fluid Motion</span>
        </div>
      </div>
    </div>
  );
}