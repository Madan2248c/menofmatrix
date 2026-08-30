"use client";

import React, { useState, useEffect, useMemo } from "react";
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
function generateSmoothBlob(w, h, seed = 0, lobes = 9, irregularity = 0.22) {
  const cx = w / 2;
  const cy = h / 2;
  const rx = (w / 2) * 0.95;
  const ry = (h / 2) * 0.95;
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
// Solid Organic Blob Component (Zero Hover Effects, Screen-Filling Fluidity)
// ---------------------------------------------------------------------------
function SolidOrganicBlob({
  id,
  width,
  height,
  seed = 1,
  lobes = 9,
  irregularity = 0.22,
  tone = "white", // "white" | "black" | "smoke" | "graphite"
  floatDuration = 22,
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

  const translateX = useTransform(mouseSpringX, (x) => x * parallaxFactor);
  const translateY = useTransform(mouseSpringY, (y) => y * parallaxFactor);

  const toneConfigs = {
    white: {
      fill: "bg-white/94",
      borderStroke: "rgba(255, 255, 255, 0.95)",
      innerStroke: "rgba(0, 0, 0, 0.03)",
      shadow: "drop-shadow(0 40px 90px rgba(60,50,35,0.12)) drop-shadow(0 2px 8px rgba(0,0,0,0.03))",
      sheen: "from-white via-white/80 to-transparent",
      badge: "bg-neutral-900 text-white",
      textColor: "text-neutral-900",
    },
    black: {
      fill: "bg-neutral-950/95",
      borderStroke: "rgba(255, 255, 255, 0.22)",
      innerStroke: "rgba(255, 255, 255, 0.08)",
      shadow: "drop-shadow(0 44px 100px rgba(0,0,0,0.5)) drop-shadow(0 6px 20px rgba(0,0,0,0.3))",
      sheen: "from-white/30 via-white/10 to-transparent",
      badge: "bg-white text-neutral-950",
      textColor: "text-white",
    },
    smoke: {
      fill: "bg-neutral-200/85",
      borderStroke: "rgba(255, 255, 255, 0.9)",
      innerStroke: "rgba(0, 0, 0, 0.05)",
      shadow: "drop-shadow(0 36px 85px rgba(60,50,35,0.09))",
      sheen: "from-white via-white/70 to-transparent",
      badge: "bg-neutral-800 text-white",
      textColor: "text-neutral-800",
    },
    graphite: {
      fill: "bg-neutral-900/90",
      borderStroke: "rgba(255, 255, 255, 0.16)",
      innerStroke: "rgba(255, 255, 255, 0.06)",
      shadow: "drop-shadow(0 38px 85px rgba(0,0,0,0.35))",
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
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{
        opacity: 1,
        scale: [1, 1.02, 0.985, 1],
        rotate: [-1.2, 1.4, -1.6, -1.2],
        y: [-12, 14, -8, -12],
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
        className={`pointer-events-none absolute inset-x-0 top-0 h-[2.5px] bg-gradient-to-r ${cfg.sheen} opacity-90`}
        style={{ clipPath: `path('${pathD}')` }}
      />

      {/* Specular SVG Border Hull */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${width} ${height}`}>
        <path
          d={pathD}
          fill="none"
          stroke={cfg.borderStroke}
          strokeWidth="1.8"
        />
        <path
          d={pathD}
          fill="none"
          stroke={cfg.innerStroke}
          strokeWidth="4.5"
          strokeOpacity="0.6"
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
// Main Organic 3-Blob Full-Screen Space-Filling Stage
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

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 60 };
  const mouseSpringX = useSpring(mouseX, springConfig);
  const mouseSpringY = useSpring(mouseY, springConfig);

  function handleMouseMove(e) {
    const { innerWidth, innerHeight } = window;
    mouseX.set(((e.clientX - innerWidth / 2) / (innerWidth / 2)) * 40);
    mouseY.set(((e.clientY - innerHeight / 2) / (innerHeight / 2)) * 40);
  }

  // Calculate dynamic blob sizes based on viewport so they 100% fill and overlap the entire space
  const blob1Width = Math.max(750, Math.round(viewport.w * 0.72));
  const blob1Height = Math.max(620, Math.round(viewport.h * 0.88));

  const blob2Width = Math.max(720, Math.round(viewport.w * 0.68));
  const blob2Height = Math.max(580, Math.round(viewport.h * 0.82));

  const blob3Width = Math.max(680, Math.round(viewport.w * 0.62));
  const blob3Height = Math.max(540, Math.round(viewport.h * 0.76));

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`${poppins.className} relative h-screen w-screen bg-[#f4f2ee] text-neutral-900 overflow-hidden select-none`}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Ambient Depth Atmospheric Shading                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_90%_90%_at_50%_-10%,rgba(235,230,220,0.9),rgba(244,242,238,1))]" />
      
      <div className="pointer-events-none fixed -top-40 -left-40 h-[700px] w-[700px] rounded-full bg-neutral-300/30 blur-[140px]" />
      <div className="pointer-events-none fixed top-1/4 -right-40 h-[800px] w-[800px] rounded-full bg-neutral-400/25 blur-[160px]" />
      <div className="pointer-events-none fixed -bottom-40 left-1/3 h-[700px] w-[700px] rounded-full bg-stone-300/25 blur-[150px]" />

      {/* ------------------------------------------------------------------ */}
      {/* 3 Space-Filling Organic Blobs (100% Viewport Covered)              */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative z-10 w-full h-full overflow-hidden">
        {/* BLOB 1: Top-Left Titan Pod (White Glass) */}
        {/* Spans across top-left, center, and bottom-left */}
        <SolidOrganicBlob
          id="01"
          label="Titan Apex Pod"
          width={blob1Width}
          height={blob1Height}
          seed={3}
          lobes={9}
          irregularity={0.22}
          tone="white"
          floatDuration={24}
          floatDelay={0}
          className="-top-[12%] -left-[14%] z-10"
          mouseSpringX={mouseSpringX}
          mouseSpringY={mouseSpringY}
          parallaxFactor={0.03}
        />

        {/* BLOB 3: Top-Right Smoke Anchor (Smoke Shade) */}
        {/* Fills the entire top-right & upper-middle quadrant that was previously empty */}
        <SolidOrganicBlob
          id="03"
          label="Horizon Smoke Pod"
          width={blob3Width}
          height={blob3Height}
          seed={14}
          lobes={9}
          irregularity={0.24}
          tone="smoke"
          floatDuration={26}
          floatDelay={4}
          className="-top-[16%] right-[-12%] z-20"
          mouseSpringX={mouseSpringX}
          mouseSpringY={mouseSpringY}
          parallaxFactor={0.04}
        />

        {/* BLOB 2: Center-Right Obsidian Void (Deep Black) */}
        {/* Fills the center-right, bottom-right, and overlaps Blobs 1 & 3 */}
        <SolidOrganicBlob
          id="02"
          label="Obsidian Nexus Void"
          width={blob2Width}
          height={blob2Height}
          seed={9}
          lobes={9}
          irregularity={0.25}
          tone="black"
          floatDuration={20}
          floatDelay={2}
          className="top-[24%] right-[-10%] z-30"
          mouseSpringX={mouseSpringX}
          mouseSpringY={mouseSpringY}
          parallaxFactor={-0.035}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Top Floating Control Capsule: Canvas Stage HUD                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border border-white/80 bg-white/90 px-6 py-2.5 shadow-[0_16px_40px_rgba(60,50,35,0.12)] backdrop-blur-2xl">
        <div className="flex items-center gap-2 pr-3 border-r border-neutral-200">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-black uppercase tracking-wider text-neutral-900">
            3 Space-Filling Organic Blobs
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-600">
          <span>Zero Dead Space</span>
          <span className="text-neutral-300">•</span>
          <span className="text-neutral-400">Seamlessly Interlocked</span>
        </div>
      </div>
    </div>
  );
}