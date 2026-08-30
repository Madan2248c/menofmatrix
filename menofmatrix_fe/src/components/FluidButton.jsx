"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";

/**
 * "Fluid Button" — a pill with a border that, on hover, fills with a colour
 * blob expanding from the cursor while the label swaps to a second colour.
 * Optional hover scale + idle pulse ring.
 */
export default function FluidButton({
  text = "Get in touch",
  href = "#",
  newTab = false,
  borderColor = "#0d0d0f",
  firstTextColor = "#0d0d0f",
  secondTextColor = "#ffffff",
  overlayColor = "#0d0d0f",
  scaleOnHover = true,
  scale = 1.05,
  baseScale = 1,
  pulse = true,
  className = "",
  children,
}) {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 110 });

  const setPoint = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (r) {
      setOrigin({
        x: ((e.clientX - r.left) / r.width) * 100,
        y: ((e.clientY - r.top) / r.height) * 100,
      });
    }
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      target={newTab ? "_blank" : undefined}
      rel="noreferrer"
      onMouseEnter={(e) => {
        setPoint(e);
        setHovered(true);
      }}
      onMouseLeave={(e) => {
        setPoint(e);
        setHovered(false);
      }}
      initial={{ scale: baseScale }}
      whileHover={scaleOnHover ? { scale: baseScale * scale } : undefined}
      whileTap={{ scale: baseScale * 0.97 }}
      transition={{ type: "tween", duration: 0.4, ease: [0.4, 0, 0, 1] }}
      className={`relative inline-flex select-none items-center justify-center overflow-hidden rounded-full px-4 py-2 text-[11.5px] font-semibold leading-none ${className}`}
      style={{
        border: `2px solid ${borderColor}`,
        color: hovered ? secondTextColor : firstTextColor,
        transition: "color .35s ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* fluid fill — a blob that grows from the cursor point */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute rounded-full"
        style={{
          background: overlayColor,
          left: `${origin.x}%`,
          top: `${origin.y}%`,
          width: 420,
          height: 420,
          marginLeft: -210,
          marginTop: -210,
        }}
        initial={{ scale: 0 }}
        animate={{ scale: hovered ? 1 : 0 }}
        transition={{ type: "tween", duration: 0.5, ease: [0.4, 0, 0, 1] }}
      />

      {/* idle pulse ring */}
      {pulse && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ border: `2px solid ${borderColor}` }}
          animate={hovered ? { opacity: 0 } : { scale: [1, 1.28], opacity: [0.45, 0] }}
          transition={hovered ? { duration: 0.2 } : { duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
        {children || text}
      </span>
    </motion.a>
  );
}
