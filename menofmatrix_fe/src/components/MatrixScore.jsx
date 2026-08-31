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

/* The Men of Matrix mark (its own dot-art "M") with an orange level
   rising through it up to the score. */
let DOT_CACHE = null;

function useMarkDots() {
  const [dots, setDots] = useState(DOT_CACHE);
  useEffect(() => {
    if (DOT_CACHE) return;
    let alive = true;
    fetch("/brand/menofmatrix-mark.svg")
      .then((r) => r.text())
      .then((txt) => {
        const doc = new DOMParser().parseFromString(txt, "image/svg+xml");
        const cs = [...doc.querySelectorAll("circle")].map((c) => ({
          cx: +c.getAttribute("cx"),
          cy: +c.getAttribute("cy"),
          r: +c.getAttribute("r"),
        }));
        DOT_CACHE = cs;
        if (alive) setDots(cs);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return dots;
}

function BrandM({ pct, size = 168, run = true }) {
  const dots = useMarkDots();
  const clipId = `mRise-${size}`;

  if (!dots) return <div style={{ width: size, height: size }} />;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const d of dots) {
    minX = Math.min(minX, d.cx - d.r);
    minY = Math.min(minY, d.cy - d.r);
    maxX = Math.max(maxX, d.cx + d.r);
    maxY = Math.max(maxY, d.cy + d.r);
  }
  const pad = 10;
  const vb = `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${
    maxY - minY + pad * 2
  }`;
  const fillLine = maxY - pct * (maxY - minY);

  return (
    <svg viewBox={vb} style={{ width: size, height: size, overflow: "visible" }}>
      <defs>
        <linearGradient id="mFill" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ea580c" />
          <stop offset="1" stopColor="#fdba74" />
        </linearGradient>
        <clipPath id={clipId}>
          <motion.rect
            x={minX - pad}
            width={maxX - minX + pad * 2}
            height={maxY - minY + pad * 2}
            initial={run ? { y: maxY + pad } : false}
            animate={{ y: fillLine }}
            transition={{ ...MORPH, delay: 0.15 }}
          />
        </clipPath>
      </defs>

      {/* ghost mark */}
      <g fill="rgba(10,10,10,0.14)">
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r} />
        ))}
      </g>
      {/* orange level */}
      <g
        clipPath={`url(#${clipId})`}
        fill="url(#mFill)"
        style={{ filter: "drop-shadow(0 0 2px rgba(234,88,12,0.4))" }}
      >
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx} cy={d.cy} r={d.r * 1.12} />
        ))}
      </g>
    </svg>
  );
}

/* ---------- expanded breakdown ---------- */
function ScorePanel() {
  const n = useCountUp(SCORE, { duration: 900 });
  const pct = SCORE / GOAL;
  return (
    <div className={`${poppins.className} flex w-full max-w-[340px] flex-col items-center`}>
      <span className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-900">
        Matrix Score
      </span>

      <BrandM pct={pct} size={112} run />

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[28px] font-semibold leading-none tabular-nums text-neutral-900">
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
          <span className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Matrix Score
          </span>

          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-5 -z-10 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(251,146,60,0.24), transparent 70%)",
              }}
            />
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
            >
              <BrandM pct={pct} size={188} run />
            </motion.div>
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[40px] font-semibold leading-none tabular-nums text-neutral-900">
              {n}
            </span>
            <span className="text-[11px] font-medium text-neutral-400">/ {GOAL}</span>
          </div>
          <span className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-orange-600">
            <TrendingUp className="h-3 w-3" strokeWidth={3} />+{DELTA}% this week
          </span>

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
