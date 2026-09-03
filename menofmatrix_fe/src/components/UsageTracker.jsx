"use client";

import { useEffect, useState } from "react";
import { GLASS_PANEL } from "@/lib/motion";
import { communityFetch } from "@/lib/community";

function Leader({ leader, index }) {
  const label = leader.handle || "builder";
  return <div className="flex items-center gap-2 rounded-xl border border-white/75 bg-white/45 px-2 py-1.5 backdrop-blur-[2px]"><span className="w-4 text-center text-[11px] font-semibold text-neutral-400">{index + 1}</span>{leader.avatar_url ? <img src={leader.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" /> : <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-[9px] font-bold uppercase text-white">{label[0]}</span>}<span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-neutral-900">@{label}</span><span className="block truncate text-[9px] text-neutral-500">Community score</span></span><span className="text-[11px] font-semibold tabular-nums text-neutral-900">{leader.score}</span></div>;
}

export default function UsageTracker() {
  const [expanded, setExpanded] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    Promise.all([
      communityFetch("/api/community/rankings", { ttl: 120_000 }),
      communityFetch("/api/community/leaderboard?limit=10", { ttl: 60_000 }),
    ]).then(([tools, builders]) => {
      setRankings(tools.data || []);
      setLeaders(builders.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const close = (event) => event.key === "Escape" && setExpanded(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [expanded]);

  return <section className="w-full max-w-[300px] rounded-2xl border border-white/70 p-3" style={{ background: "rgba(249,249,249,0.20)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }} aria-label="Tool usage and builder leaderboard">
    <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-orange-600">Usage tracker</p><h2 className="mt-0.5 text-[15px] font-semibold tracking-tight text-neutral-900">Tools this week</h2></div><span className="rounded-full border border-white/90 bg-white/45 px-2 py-1 text-[9px] font-medium text-neutral-500">{rankings.length ? "Live" : "Coming soon"}</span></div>
    {rankings.length ? <div className="mt-3 grid grid-cols-2 gap-1.5">{rankings.slice(0, 4).map((tool) => <div key={tool.tool_slug} className="rounded-xl border border-white/80 bg-white/45 p-2"><p className="truncate text-[11px] font-semibold">{tool.name || tool.tool_slug}</p><p className="mt-1 text-lg font-semibold tabular-nums">{Number(tool.share)}%</p><p className="text-[9px] text-neutral-500">{tool.members} members</p></div>)}</div> : <div className="mt-3 rounded-xl border border-dashed border-neutral-300/80 bg-white/25 px-3 py-4 text-center"><svg viewBox="0 0 24 24" className="mx-auto h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 19V9m5 10V5m5 14v-7m5 7V3" strokeLinecap="round"/><path d="M2 21h20" strokeLinecap="round"/></svg><p className="mt-2 text-[11px] font-semibold text-neutral-700">Usage collection is being connected</p><p className="mt-1 text-[9px] leading-relaxed text-neutral-500">Verified tool activity will appear here automatically.</p></div>}
    <div className="my-3 h-px bg-white/90" />
    <div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Builders</p>{leaders.length > 3 && <button onClick={() => setExpanded(true)} className="rounded-full border border-white/90 bg-white/55 px-2 py-1 text-[10px] font-semibold text-neutral-600">Top {leaders.length}⌄</button>}</div>
    <div className="mt-2 flex flex-col gap-1.5">{leaders.length ? leaders.slice(0, 3).map((leader, index) => <Leader key={leader.id} leader={leader} index={index} />) : <p className="rounded-xl bg-white/30 px-3 py-3 text-center text-[10px] text-neutral-500">Leaderboard starts with the first community contribution.</p>}</div>
    {expanded && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/15 p-4 backdrop-blur-[4px]" role="dialog" aria-modal="true" onClick={() => setExpanded(false)}><div className="relative w-full max-w-[340px] rounded-[11px] p-4" style={GLASS_PANEL} onClick={(event) => event.stopPropagation()}><button onClick={() => setExpanded(false)} aria-label="Close leaderboard" className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-lg text-white">×</button><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-orange-600">Community</p><h3 className="mt-1 text-lg font-semibold">Builder leaderboard</h3><div className="mt-4 flex flex-col gap-1.5">{leaders.map((leader, index) => <Leader key={leader.id} leader={leader} index={index} />)}</div></div></div>}
  </section>;
}
