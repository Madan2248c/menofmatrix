"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Poppins } from "next/font/google";
import { SPRING } from "@/lib/motion";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"] });

const SHADES = [
  "rgba(234,88,12,0.92)",
  "rgba(249,115,22,0.72)",
  "rgba(251,146,60,0.55)",
  "rgba(10,10,10,0.16)",
];

function useCountUp(target, run) {
  const [n, setN] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (!run) {
      setN(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const a = from.current;
    const dur = 650;
    let raf;
    const tick = (t) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(a + (target - a) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return n;
}

function PollCard({ poll, onVote }) {
  const [voted, setVoted] = useState(poll.myVote || null);
  const [saving, setSaving] = useState(false);
  const [counts, setCounts] = useState(() =>
    Object.fromEntries(poll.options.map((o) => [o.id, o.votes || 0]))
  );

  useEffect(() => {
    setVoted(poll.myVote || null);
    setCounts(Object.fromEntries(poll.options.map((o) => [o.id, o.votes || 0])));
  }, [poll]);

  const total = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts]
  );
  const shownTotal = useCountUp(total, true);

  const rankById = useMemo(() => {
    const order = [...poll.options].sort(
      (a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0)
    );
    return Object.fromEntries(order.map((o, i) => [o.id, i]));
  }, [poll.options, counts]);

  const rows = useMemo(() => {
    const withPct = poll.options.map((o) => ({
      ...o,
      count: counts[o.id] ?? 0,
      pct: total ? Math.round(((counts[o.id] ?? 0) / total) * 100) : 0,
    }));
    return voted ? [...withPct].sort((a, b) => b.count - a.count) : withPct;
  }, [poll.options, counts, total, voted]);

  const shade = (id) => SHADES[Math.min(rankById[id] ?? 3, 3)];
  const myPct = voted && total
    ? Math.round(((counts[voted] ?? 0) / total) * 100)
    : 0;

  async function vote(id) {
    if (voted || saving || !onVote) return;
    setSaving(true);
    try {
      const result = await onVote(poll.id, id);
      if (!result) return;
      setCounts(Object.fromEntries(result.options.map((o) => [o.id, o.votes || 0])));
      setVoted(id);
    } catch (err) {
      console.error("[poll] vote failed", err);
    } finally { setSaving(false); }
  }
  function reset() {
    setCounts(Object.fromEntries(poll.options.map((o) => [o.id, o.votes || 0])));
    setVoted(null);
  }

  return (
    <div className={`${poppins.className} w-full max-w-[380px] select-none`}>
      {/* kicker */}
      <div className="mb-2.5 flex h-4 items-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          {voted ? (
            <motion.div
              key="voted"
              initial={{ opacity: 0, scale: 0.7, y: -3 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING}
              className="flex items-center gap-1.5"
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-orange-600" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-600">
                Your voice is counted
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="live"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-900">
                Community pulse
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* the question */}
      <div
        className="mb-3.5 rounded-xl px-3.5 py-3"
        style={{
          background: "rgba(249,249,249,0.55)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      >
        <p className="text-[15px] font-medium leading-snug text-neutral-900">
          {poll.question}
        </p>
      </div>

      {/* where the crowd stands — always visible */}
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-neutral-900">
        <span className="flex -space-x-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full border border-white"
              style={{ background: SHADES[i] }}
            />
          ))}
        </span>
        <span className="tabular-nums">
          {shownTotal.toLocaleString()} people weighed in
        </span>
      </div>
      <div className="mb-4 flex h-2 w-full gap-[2px]">
        {poll.options.map((o) => {
          const pct = total ? ((counts[o.id] ?? 0) / total) * 100 : 0;
          return (
            <motion.span
              key={o.id}
              className="h-full first:rounded-l-full last:rounded-r-full"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={SPRING}
              style={{
                background: shade(o.id),
                outline:
                  voted === o.id ? "2px solid rgba(255,255,255,0.95)" : "none",
                outlineOffset: -2,
              }}
            />
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        {rows.map((o) => {
          const isPick = voted === o.id;
          const isTop = !!voted && rows[0]?.id === o.id;
          const shadow = [
            "0 1px 2px rgba(0,0,0,0.06)",
            "0 6px 18px -8px rgba(0,0,0,0.14)",
          ];
          if (isPick) shadow.push("inset 3px 0 0 rgba(234,88,12,0.95)");
          if (isTop) shadow.push("0 16px 30px -12px rgba(0,0,0,0.22)");
          return (
            <motion.button
              key={o.id}
              layout
              transition={SPRING}
              type="button"
              disabled={!!voted || saving}
              onClick={() => vote(o.id)}
              whileHover={voted ? undefined : { y: -1 }}
              whileTap={voted ? undefined : { scale: 0.99 }}
              className="relative flex items-center overflow-hidden rounded-xl px-4 py-2.5 text-left"
              style={{
                background: "#ffffff",
                boxShadow: shadow.join(", ") || "none",
                cursor: voted ? "default" : "pointer",
              }}
            >
              {voted && (
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 left-0"
                  style={{
                    background: isPick
                      ? "linear-gradient(90deg, rgba(234,88,12,0.18), rgba(234,88,12,0.06))"
                      : "linear-gradient(90deg, rgba(20,20,20,0.1), rgba(20,20,20,0.03))",
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${o.pct}%` }}
                  transition={{ ...SPRING, delay: 0.05 }}
                />
              )}

              <span className="relative z-10 flex flex-1 items-center gap-2">
                <span
                  className={`text-[13.5px] ${
                    isPick
                      ? "font-semibold text-orange-700"
                      : "font-medium text-neutral-900"
                  }`}
                >
                  {o.label}
                </span>
                {isPick && (
                  <span className="text-[9px] font-semibold uppercase tracking-wide text-orange-600/80">
                    your vote
                  </span>
                )}
                {isTop && (
                  <span className="flex items-center gap-0.5 rounded-full bg-neutral-900 px-1.5 py-0.5 text-[8.5px] font-semibold uppercase tracking-wide text-white">
                    <svg viewBox="0 0 12 12" className="h-2 w-2" fill="currentColor" aria-hidden>
                      <path d="M6 1l1.5 3 3.3.3-2.5 2.2.8 3.2L6 8.2 2.9 9.9l.8-3.2L1.2 4.3 4.5 4z" />
                    </svg>
                    majority
                  </span>
                )}
              </span>

              <AnimatePresence>
                {voted && (
                  <motion.span
                    key="pct"
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, delay: 0.12 }}
                    className={`relative z-10 ml-3 text-[12.5px] tabular-nums ${
                      isPick
                        ? "font-semibold text-orange-700"
                        : "font-semibold text-neutral-900"
                    }`}
                  >
                    {o.pct}%
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <motion.div
        layout
        className="mt-3 text-[11px] font-medium text-neutral-900"
      >
        {voted ? (
          <div className="flex items-center gap-1.5">
            <span>
              you&apos;re with the{" "}
              <span className="font-semibold text-orange-600">{myPct}%</span> who
              chose{" "}
              <span className="font-semibold text-neutral-900">
                {poll.options.find((o) => o.id === voted)?.label}
              </span>
            </span>
            <button
              type="button"
              onClick={reset}
              className="ml-auto shrink-0 text-[10px] font-semibold text-neutral-900 underline decoration-neutral-400 underline-offset-2 transition-colors hover:text-neutral-600"
            >
              Change vote
            </button>
          </div>
        ) : (
          <span>Add your voice — tap where you stand</span>
        )}
      </motion.div>
    </div>
  );
}

export default memo(PollCard);
