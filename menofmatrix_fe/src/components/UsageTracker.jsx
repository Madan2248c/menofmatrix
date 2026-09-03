"use client";

import { useEffect, useState } from "react";
import { GLASS_PANEL } from "@/lib/motion";
import { communityFetch } from "@/lib/community";

function Leader({ leader, index }) {
  const label = leader.handle || "builder";
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/75 bg-white/45 px-2 py-1.5 backdrop-blur-[2px]">
      <span className="w-4 text-center text-[11px] font-semibold text-neutral-400">
        {index + 1}
      </span>
      {leader.avatar_url ? (
        <img src={leader.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
      ) : (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-[9px] font-bold uppercase text-white">
          {label[0]}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[11px] font-semibold text-neutral-900">@{label}</span>
        <span className="block truncate text-[9px] text-neutral-500">Community score</span>
      </span>
      <span className="text-[11px] font-semibold tabular-nums text-neutral-900">{leader.score}</span>
    </div>
  );
}

export default function UsageTracker() {
  const [expanded, setExpanded] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    Promise.all([
      communityFetch("/api/community/rankings", { ttl: 120_000 }),
      communityFetch("/api/community/leaderboard?limit=10", { ttl: 60_000 }),
    ])
      .then(([tools, builders]) => {
        setRankings(tools.data || []);
        setLeaders(builders.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const close = (event) => event.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [expanded]);

  return (
    <section
      className="w-full max-w-[320px] rounded-2xl border border-white/70 p-3.5 shadow-sm"
      style={{
        background: "rgba(249,249,249,0.30)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      aria-label="AI Token Usage Tracker & Leaderboard"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-orange-600">
            MOM TOKEN TRACKER
          </p>
          <h2 className="mt-0.5 text-[15px] font-bold tracking-tight text-neutral-900">
            Agent Usage Rankings
          </h2>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-600">
          🔥 Live
        </span>
      </div>

      {/* AI Agents Grid */}
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {rankings.slice(0, 4).map((tool, idx) => (
          <div
            key={tool.tool_slug || idx}
            className="group relative rounded-xl border border-white/80 bg-white/55 p-2.5 transition-all hover:bg-white/80 hover:shadow-sm"
          >
            <div className="flex items-center justify-between gap-1">
              <p className="truncate text-[11px] font-bold text-neutral-900">
                {tool.name || tool.tool_slug}
              </p>
              <span className="text-[9px] font-bold text-orange-600">#{idx + 1}</span>
            </div>
            <p className="mt-1 text-base font-extrabold tabular-nums text-neutral-900">
              {tool.tokens || `${tool.share}%`}
            </p>
            <div className="mt-0.5 flex items-center justify-between text-[9px] text-neutral-500">
              <span>{tool.share}% share</span>
              <span>{tool.members} devs</span>
            </div>
          </div>
        ))}
      </div>

      {/* CLI CTA Banner */}
      <div className="mt-2.5 rounded-xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-amber-500/10 p-2 text-center">
        <p className="text-[9px] font-semibold text-orange-700">Track your local tokens:</p>
        <code className="mt-0.5 block rounded bg-neutral-900 px-1.5 py-1 text-[9.5px] font-mono text-emerald-400 selection:bg-orange-500 selection:text-white">
          mom-tracker install
        </code>
      </div>

      <div className="my-3 h-px bg-white/80" />

      {/* Builders Leaderboard */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
          Top Builders
        </p>
        {leaders.length > 3 && (
          <button
            onClick={() => setExpanded(true)}
            className="rounded-full border border-white/90 bg-white/65 px-2 py-0.5 text-[10px] font-semibold text-neutral-700 transition hover:bg-white"
          >
            Top {leaders.length} ⌄
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-1.5">
        {leaders.length ? (
          leaders.slice(0, 3).map((leader, index) => (
            <Leader key={leader.id || index} leader={leader} index={index} />
          ))
        ) : (
          <p className="rounded-xl bg-white/30 px-3 py-3 text-center text-[10px] text-neutral-500">
            Leaderboard starts with the first community contribution.
          </p>
        )}
      </div>

      {/* Expanded Modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20 p-4 backdrop-blur-[4px]"
          role="dialog"
          aria-modal="true"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative w-full max-w-[360px] rounded-[16px] p-5 shadow-2xl"
            style={GLASS_PANEL}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setExpanded(false)}
              aria-label="Close leaderboard"
              className="absolute -right-2.5 -top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white shadow"
            >
              ✕
            </button>

            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-orange-600">
              Community Rankings
            </p>
            <h3 className="mt-0.5 text-lg font-bold text-neutral-900">AI Agent Token Rankings</h3>

            <div className="mt-3 flex flex-col gap-2">
              {rankings.map((tool, idx) => (
                <div
                  key={tool.tool_slug || idx}
                  className="flex items-center justify-between rounded-xl border border-white/80 bg-white/60 p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-center text-xs font-bold text-neutral-400">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-neutral-900">{tool.name}</p>
                      <p className="text-[9px] text-neutral-500">{tool.members} developers</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-neutral-900">{tool.tokens}</p>
                    <p className="text-[9px] font-semibold text-orange-600">{tool.share}% share</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
