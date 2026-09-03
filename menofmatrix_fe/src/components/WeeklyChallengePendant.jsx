"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { motion } from "motion/react";
import { Hammer } from "lucide-react";
import FeaturePopout from "@/components/FeaturePopout";
import { communityFetch, clearCommunityCache } from "@/lib/community";
import { GLASS } from "@/lib/motion";

function formatRemaining(date, now) {
  if (!date) return "open";
  const seconds = Math.max(0, Math.floor((new Date(date).getTime() - now) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function ChallengePanel({ challenge, reload }) {
  const { data: session } = useSession();
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!challenge) return <div className="w-[340px] py-8 text-center"><p className="text-sm font-semibold">Next build challenge coming soon</p><p className="mt-2 text-xs text-neutral-500">The admin can publish the next brief when it is ready.</p></div>;

  const submit = async () => {
    if (!session?.memberToken) return signIn("google");
    if (!url.trim()) return setError("Add a project or repository URL.");
    setSaving(true); setError("");
    try {
      await communityFetch(`/api/community/challenges/${challenge.id}/entries`, { token: session.memberToken, method: "POST", body: JSON.stringify({ url, note }) });
      clearCommunityCache("/api/community/challenges/current"); setUrl(""); setNote(""); await reload();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return <div className="flex w-full max-w-[360px] flex-col"><div className="mb-2 flex items-center gap-2"><Hammer className="h-3.5 w-3.5 text-orange-500" /><span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Weekly Build Challenge</span></div><p className="text-sm font-medium leading-snug">{challenge.brief}</p><div className="mt-3 rounded-xl p-3" style={GLASS}><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Status</p><p className="mt-1 text-xl font-semibold capitalize">{challenge.status}</p></div><div className="mt-3"><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Entries · {challenge.entries?.length || 0}</p><div className="mt-2 max-h-36 space-y-1.5 overflow-auto">{challenge.entries?.map((entry) => <a key={entry.id} href={entry.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px]" style={GLASS}><span className="font-semibold">@{entry.author}</span><span className="ml-auto text-neutral-500">{entry.votes} votes ↗</span></a>)}{!challenge.entries?.length && <p className="rounded-lg border border-dashed border-neutral-200 p-3 text-center text-[10px] text-neutral-500">No submissions yet.</p>}</div></div>{challenge.status === "open" && <div className="mt-3 grid gap-2"><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Project or repository URL" className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none" /><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="What are you building? (optional)" className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none" /><button disabled={saving} onClick={submit} className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{session?.memberToken ? saving ? "Submitting…" : "Submit my build" : "Sign in to participate"}</button></div>}{error && <p className="mt-2 text-[10px] text-red-500">{error}</p>}</div>;
}

export default function WeeklyChallengePendant() {
  const { data: session } = useSession();
  const [challenge, setChallenge] = useState(null);
  const [now, setNow] = useState(0);
  const load = async () => {
    try { const json = await communityFetch("/api/community/challenges/current", { token: session?.memberToken, ttl: 60_000 }); setChallenge(json.data || null); } catch {}
  };
  useEffect(() => { load(); }, [session?.memberToken]);
  useEffect(() => { setNow(Date.now()); const id = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(id); }, []);
  const remaining = challenge ? formatRemaining(challenge.closes_at, now) : "soon";

  return <FeaturePopout label="Weekly Build Challenge" trigger={(open) => <div className="relative h-[92px] w-24"><svg className="absolute left-1/2 top-0 -translate-x-1/2" width="4" height="52"><path d="M2 0v52" stroke="rgba(38,30,26,.55)" strokeWidth="2" strokeLinecap="round" /></svg><motion.button onClick={open} animate={{ y: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute left-1/2 top-[46px] flex h-11 w-11 -translate-x-1/2 flex-col items-center justify-center rounded-full bg-neutral-950 text-white shadow-xl"><Hammer className="h-3 w-3 text-orange-300" /><span className="mt-0.5 text-[7.5px] font-bold">{remaining}</span></motion.button></div>}><ChallengePanel challenge={challenge} reload={load} /></FeaturePopout>;
}
