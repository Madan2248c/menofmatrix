"use client";

import { useEffect, useRef, useState } from "react";
import { Manrope } from "next/font/google";

export const manrope = Manrope({ subsets: ["latin"], weight: ["600", "700"] });

// Concave corner flare that joins a top-attached pill to the screen edge.
export function TopFlares({ color = "#0a0a0a", radius = 16 }) {
  const OV = 1.5;
  const one = (side) => {
    const at = side === "left" ? "0% 100%" : "100% 100%";
    return (
      <span
        key={side}
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          [side]: -radius,
          width: radius + OV,
          height: radius + OV,
          background: color,
          WebkitMaskImage: `radial-gradient(circle at ${at}, transparent ${radius}px, #000 ${radius}px)`,
          maskImage: `radial-gradient(circle at ${at}, transparent ${radius}px, #000 ${radius}px)`,
        }}
      />
    );
  };
  return (
    <>
      {one("left")}
      {one("right")}
    </>
  );
}

export function Eye({ size, pupilSize, pupilColor, eyeColor, rangePct, blink }) {
  const ref = useRef(null);
  const [p, setP] = useState({ x: 0, y: 0 });
  const maxOffset = ((size - pupilSize) / 2) * (rangePct / 100);

  useEffect(() => {
    function onMove(e) {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const clamped = Math.min(dist, maxOffset);
      setP({ x: (dx / dist) * clamped, y: (dy / dist) * clamped });
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [maxOffset]);

  return (
    <span
      ref={ref}
      className="relative inline-block shrink-0 overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: eyeColor,
        transform: blink ? "scaleY(0.08)" : "scaleY(1)",
        transition: "transform 90ms ease",
      }}
    >
      <span
        className="absolute rounded-full"
        style={{
          width: pupilSize,
          height: pupilSize,
          background: pupilColor,
          left: "50%",
          top: "50%",
          transform: `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px))`,
          transition: "transform 60ms linear",
        }}
      />
    </span>
  );
}

/**
 * A pill button with googly eyes whose pupils follow the cursor.
 * `attachTop` renders it hanging from the top edge with curved corner flares.
 */
export default function EyeFollowButton({
  children,
  text,
  onClick,
  href,
  newTab = false,
  buttonColor = "#0a0a0a",
  textColor = "#ffffff",
  pupilColor = "#000000",
  eyeColor = "#ffffff",
  eyeCount = 2,
  eyeSize = 22,
  pupilSize = 7,
  eyeGap = 4,
  rangePct = 90,
  blinking = false,
  blinkInterval = 2600,
  radius = 999,
  fontSize = 12,
  attachTop = false,
  bottomFlat = false,
  width = 214,
  height = 46,
  className = "",
}) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!blinking) return;
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 130);
    }, blinkInterval);
    return () => clearInterval(id);
  }, [blinking, blinkInterval]);

  const Tag = href ? "a" : "button";
  const tagProps = href
    ? { href, target: newTab ? "_blank" : undefined, rel: "noreferrer" }
    : { type: "button", onClick };

  const eyes = (
    <span className="flex shrink-0 items-center" style={{ gap: eyeGap }}>
      {Array.from({ length: eyeCount }).map((_, i) => (
        <Eye
          key={i}
          size={eyeSize}
          pupilSize={pupilSize}
          pupilColor={pupilColor}
          eyeColor={eyeColor}
          rangePct={rangePct}
          blink={blink}
        />
      ))}
    </span>
  );

  if (attachTop) {
    return (
      <Tag
        {...tagProps}
        className={`${manrope.className} relative inline-flex select-none items-center gap-2.5 whitespace-nowrap font-bold leading-none ${className}`}
        style={{
          background: buttonColor,
          color: textColor,
          borderRadius: bottomFlat ? "0" : "0 0 22px 22px",
          padding: "9px 22px 9px 14px",
          fontSize,
          boxShadow: bottomFlat ? "none" : "0 16px 30px rgba(0,0,0,0.26)",
          transition:
            "border-radius 260ms cubic-bezier(0.16,1,0.3,1), box-shadow 200ms ease",
        }}
      >
        <TopFlares color={buttonColor} />
        <span className="flex items-center gap-2.5">{children ?? text}</span>
        {eyes}
      </Tag>
    );
  }

  return (
    <Tag
      {...tagProps}
      className={`${manrope.className} inline-flex select-none items-center gap-2.5 font-bold leading-none transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97] ${className}`}
      style={{
        background: buttonColor,
        color: textColor,
        borderRadius: radius,
        padding: "6px 8px 6px 18px",
        fontSize,
      }}
    >
      <span className="whitespace-nowrap">{children ?? text}</span>
      {eyes}
    </Tag>
  );
}
