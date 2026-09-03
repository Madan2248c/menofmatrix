"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ChevronUp, Lightbulb, Plus, Star } from "lucide-react";
import { communityFetch, clearCommunityCache } from "@/lib/community";
import { GLASS, MORPH } from "@/lib/motion";

export default function IdeaBoard() {
  const { data: session } = useSession();
  const [ideas, setIdeas] = useState([]);
  const [sortBy, setSortBy] = useState("top");
  const [selectedId, setSelectedId] = useState(null);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await communityFetch(`/api/community/ideas?sort=${sortBy}`, { token: session?.memberToken, ttl: 60_000 });
      setIdeas(json.data || []); setError("");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [session?.memberToken, sortBy]);

  useEffect(() => { load(); }, [load]);
  const selected = useMemo(() => ideas.find((idea) => idea.id === selectedId), [ideas, selectedId]);

  const requireSignIn = async () => {
    if (session?.memberToken) return true;
    await signIn("google");
    return false;
  };

  const toggleVote = async (idea) => {
    if (!(await requireSignIn())) return;
    const method = idea.my_upvote ? "DELETE" : "POST";
    try {
      await communityFetch(`/api/community/ideas/${idea.id}/upvote`, { token: session.memberToken, method });
      clearCommunityCache(`/api/community/ideas?sort=${sortBy}`);
      await load();
    } catch (err) { setError(err.message); }
  };

  const submit = async () => {
    if (!title.trim() || !(await requireSignIn())) return;
    try {
      await communityFetch("/api/community/ideas", { token: session.memberToken, method: "POST", body: JSON.stringify({ title, body }) });
      clearCommunityCache("/api/community/ideas?sort=top"); clearCommunityCache("/api/community/ideas?sort=new");
      setTitle(""); setBody(""); setComposing(false); setSortBy("new");
    } catch (err) { setError(err.message); }
  };

  return <motion.div layout transition={MORPH} className="flex w-full max-w-[380px] select-none flex-col">
    <div className="mb-2.5 flex items-center gap-2"><Lightbulb className="h-3.5 w-3.5 text-orange-500" /><span className="text-[10px] font-semibold uppercase tracking-[0.16em]">Idea board</span></div>
    <AnimatePresence mode="wait" initial={false}>{selected ? <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><button onClick={() => setSelectedId(null)} className="mb-3 flex items-center gap-1 text-[10px] font-semibold text-neutral-500"><ArrowLeft className="h-3 w-3" />All ideas</button><div className="rounded-xl p-4" style={GLASS}><div className="flex items-start gap-3"><button onClick={() => toggleVote(selected)} className={`flex h-12 w-10 shrink-0 flex-col items-center justify-center rounded-lg ${selected.my_upvote ? "bg-orange-100 text-orange-700" : "bg-black/5"}`}><ChevronUp className="h-4 w-4" /><span className="text-xs font-semibold">{selected.votes}</span></button><div><div className="flex items-center gap-2"><h3 className="text-sm font-semibold leading-snug">{selected.title}</h3>{selected.status === "picked" && <span className="rounded-full bg-neutral-900 px-1.5 py-0.5 text-[8px] font-semibold text-white"><Star className="mr-0.5 inline h-2 w-2" />PICK</span>}</div><p className="mt-2 text-[11px] leading-relaxed text-neutral-600">{selected.body || "The author has not added a longer description."}</p><p className="mt-3 text-[10px] text-neutral-400">Suggested by @{selected.author} · {selected.status}</p></div></div></div><p className="mt-3 rounded-xl border border-dashed border-neutral-200 px-3 py-3 text-center text-[10px] text-neutral-500">Builder claims and enhancements will appear here when those database modules are enabled.</p></motion.div> : <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><p className="mb-3 text-[11px] text-neutral-500">Ideas the community wants built. Anyone can browse; sign in to contribute.</p><div className="mb-3 flex items-center gap-3"><div className="flex gap-2">{["top", "new"].map((key) => <button key={key} onClick={() => setSortBy(key)} className={`text-[11px] font-semibold capitalize ${sortBy === key ? "text-neutral-900 underline decoration-orange-400 decoration-2 underline-offset-4" : "text-neutral-400"}`}>{key}</button>)}</div><button onClick={async () => { if (await requireSignIn()) setComposing((value) => !value); }} className="ml-auto flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-semibold text-white"><Plus className="h-3 w-3" />Suggest</button></div>{composing && <div className="mb-3 grid gap-2 rounded-xl p-3" style={GLASS}><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} placeholder="A clear idea title" className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none" /><textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={3} placeholder="What problem does it solve?" className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs outline-none" /><button onClick={submit} className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white">Publish idea</button></div>}{loading ? <div className="h-44 animate-pulse rounded-xl bg-white/30" /> : ideas.length ? <div className="grid grid-cols-2 gap-2">{ideas.map((idea) => <motion.button layout key={idea.id} onClick={() => setSelectedId(idea.id)} className="rounded-xl p-3 text-left" style={GLASS}><div className="flex items-start gap-2"><span className="flex items-center gap-0.5 text-[10px] font-semibold text-orange-600"><ChevronUp className="h-3 w-3" />{idea.votes}</span><span className="line-clamp-3 text-[11px] font-semibold leading-snug">{idea.title}</span></div><p className="mt-2 truncate text-[9px] text-neutral-400">@{idea.author}</p></motion.button>)}</div> : <div className="rounded-xl border border-dashed border-neutral-200 px-5 py-8 text-center"><p className="text-xs font-semibold">No ideas yet</p><p className="mt-1 text-[10px] text-neutral-500">Sign in and suggest the first thing worth building.</p></div>}{error && <p className="mt-2 text-[10px] text-red-500">{error}</p>}</motion.div>}</AnimatePresence>
  </motion.div>;
}
