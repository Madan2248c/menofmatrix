"use client";

import { MotionConfig, LayoutGroup } from "motion/react";
import { MORPH } from "@/lib/motion";

/**
 * Site-wide motion context:
 *  - respects the OS "reduce motion" setting for everyone
 *  - one shared LayoutGroup so shared-element morphs across
 *    separate components (chip, pendant, poll) never collide
 *  - a sane default transition for layout animations
 */
export default function MotionProvider({ children }) {
  return (
    <MotionConfig reducedMotion="user" transition={MORPH}>
      <LayoutGroup>{children}</LayoutGroup>
    </MotionConfig>
  );
}
