"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Poppins } from "next/font/google";
import {
  HiOutlineSparkles,
  HiOutlineCubeTransparent,
  HiOutlineArrowPath,
  HiOutlineEye,
} from "react-icons/hi2";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

// ---------------------------------------------------------------------------
// Procedural Organic SVG Path Generator for Morphing Splines
// ---------------------------------------------------------------------------
function generateSmoothBlob(w, h, seed = 0, lobes = 8, irregularity = 0.22) {
  const cx = w / 2;
  const cy = h / 2;
  const rx = (w / 2) * 0.92;
  const ry = (h / 2) * 0.92;
  const pts = [];

  for (let i = 0; i < lobes; i++) {
    const angle = (i / lobes) * Math.PI * 2 - Math.PI / 2;
    const wave = 1 + irregularity * Math.sin(i * 2.7 + seed * 1.9) + (irregularity * 0.6) * Math.cos(i * 1.6 + seed * 2.3);
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
// Big Organic Amorphous Blob Pod Component
// ---------------------------------------------------------------------------
function LivingOrganicBlob({
  id,
  width = 600,
  height = 500,
  seed = 1,
  lobes = 8,
  irregularity = 0.22,
  tone = "white", // "white" | "black" | "smoke" | "glass" | "graphite"
  floatDuration = 18,
  floatDelay = 0,
  className = "",
  style = {},
  label = "",
  mouseSpringX,
  mouseSpringY,
  parallaxFactor = 0.03,
}) {
  const pathA = useMemo(() => generateSmoothBlob(width, height, seed, lobes, irregularity), [width, height, seed, lobes, irregularity]);
  const pathB = useMemo(() => generateSmoothBlob(width, height, seed + 7, lobes, irregularity * 1.15), [width, height, seed, lobes, irregularity]);
  const pathC = useMemo(() => generateSmoothBlob(width, height, seed + 14, lobes, irregularity * 0.9), [width, height, seed, lobes, irregularity]);

  // Parallax translation driven by mouse motion
  const translateX = useTransform(mouseSpringX, (x) => x * parallaxFactor);
  const translateY = useTransform(mouseSpringY, (y) => y * parallaxFactor);

  // Styling presets: White, Black, Smoke, Graphite, Glass
  const toneConfigs = {
    white: {
      fill: "bg-white/92",
      borderStroke: "rgba(255, 255, 255, 0.95)",
      innerStroke: "rgba(0, 0, 0, 0.04)",
      shadow: "drop-shadow(0 32px 70px rgba(60,50,35,0.09)) drop-shadow(0 2px 6px rgba(0,0,0,0.03))",
      sheen: "from-white via-white/80 to-transparent",
      badge: "bg-neutral-900 text-white",
      textColor: "text-neutral-900",
    },
    black: {
      fill: "bg-neutral-950/95",
      borderStroke: "rgba(255, 255, 255, 0.18)",
      innerStroke: "rgba(255, 255, 255, 0.08)",
      shadow: "drop-shadow(0 36px 80px rgba(0,0,0,0.42)) drop-shadow(0 4px 12px rgba(0,0,0,0.25))",
      sheen: "from-white/30 via-white/10 to-transparent",
      badge: "bg-white text-neutral-950",
      textColor: "text-white",
    },
    graphite: {
      fill: "bg-neutral-900/90",
      borderStroke: "rgba(255, 255, 255, 0.14)",
      innerStroke: "rgba(255, 255, 255, 0.06)",
      shadow: "drop-shadow(0 30px 65px rgba(0,0,0,0.3))",
      sheen: "from-white/20 via-transparent to-transparent",
      badge: "bg-white/90 text-neutral-900",
      textColor: "text-neutral-100",
    },
    smoke: {
      fill: "bg-neutral-100/85",
      borderStroke: "rgba(255, 255, 255, 0.9)",
      innerStroke: "rgba(0, 0, 0, 0.05)",
      shadow: "drop-shadow(0 28px 60px rgba(60,50,35,0.07))",
      sheen: "from-white via-white/60 to-transparent",
      badge: "bg-neutral-800 text-white",
      textColor: "text-neutral-800",
    },
    glass: {
      fill: "bg-white/60",
      borderStroke: "rgba(255, 255, 255, 0.85)",
      innerStroke: "rgba(255, 255, 255, 0.5)",
      shadow: "drop-shadow(0 20px 50px rgba(60,50,35,0.06))",
      sheen: "from-white via-white/40 to-transparent",
      badge: "bg-neutral-900 text-white",
      textColor: "text-neutral-900",
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: [1, 1.03, 0.98, 1],
        rotate: [-1.5, 2, -2, -1.5],
        y: [-12, 14, -8, -12],
      }}
      transition={{
        opacity: { duration: 1.2, ease: "easeOut" },
        scale: { duration: floatDuration, repeat: Infinity, ease: "easeInOut", delay: floatDelay },
        rotate: { duration: floatDuration * 1.2, repeat: Infinity, ease: "easeInOut", delay: floatDelay },
        y: { duration: floatDuration * 0.9, repeat: Infinity, ease: "easeInOut", delay: floatDelay },
      }}
      whileHover={{ scale: 1.04, transition: { duration: 0.4, ease: "easeOut" } }}
    >
      {/* Morphing Liquid SVG Container */}
      <div
        className={`absolute inset-0 ${cfg.fill} backdrop-blur-3xl transition-colors duration-700`}
        style={{
          clipPath: `path('${pathA}')`,
        }}
      />

      {/* Internal Liquid Refraction Gradient */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${cfg.sheen} opacity-90`}
        style={{ clipPath: `path('${pathA}')` }}
      />

      {/* Specular SVG Border Hull */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${width} ${height}`}>
        <path
          d={pathA}
          fill="none"
          stroke={cfg.borderStroke}
          strokeWidth="1.6"
        />
        <path
          d={pathA}
          fill="none"
          stroke={cfg.innerStroke}
          strokeWidth="4"
          strokeOpacity="0.5"
          className="blur-[1px]"
        />
      </svg>

      {/* Centered Safe-Area Preview Badge / Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
        {label && (
          <div className="flex flex-col items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-sm ${cfg.badge}`}>
              <HiOutlineSparkles className="h-3 w-3" />
              <span>{label}</span>
            </span>
            <span className={`text-[11px] font-medium opacity-60 ${cfg.textColor}`}>
              Organic Fluid Cell #{id}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Organic Blob Stage Page
// ---------------------------------------------------------------------------
export default function FeedPage() {
  const [activeTheme, setActiveTheme] = useState("monochrome"); // "monochrome" | "contrast" | "minimal"
  const [motionIntensity, setMotionIntensity] = useState("normal"); // "gentle" | "normal" | "energetic"

  // Raw mouse coordinates for interactive parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for buttery deceleration
  const springConfig = { damping: 30, stiffness: 60 };
  const mouseSpringX = useSpring(mouseX, springConfig);
  const mouseSpringY = useSpring(mouseY, springConfig);

  function handleMouseMove(e) {
    const { innerWidth, innerHeight } = window;
    // Map to centered coordinates: -1 to +1
    mouseX.set((e.clientX - innerWidth / 2) / (innerWidth / 2) * 50);
    mouseY.set((e.clientY - innerHeight / 2) / (innerHeight / 2) * 50);
  }

  const speedMultiplier = motionIntensity === "gentle" ? 1.5 : motionIntensity === "energetic" ? 0.7 : 1;

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`${poppins.className} relative min-h-screen w-full bg-[#f6f4f0] text-neutral-900 overflow-hidden select-none`}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Ambient Radial Mesh & Atmosphere                                   */}
      {/* ------------------------------------------------------------------ */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(240,235,225,0.8),rgba(246,244,240,1))]" />
      
      {/* Soft Ambient Depth Spheres */}
      <div className="pointer-events-none fixed -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-neutral-300/30 via-neutral-200/20 to-transparent blur-[140px]" />
      <div className="pointer-events-none fixed top-1/4 -right-40 h-[700px] w-[700px] rounded-full bg-gradient-to-bl from-neutral-400/20 via-neutral-200/10 to-transparent blur-[150px]" />
      <div className="pointer-events-none fixed -bottom-40 left-1/3 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-neutral-300/25 via-stone-200/15 to-transparent blur-[140px]" />

      {/* Dynamic Grid Matrix Texture (Ultra Subtle) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Overlapping Irregular Blobs Spatial Stage                          */}
      {/* Blobs bleed into screen exteriors and overlap one another          */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative z-10 w-full h-screen min-h-[900px] overflow-hidden">
        {/* BLOB 1: Top-Left Titan Blob (Bleeds off Top & Left) */}
        <LivingOrganicBlob
          id="01"
          label="Titan Apex Pod"
          width={720}
          height={560}
          seed={3}
          lobes={9}
          irregularity={0.24}
          tone="white"
          floatDuration={22 * speedMultiplier}
          floatDelay={0}
          className="-top-24 -left-36 z-10"
          mouseSpringX={mouseSpringX}
          mouseSpringY={mouseSpringY}
          parallaxFactor={0.04}
        />

        {/* BLOB 2: Center Hero Obsidian Void (Deep Black Floating Island) */}
        <LivingOrganicBlob
          id="02"
          label="Obsidian Nexus Island"
          width={640}
          height={480}
          seed={8}
          lobes={8}
          irregularity={0.26}
          tone="black"
          floatDuration={18 * speedMultiplier}
          floatDelay={2}
          className="top-[22%] left-[32%] z-30"
          mouseSpringX={mouseSpringX}
          mouseSpringY={mouseSpringY}
          parallaxFactor={-0.05}
        />

        {/* BLOB 3: Right-Exterior Drifting Opal Blob (Bleeds off Right) */}
        <LivingOrganicBlob
          id="03"
          label="East Horizon Lobe"
          width={680}
          height={540}
          seed={12}
          lobes={9}
          irregularity={0.21}
          tone="white"
          floatDuration={25 * speedMultiplier}
          floatDelay={4}
          className="top-[8%] -right-32 z-20"
          mouseSpringX={mouseSpringX}
          mouseSpringY={mouseSpringY}
          parallaxFactor={0.035}
        />

        {/* BLOB 4: Bottom-Left Smoke Organic Pebble (Bleeds off Bottom-Left) */}
        <LivingOrganicBlob
          id="04"
          label="Smoke Anchor Pod"
          width={580}
          height={440}
          seed={19}
          lobes={7}
          irregularity={0.25}
          tone="smoke"
          floatDuration={20 * speedMultiplier}
          floatDelay={1}
          className="bottom-[-10%] -left-20 z-20"
          mouseSpringX={mouseSpringX}
          mouseSpringY={mouseSpringY}
          parallaxFactor={-0.03}
        />

        {/* BLOB 5: Bottom-Right Graphite Basin (Bleeds off Bottom-Right) */}
        <LivingOrganicBlob
          id="05"
          label="Graphite Basin"
          width={660}
          height={500}
          seed={27}
          lobes={8}
          irregularity={0.23}
          tone="graphite"
          floatDuration={24 * speedMultiplier}
          floatDelay={3}
          className="-bottom-20 right-[5%] z-20"
          mouseSpringX={mouseSpringX}
          mouseSpringY={mouseSpringY}
          parallaxFactor={0.045}
        />

        {/* BLOB 6: Central Translucent Glass Bridge Droplet */}
        <LivingOrganicBlob
          id="06"
          label="Glass Bridge Capsule"
          width={420}
          height={320}
          seed={34}
          lobes={7}
          irregularity={0.28}
          tone="glass"
          floatDuration={16 * speedMultiplier}
          floatDelay={5}
          className="top-[55%] left-[20%] z-40"
          mouseSpringX={mouseSpringX}
          mouseSpringY={mouseSpringY}
          parallaxFactor={0.06}
        />

        {/* BLOB 7: Micro Satellite Droplet (Top-Center Drift) */}
        <LivingOrganicBlob
          id="07"
          label="Satellite Droplet"
          width={280}
          height={220}
          seed={42}
          lobes={6}
          irregularity={0.25}
          tone="white"
          floatDuration={14 * speedMultiplier}
          floatDelay={2.5}
          className="top-[6%] left-[45%] z-15"
          mouseSpringX={mouseSpringX}
          mouseSpringY={mouseSpringY}
          parallaxFactor={-0.04}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Top Floating Control Capsule: Canvas Stage HUD                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border border-white/80 bg-white/85 px-6 py-2.5 shadow-[0_16px_40px_rgba(60,50,35,0.12)] backdrop-blur-2xl">
        <div className="flex items-center gap-2 pr-3 border-r border-neutral-200">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-black uppercase tracking-wider text-neutral-900">
            Organic Blob Canvas
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-600">
          <span>7 Liquid Pods Active</span>
          <span className="text-neutral-300">•</span>
          <span className="text-neutral-400">Move mouse to feel parallax physics</span>
        </div>
      </div>
    </div>
  );
}