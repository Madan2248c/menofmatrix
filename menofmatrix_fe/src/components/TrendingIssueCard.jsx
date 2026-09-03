"use client";

import { useEffect, useMemo, useState } from "react";
import { communityFetch } from "@/lib/community";

export default function TrendingIssueCard() {
  const [poll, setPoll] = useState(null);
  useEffect(() => { communityFetch("/api/community/polls", { ttl: 60_000 }).then((json) => setPoll(json.data?.[0] || null)).catch(() => {}); }, []);
  const result = useMemo(() => {
    const options = poll?.options ?? [];
    if (!poll || !options.length) return { total: 0, options: [] };
    const total = options.reduce((sum, option) => sum + Number(option.votes || 0), 0);
    return { total, options: [...options].sort((a, b) => b.votes - a.votes).slice(0, 2).map((option) => ({ ...option, pct: total ? Math.round(option.votes / total * 100) : 0 })) };
  }, [poll]);

  if (!poll) return <article className="w-full max-w-[360px] rounded-[14px] border border-neutral-200 bg-white/70 p-6 text-center backdrop-blur-md"><svg viewBox="0 0 24 24" className="mx-auto h-6 w-6 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 21c4 0 7-2.7 7-6.5 0-3.5-2.7-5.8-5-8.5-.4 2-1.3 3.2-2.5 4.2.1-3.3-1.4-5.7-3.3-7.7C8 7 5 9.7 5 14.5 5 18.3 8 21 12 21Z" /></svg><p className="mt-3 text-sm font-semibold">Trending issue coming soon</p><p className="mt-1 text-xs leading-relaxed text-neutral-500">The first live Community Pulse question will become the public issue card.</p></article>;

  return <article className="group w-full max-w-[360px] overflow-hidden rounded-[14px] border border-white/70 bg-white/55 backdrop-blur-md transition-transform duration-500 hover:-translate-y-1">
    <div className="relative h-36 overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-700 to-neutral-300"><div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:12px_12px]" /><div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" /><div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-black/25 backdrop-blur-sm"><svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21c4 0 7-2.7 7-6.5 0-3.5-2.7-5.8-5-8.5-.4 2-1.3 3.2-2.5 4.2.1-3.3-1.4-5.7-3.3-7.7C8 7 5 9.7 5 14.5 5 18.3 8 21 12 21Z" /></svg></div><span className="absolute bottom-3 left-4 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />Live community issue</span></div>
    <div className="p-4"><h2 className="text-[18px] font-semibold leading-tight tracking-tight text-neutral-950">{poll.question}</h2><p className="mt-2 text-[12px] leading-relaxed text-neutral-600">Public results update as builders add their opinion. Sign in is required to vote.</p><div className="mt-3 text-[10px] text-neutral-500">{result.total.toLocaleString()} builders weighed in</div>{result.options.length > 0 && <><div className="mt-3 flex h-2 overflow-hidden rounded-full bg-neutral-200">{result.options.map((option, index) => <span key={option.id} style={{ width: `${option.pct}%` }} className={index === 0 ? "bg-neutral-900" : "bg-slate-400"} />)}</div><div className="mt-2 flex justify-between gap-3 text-[10px] text-neutral-600">{result.options.map((option) => <span key={option.id} className="truncate">{option.label} <b className="text-neutral-950">{option.pct}%</b></span>)}</div></>}</div>
  </article>;
}
