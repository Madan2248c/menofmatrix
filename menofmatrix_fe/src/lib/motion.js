// Shared motion + surface tokens.
// Every animated component on the site pulls from here so movement,
// timing and glass surfaces stay consistent.

/* ---- transitions ---- */

// micro-interactions: hovers, taps, list reorders, small state flips
export const SPRING = { type: "spring", stiffness: 360, damping: 34, mass: 0.9 };

// layout morphs: expand / collapse, shared-element (chip -> panel, tile -> detail)
export const MORPH = { type: "spring", stiffness: 240, damping: 28, mass: 0.9 };

// playful settle: note stacks, the pendulum swing-back
export const BOUNCE = { type: "spring", stiffness: 300, damping: 18, mass: 0.85 };

// expo-out curve for slides & fades
export const EASE = [0.22, 1, 0.36, 1];
export const FADE = { duration: 0.22, ease: EASE };
export const FADE_SLOW = { duration: 0.34, ease: EASE };

/* ---- entrance / exit variants ---- */

export const vFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const vFadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export const vScaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.97 },
};

// container that reveals children one after another
export const vStagger = {
  animate: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
};

/* ---- shared interaction props ---- */

export const hoverLift = { whileHover: { y: -1 }, whileTap: { scale: 0.98 } };
export const pressable = { whileTap: { scale: 0.96 } };

/* ---- glass surfaces ---- */

// inline cards inside a panel (idea tiles, enhancement rows, timer cards)
export const GLASS = {
  background: "rgba(255,255,255,0.66)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  boxShadow:
    "inset 0 0 0 1px rgba(255,255,255,0.55), 0 6px 18px -10px rgba(0,0,0,0.14)",
};

// the floating panel a feature morphs open into
export const GLASS_PANEL = {
  borderRadius: "11px",
  background: "rgba(249,249,249,0.58)",
  backdropFilter: "blur(22px) saturate(145%)",
  WebkitBackdropFilter: "blur(22px) saturate(145%)",
  border: "1px solid rgba(255,255,255,0.72)",
  boxShadow: "0 24px 64px -24px rgba(0,0,0,0.28)",
};

// opaque white card that must read on the busy dot-grid (poll options)
export const CARD = {
  background: "#ffffff",
  boxShadow: "0 1px 2px rgba(0,0,0,0.06), 0 6px 18px -8px rgba(0,0,0,0.14)",
};

/* ---- accent ---- */
export const ACCENT = "rgb(234,88,12)"; // orange-600
export const ACCENT_SOFT = "rgba(234,88,12,0.12)";
