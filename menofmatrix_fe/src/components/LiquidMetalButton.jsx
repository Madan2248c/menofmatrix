"use client";

import { useState } from "react";

const VARIANTS = {
  silver: {
    base: "linear-gradient(135deg,#b9bdc4 0%,#f5f7f9 16%,#9aa0a8 34%,#eceef1 52%,#828892 68%,#d9dce0 84%,#a7acb3 100%)",
    text: "#181a1d",
    rim: "rgba(255,255,255,0.72)",
    glow: "rgba(120,130,150,0.35)",
  },
  gold: {
    base: "linear-gradient(135deg,#b3822f 0%,#f7e3a6 16%,#9c6d27 34%,#f1d78d 52%,#84591e 68%,#e8c974 84%,#ad8236 100%)",
    text: "#291d06",
    rim: "rgba(255,246,214,0.78)",
    glow: "rgba(180,140,60,0.35)",
  },
};

/**
 * Native "liquid metal" pill: layered metallic gradient that slowly flows,
 * plus a specular shine sweep and a rim/depth highlight. Renders as a button
 * (onClick) or a link (href).
 */
export default function LiquidMetalButton({
  children,
  onClick,
  href,
  newTab = false,
  variant = "silver",
  fontSize = 16,
  padding = "1rem 3rem",
  className = "",
}) {
  const [hover, setHover] = useState(false);
  const v = VARIANTS[variant] || VARIANTS.silver;
  const Tag = href ? "a" : "button";
  const tagProps = href
    ? { href, target: newTab ? "_blank" : undefined, rel: "noreferrer" }
    : { type: "button", onClick };

  return (
    <Tag
      {...tagProps}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`group relative inline-flex select-none items-center justify-center overflow-hidden rounded-full font-semibold leading-none transition-transform duration-200 active:scale-[0.97] ${className}`}
      style={{
        fontSize,
        padding,
        color: v.text,
        fontFamily:
          "var(--font-geist, ui-sans-serif), system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        letterSpacing: "0.01em",
        background: v.base,
        backgroundSize: "300% 300%",
        animation: `lm-flow ${hover ? 4 : 7}s linear infinite`,
        boxShadow: `
          inset 0 1.5px 0 ${v.rim},
          inset 0 -2px 3px rgba(0,0,0,0.38),
          inset 0 0 0 1px rgba(255,255,255,0.12),
          0 10px 30px ${v.glow},
          0 2px 6px rgba(0,0,0,0.28)`,
        textShadow: "0 1px 0 rgba(255,255,255,0.35), 0 -1px 1px rgba(0,0,0,0.25)",
        transform: hover ? "scale(1.03)" : "scale(1)",
      }}
    >
      {/* specular shine sweep */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3"
        style={{
          background:
            "linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.5) 45%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.5) 55%, transparent 75%)",
          filter: "blur(0.5px)",
          animation: `lm-shine ${hover ? 2.2 : 3.6}s ease-in-out infinite`,
        }}
      />
      {/* soft top gloss */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.45), rgba(255,255,255,0))",
        }}
      />
      <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
        {children}
      </span>

      <style>{`
        @keyframes lm-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes lm-shine {
          0% { transform: translateX(0); }
          60%,100% { transform: translateX(520%); }
        }
      `}</style>
    </Tag>
  );
}
