"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { Poppins } from "next/font/google";
import { Hammer } from "lucide-react";
import FeaturePopout from "@/components/FeaturePopout";
import { GLASS } from "@/lib/motion";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

const DAY = 24 * 3600 * 1000;

const CHALLENGE = {
  title: "Turn a Claude chat into a runnable eval set",
  endsAt: Date.now() + 5 * DAY - 3 * 3600 * 1000,
  builders: [
    { name: "mira", enrolledAt: Date.now() - 2 * DAY - 4 * 3600 * 1000 },
    { name: "raj_builds", enrolledAt: Date.now() - 19 * 3600 * 1000 },
    { name: "sneha", enrolledAt: Date.now() - 3 * 3600 * 1000 },
  ],
};

const CARD_GLASS = GLASS;

const colorFor = (s) =>
  `hsl(${([...s].reduce((a, c) => a + c.charCodeAt(0), 0) * 37) % 360} 52% 55%)`;

function fmtShort(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtLong(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h || d) parts.push(`${h}h`);
  parts.push(`${m}m`);
  if (!d) parts.push(`${sec}s`);
  return parts.join(" ");
}

// null until mounted so SSR and first client render agree (no time-based
// hydration mismatch); starts ticking after mount.
function useNow(interval = 1000) {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

/* ---------------- expanded panel ---------------- */
function ChallengePanel({ challenge, enrolled, onEnroll }) {
  const now = useNow();
  const ready = now != null;
  const remaining = ready ? challenge.endsAt - now : 0;
  const mine = enrolled.some((b) => b.name === "you");

  return (
    <div className={`${poppins.className} flex w-full max-w-[360px] flex-col`}>
      <div className="mb-2 flex items-center gap-2">
        <Hammer className="h-3.5 w-3.5 text-orange-500" strokeWidth={2.5} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-900">
          Weekly Build Challenge
        </span>
      </div>
      <p className="text-[14px] font-medium leading-snug text-neutral-900">
        {challenge.title}
      </p>

      <div className="mt-3 rounded-xl p-3" style={CARD_GLASS}>
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          {remaining > 0 ? "Ends in" : "Closed"}
        </span>
        <div className="mt-0.5 text-[22px] font-semibold tabular-nums text-neutral-900">
          {ready ? fmtLong(remaining) : "· ·"}
        </div>
      </div>

      <div className="mt-3">
        <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
          Building now · {enrolled.length}
        </span>
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {enrolled.map((b, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5"
              style={CARD_GLASS}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold uppercase text-white"
                style={{ background: colorFor(b.name) }}
              >
                {b.name[0]}
              </span>
              <span className="text-[11px] font-semibold text-neutral-900">
                @{b.name}
              </span>
              <span className="ml-auto text-[10px] font-medium tabular-nums text-neutral-500">
                building {ready ? fmtLong(now - b.enrolledAt) : "· ·"}
              </span>
            </li>
          ))}
        </ul>

        {mine ? (
          <p className="mt-2 text-[10px] font-semibold text-orange-600">
            You&apos;re in — your timer is running.
          </p>
        ) : (
          <button
            type="button"
            onClick={onEnroll}
            disabled={remaining <= 0}
            className="mt-2 w-full rounded-lg bg-orange-500 px-3 py-2 text-[11px] font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-40"
          >
            Enroll &amp; start building
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- hanging pendant ---------------- */

const REST = 46; // resting cord length (anchor -> bob centre)
const ELASTIC = { type: "spring", stiffness: 200, damping: 8, mass: 1.15 };

// rubber-band resistance once past a soft limit
const soft = (v, lim) =>
  Math.abs(v) <= lim ? v : Math.sign(v) * (lim + (Math.abs(v) - lim) * 0.4);

// elastic cord as a quadratic curve: taut when stretched, a little slack at rest
function cordPath(dx, dy) {
  const bx = 200 + dx;
  const by = REST + dy;
  const len = Math.hypot(bx - 200, by);
  const sag = Math.max(1, 15 - len * 0.05);
  return `M 200 0 Q ${(200 + bx) / 2} ${by / 2 + sag} ${bx} ${by}`;
}

export default function WeeklyChallengePendant({ challenge = CHALLENGE }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const grab = useRef(null);
  const idle = useRef(null);
  const [enrolled, setEnrolled] = useState(challenge.builders);
  const now = useNow(30000);
  const remaining = now != null ? challenge.endsAt - now : null;

  const d = useTransform([x, y], ([dx, dy]) => cordPath(dx, dy));
  const strokeW = useTransform([x, y], ([dx, dy]) => {
    const len = Math.hypot(dx, REST + dy);
    return Math.max(1.3, 3.2 - len * 0.006);
  });

  function stopIdle() {
    if (idle.current) idle.current.on = false;
  }
  function startIdle() {
    stopIdle();
    const token = { on: true };
    idle.current = token;
    (async () => {
      while (token.on) {
        await animate(y, 4, { duration: 1.9, ease: "easeInOut" });
        if (!token.on) break;
        await animate(y, 0, { duration: 2.1, ease: "easeInOut" });
      }
    })();
  }

  function onDown(e) {
    stopIdle();
    x.stop();
    y.stop();
    grab.current = {
      px: e.clientX,
      py: e.clientY,
      ox: x.get(),
      oy: y.get(),
      moved: 0,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onMove(e) {
    const g = grab.current;
    if (!g) return;
    const dx = e.clientX - g.px;
    const dy = e.clientY - g.py;
    g.moved = Math.max(g.moved, Math.hypot(dx, dy));
    x.set(soft(g.ox + dx, 150));
    y.set(soft(g.oy + dy, 240));
  }
  function onUp(open) {
    const g = grab.current;
    grab.current = null;
    if (!g) return;
    animate(x, 0, ELASTIC);
    animate(y, 0, ELASTIC);
    if (g.moved < 5) open();
    else setTimeout(startIdle, 1100);
  }

  useEffect(() => {
    const t = setTimeout(startIdle, 1400);
    return () => {
      clearTimeout(t);
      stopIdle();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FeaturePopout
      label="Weekly Build Challenge"
      trigger={(open) => (
        <div
          className={`${poppins.className} relative`}
          style={{ height: 92, width: 96, overflow: "visible" }}
        >
          {/* elastic cord */}
          <motion.svg
            width="400"
            height="400"
            viewBox="0 0 400 400"
            style={{
              position: "absolute",
              left: "50%",
              marginLeft: -200,
              top: 0,
              overflow: "visible",
              pointerEvents: "none",
            }}
          >
            <motion.path
              d={d}
              fill="none"
              stroke="rgba(38,30,26,0.55)"
              strokeLinecap="round"
              style={{ strokeWidth: strokeW }}
            />
          </motion.svg>

          {/* weighted bob */}
          <motion.div
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={() => onUp(open)}
            onPointerCancel={() => onUp(open)}
            style={{
              x,
              y,
              position: "absolute",
              left: "50%",
              top: REST,
              marginLeft: -22,
              marginTop: -22,
              background: "radial-gradient(circle at 32% 28%, #3d3d42, #0d0d0f)",
              boxShadow:
                "0 12px 22px -8px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.22)",
            }}
            className="flex h-11 w-11 cursor-grab touch-none flex-col items-center justify-center rounded-full text-white select-none active:cursor-grabbing"
          >
            <Hammer className="h-3 w-3 text-orange-300" strokeWidth={2.5} />
            <span className="mt-0.5 text-[7.5px] font-bold leading-none tabular-nums">
              {remaining == null ? "· ·" : remaining > 0 ? fmtShort(remaining) : "done"}
            </span>
          </motion.div>
        </div>
      )}
    >
      <ChallengePanel
        challenge={challenge}
        enrolled={enrolled}
        onEnroll={() =>
          setEnrolled((p) => [...p, { name: "you", enrolledAt: Date.now() }])
        }
      />
    </FeaturePopout>
  );
}
