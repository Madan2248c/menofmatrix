"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Poppins } from "next/font/google";
import { TrendingUp } from "lucide-react";
import FeaturePopout from "@/components/FeaturePopout";
import { MORPH, GLASS } from "@/lib/motion";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const GOAL = 1000;
const DELTA = 18; // % vs last week

const METRICS = [
  { key: "votes", label: "Votes cast", value: "412", note: "×1", pts: 412 },
  { key: "ideas", label: "Ideas added", value: "4", note: "×25", pts: 100 },
  { key: "builders", label: "Builders active", value: "4", note: "×40", pts: 160 },
  { key: "challenge", label: "Challenge progress", value: "46%", note: "of the week", pts: 70 },
];
const SCORE = METRICS.reduce((a, m) => a + m.pts, 0); // 742

/* the "M" as a dot matrix — 10 cols x 8 rows */
const M_ROWS = [
  [0, 1, 8, 9],
  [0, 1, 2, 7, 8, 9],
  [0, 1, 2, 3, 6, 7, 8, 9],
  [0, 1, 3, 4, 5, 8, 9],
  [0, 1, 4, 8, 9],
  [0, 1, 8, 9],
  [0, 1, 8, 9],
  [0, 1, 8, 9],
];
const M_DOTS = [];
M_ROWS.forEach((cols, row) => cols.forEach((col) => M_DOTS.push({ row, col })));
// light order: bottom rows first, then left-to-right — the M "charges up"
const FILL_RANK = new Map();
[...M_DOTS]
  .sort((a, b) => b.row - a.row || a.col - b.col)
  .forEach((d, k) => FILL_RANK.set(`${d.row}-${d.col}`, k));

function useCountUp(target, { duration = 1200, run = true } = {}) {
  const [n, setN] = useState(run ? 0 : target);
  useEffect(() => {
    if (!run) return setN(target);
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, run]);
  return n;
}

function DotM({ pct, spacing = 20, r = 6, run = true }) {
  const lit = Math.round(pct * M_DOTS.length);
  const w = spacing * 9 + r * 2;
  const h = spacing * 7 + r * 2;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: h }}>
      <defs>
        <radialGradient id="mDot" cx="34%" cy="30%">
          <stop offset="0" stopColor="#fdba74" />
          <stop offset="1" stopColor="#ea580c" />
        </radialGradient>
      </defs>
      {M_DOTS.map((d) => {
        const k = FILL_RANK.get(`${d.row}-${d.col}`);
        const isLit = k < lit;
        return (
          <motion.circle
            key={`${d.row}-${d.col}`}
            cx={r + d.col * spacing}
            cy={r + d.row * spacing}
            r={r}
            fill={isLit ? "url(#mDot)" : "rgba(10,10,10,0.1)"}
            initial={run ? { opacity: 0, scale: 0.3 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: run ? 0.12 + k * 0.02 : 0,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            style={{
              filter: isLit
                ? "drop-shadow(0 0 2.5px rgba(234,88,12,0.4))"
                : "none",
            }}
          />
        );
      })}
    </svg>
  );
}

/* ---------- expanded breakdown ---------- */
function ScorePanel() {
  const n = useCountUp(SCORE, { duration: 900 });
  const pct = SCORE / GOAL;
  return (
    <div className={`${poppins.className} flex w-full max-w-[340px] flex-col items-center`}>
      <span className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-900">
        Matrix Score
      </span>

      <DotM pct={pct} spacing={15} r={4.5} run />

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[30px] font-semibold leading-none tabular-nums text-neutral-900">
          {n}
        </span>
        <span className="text-[10px] font-medium text-neutral-400">/ {GOAL}</span>
      </div>
      <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-orange-600">
        <TrendingUp className="h-3 w-3" strokeWidth={3} />+{DELTA}% vs last week
      </div>

      <ul className="mt-3 w-full">
        {METRICS.map((m) => (
          <li
            key={m.key}
            className="mb-1.5 flex items-center gap-2 rounded-lg px-2.5 py-1.5"
            style={GLASS}
          >
            <span className="text-[11px] font-semibold text-neutral-900">{m.value}</span>
            <span className="text-[10.5px] font-medium text-neutral-500">{m.label}</span>
            <span className="ml-auto text-[9px] font-medium text-neutral-400">{m.note}</span>
            <span className="w-10 text-right text-[10px] font-semibold tabular-nums text-orange-600">
              +{m.pts}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-1 text-[9.5px] leading-snug text-neutral-400">
        One number for the community&apos;s momentum this week — votes, new ideas,
        active builders and challenge progress, rolled together and reset every
        Monday.
      </p>
    </div>
  );
}

/* ---------- canvas centerpiece ---------- */
export default function MatrixScore() {
  const n = useCountUp(SCORE);
  const pct = SCORE / GOAL;

  return (
    <FeaturePopout
      label="Matrix Score"
      trigger={
        <motion.div
          className={`${poppins.className} group flex flex-col items-center`}
          whileHover={{ y: -2 }}
          transition={MORPH}
        >
          <span className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Matrix Score
          </span>

          <div className="relative flex flex-col items-center">
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-8 -z-10 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(251,146,60,0.26), transparent 70%)",
              }}
            />
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
            >
              <DotM pct={pct} spacing={22} r={6.5} run />
            </motion.div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[38px] font-semibold leading-none tabular-nums text-neutral-900">
                {n}
              </span>
              <span className="text-[11px] font-medium text-neutral-400">
                / {GOAL}
              </span>
            </div>
            <span className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-orange-600">
              <TrendingUp className="h-3 w-3" strokeWidth={3} />+{DELTA}% this week
            </span>
          </div>

          <span className="mt-2 text-[9.5px] font-medium text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100">
            tap for the breakdown
          </span>
        </motion.div>
      }
    >
      <ScorePanel />
    </FeaturePopout>
  );
}
