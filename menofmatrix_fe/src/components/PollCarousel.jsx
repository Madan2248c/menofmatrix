"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { signIn, useSession } from "next-auth/react";
import PollCard from "@/components/PollCard";
import { EASE } from "@/lib/motion";
import { communityFetch, clearCommunityCache } from "@/lib/community";

const INTERVAL = 9000;
const VOTE_HOLD = 6500;

export default function PollCarousel({ interval = INTERVAL }) {
  const { data: session } = useSession();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const [voteHold, setVoteHold] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const holdTimer = useRef(null);
  const swipeStart = useRef(null);
  const n = polls.length;
  const paused = hover || voteHold;

  const loadPolls = useCallback(async () => {
    try {
      const json = await communityFetch("/api/community/polls", { token: session?.memberToken, ttl: 60_000 });
      setPolls(json.data || []);
      setError("");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [session?.memberToken]);

  useEffect(() => { loadPolls(); }, [loadPolls]);

  const next = useCallback(() => setIndex((i) => (i + 1) % n), [n]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + n) % n), [n]);

  // reset the timer whenever the active poll changes
  useEffect(() => {
    progressRef.current = 0;
    setProgress(0);
  }, [index]);

  // rAF-driven auto-advance — freezes (keeps its position) while paused
  useEffect(() => {
    if (paused || n < 2) return;
    let raf;
    const startedAt = performance.now() - progressRef.current * interval;
    const loop = (t) => {
      const p = Math.min((t - startedAt) / interval, 1);
      progressRef.current = p;
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(loop);
      else setIndex((i) => (i + 1) % n);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [paused, n, interval, index]);

  // arrow-key navigation — ignored while typing and when there's nothing to page through
  useEffect(() => {
    if (n < 2) return;
    const onKey = (e) => {
      const t = e.target;
      if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n, next, prev]);

  useEffect(() => () => clearTimeout(holdTimer.current), []);

  const handleVoted = useCallback(() => {
    setVoteHold(true);
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => setVoteHold(false), VOTE_HOLD);
  }, []);

  const vote = useCallback(async (pollId, optionId) => {
    if (!session?.memberToken) {
      await signIn("google");
      return null;
    }
    const json = await communityFetch(`/api/community/polls/${pollId}/vote`, {
      token: session.memberToken,
      method: "POST",
      body: JSON.stringify({ option_id: optionId }),
    });
    clearCommunityCache("/api/community/polls");
    setPolls((current) => current.map((poll) => poll.id === pollId
      ? { ...poll, ...json.data, myVote: optionId }
      : poll));
    handleVoted();
    return json.data;
  }, [handleVoted, session?.memberToken]);

  if (loading) return <div className="h-[400px] w-full max-w-[380px] animate-pulse rounded-2xl bg-white/30" />;
  if (!polls.length) return <div className="flex h-[300px] w-full max-w-[380px] flex-col items-center justify-center rounded-2xl border border-white/70 bg-white/25 px-8 text-center backdrop-blur-sm"><p className="text-sm font-semibold text-neutral-900">Community Pulse is warming up</p><p className="mt-2 text-xs leading-relaxed text-neutral-500">No live poll is published yet. New questions will appear here automatically.</p>{error && <p className="mt-3 text-[10px] text-red-500">{error}</p>}</div>;

  return (
    <div
      className="relative flex select-none flex-col items-center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={() => setHover(false)}
    >
      <div
        className="relative w-[380px]"
        style={{ height: 400, touchAction: "pan-y" }}
        onPointerDown={(e) => {
          swipeStart.current = e.clientX;
        }}
        onPointerUp={(e) => {
          const dx = e.clientX - (swipeStart.current ?? e.clientX);
          swipeStart.current = null;
          if (dx < -50) next();
          else if (dx > 50) prev();
        }}
      >
        {polls.map((poll, i) => {
          const rel = (i - index + n) % n;
          const offset = rel > n / 2 ? rel - n : rel;
          const abs = Math.abs(offset);
          const isCenter = offset === 0;
          const visible = abs <= 1;
          return (
            <motion.div
              key={poll.id}
              className="absolute left-0 top-0 w-full"
              style={{
                filter: isCenter ? undefined : "blur(5px)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                pointerEvents: visible ? undefined : "none",
              }}
              animate={{
                x: `${offset * 52}%`,
                y: abs * 34,
                scale: isCenter ? 1 : 0.58,
                opacity: visible ? (isCenter ? 1 : 0.12) : 0,
                zIndex: 20 - abs,
              }}
              transition={{ duration: 0.9, ease: EASE }}
            >
              <div style={{ pointerEvents: isCenter ? "auto" : "none" }}>
                <PollCard poll={poll} onVote={isCenter ? vote : undefined} />
              </div>
              {!isCenter && visible && (
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show poll: ${poll.question}`}
                  className="absolute inset-0 cursor-pointer"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* progress dots — active one fills over the timer, greys out while paused */}
      <div className="-mt-2 flex items-center gap-1.5">
        {polls.map((p, i) => {
          const active = i === index;
          return (
            <button
              key={p.id}
              type="button"
              aria-label={`Go to poll ${i + 1}`}
              onClick={() => setIndex(i)}
              className="relative h-1.5 overflow-hidden rounded-full transition-all duration-300"
              style={{
                width: active ? 22 : 6,
                background: "rgba(10,10,10,0.14)",
              }}
            >
              {active && (
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${progress * 100}%`,
                    background: paused
                      ? "rgba(10,10,10,0.4)"
                      : "rgba(234,88,12,0.95)",
                    transition: "background 200ms ease",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
