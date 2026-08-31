"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Poppins } from "next/font/google";
import { Lightbulb, ChevronUp } from "lucide-react";
import { BOUNCE, EASE } from "@/lib/motion";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const SPRING = BOUNCE;
const ROTATE_MS = 8000;

const colorFor = (s) =>
  `hsl(${([...s].reduce((a, c) => a + c.charCodeAt(0), 0) * 37) % 360} 52% 55%)`;

const IDEAS = [
  { title: "Prompt regression tester", votes: 142, builders: ["mira", "arjun"] },
  { title: "MCP server registry with health scores", votes: 98, builders: ["dev_ankit"] },
  { title: "One-click eval set from a chat", votes: 64, builders: ["raj_builds", "lena"] },
  { title: "Local model router", votes: 51, builders: [] },
];

/**
 * Launcher for the idea board — a glowing pile of idea notes that fans open
 * on hover. The front note cycles through ideas every 8s, showing each idea
 * with the top two people currently building it.
 */
export default function IdeaChip({ count = 6, picks = 2, ideas = IDEAS }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || ideas.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % ideas.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, ideas.length]);

  const idea = ideas[i % ideas.length];

  return (
    <motion.div
      className={`${poppins.className} group relative w-[210px]`}
      initial="rest"
      animate="rest"
      whileHover="hover"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* warm idea-glow */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10"
        style={{
          background:
            "radial-gradient(60% 60% at 32% 28%, rgba(251,146,60,0.4), transparent 72%)",
          borderRadius: "9999px",
        }}
        variants={{
          rest: { opacity: 0.45, scale: 1 },
          hover: { opacity: 0.95, scale: 1.1 },
        }}
        transition={{ duration: 0.4 }}
      />

      {/* stacked note behind — left */}
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.4)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          boxShadow: "0 8px 20px -12px rgba(0,0,0,0.25)",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
        variants={{
          rest: { rotate: -7, x: -7, y: 6 },
          hover: { rotate: -13, x: -17, y: 11 },
        }}
        transition={SPRING}
      />
      {/* stacked note behind — right */}
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          boxShadow: "0 8px 20px -12px rgba(0,0,0,0.22)",
          border: "1px solid rgba(255,255,255,0.5)",
        }}
        variants={{
          rest: { rotate: 4.5, x: 6, y: 3 },
          hover: { rotate: 10, x: 15, y: 6 },
        }}
        transition={SPRING}
      />

      {/* front note */}
      <motion.div
        className="relative rounded-2xl p-3.5"
        style={{
          background: "rgba(255,255,255,0.8)",
          backdropFilter: "blur(18px) saturate(160%)",
          WebkitBackdropFilter: "blur(18px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow:
            "0 1px 2px rgba(0,0,0,0.06), 0 18px 38px -14px rgba(0,0,0,0.24)",
        }}
        variants={{ rest: { y: 0 }, hover: { y: -3 } }}
        transition={SPRING}
      >
        <div className="flex items-center gap-2">
          <span
            className="relative flex h-6 w-6 items-center justify-center rounded-lg"
            style={{ background: "rgba(234,88,12,0.12)" }}
          >
            <Lightbulb className="h-3.5 w-3.5 text-orange-600" strokeWidth={2.5} />
            <motion.span
              className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-orange-400"
              animate={{ scale: [0.7, 1.25, 0.7], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            />
          </span>
          <span className="text-[12.5px] font-semibold text-neutral-900">
            Idea Board
          </span>
        </div>

        {/* rotating idea + its builders */}
        <div className="relative mt-2.5 min-h-[64px]">
          <motion.div
            key={i}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.34, ease: EASE }}
          >
            <div className="flex gap-2 rounded-lg bg-black/[0.035] px-2 py-1.5">
              <span className="mt-px flex shrink-0 items-center gap-0.5 text-orange-600">
                <ChevronUp className="h-2.5 w-2.5" strokeWidth={3} />
                <span className="text-[9px] font-bold tabular-nums">
                  {idea.votes}
                </span>
              </span>
              <span className="line-clamp-2 text-[10.5px] font-medium leading-snug text-neutral-700">
                {idea.title}
              </span>
            </div>

            <div className="mt-1.5 flex items-center gap-1.5 px-1">
              {idea.builders.length > 0 ? (
                <>
                  <div className="flex -space-x-1.5">
                    {idea.builders.slice(0, 2).map((b) => (
                      <span
                        key={b}
                        title={b}
                        className="flex h-4 w-4 items-center justify-center rounded-full border border-white text-[7px] font-bold uppercase text-white"
                        style={{ background: colorFor(b) }}
                      >
                        {b[0]}
                      </span>
                    ))}
                  </div>
                  <span className="truncate text-[8.5px] font-medium text-neutral-400">
                    {idea.builders.slice(0, 2).join(", ")}
                    {idea.builders.length > 2
                      ? ` +${idea.builders.length - 2}`
                      : ""}{" "}
                    building
                  </span>
                </>
              ) : (
                <span className="text-[8.5px] italic text-neutral-400">
                  open — nobody's building it yet
                </span>
              )}
            </div>
          </motion.div>
        </div>

        {/* 8s rotation progress */}
        <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-black/[0.06]">
          <motion.div
            key={`${i}-${paused}`}
            className="h-full rounded-full bg-orange-400"
            initial={{ width: "0%" }}
            animate={{ width: paused ? "0%" : "100%" }}
            transition={{ duration: paused ? 0 : ROTATE_MS / 1000, ease: "linear" }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-[9.5px] font-medium text-neutral-400">
          <span>
            {count} ideas · {picks} picks
          </span>
          <motion.span
            className="font-semibold text-neutral-900"
            variants={{ rest: { opacity: 0, x: -4 }, hover: { opacity: 1, x: 0 } }}
            transition={{ duration: 0.2 }}
          >
            open →
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}
