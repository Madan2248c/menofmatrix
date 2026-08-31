"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Poppins } from "next/font/google";
import {
  Lightbulb,
  ChevronUp,
  Star,
  Plus,
  ArrowLeft,
  CornerDownLeft,
} from "lucide-react";
import { SPRING, MORPH, GLASS, hoverLift } from "@/lib/motion";

function GithubMark({ className }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"] });

const CARD_GLASS = GLASS;

const SEED = [
  {
    id: 6,
    title: "Prompt regression tester",
    desc: "Catch when a prompt tweak silently breaks three other flows before it ships.",
    by: "mira",
    tag: "evals",
    votes: 142,
    pick: true,
    builders: [{ name: "mira", github: "https://github.com/mira" }],
    enhancements: [
      { by: "arjun", text: "Diff token-level logprobs, not just the final output." },
      { by: "lena", text: "Run it in CI and comment the regressions on the PR." },
    ],
  },
  {
    id: 5,
    title: "MCP server registry with health scores",
    desc: "Discover MCP servers and see uptime + latency before you wire one in.",
    by: "dev_ankit",
    tag: "infra",
    votes: 98,
    pick: false,
    builders: [],
    enhancements: [
      { by: "sam", text: "Show which clients each server has been tested against." },
    ],
  },
  {
    id: 4,
    title: "Context budget visualizer",
    desc: "Watch what's eating your context window, live, inside the editor.",
    by: "sneha",
    tag: "devtool",
    votes: 87,
    pick: false,
    builders: [],
    enhancements: [],
  },
  {
    id: 3,
    title: "One-click eval set from a chat",
    desc: "Turn a good conversation into a repeatable eval you can run forever.",
    by: "raj_builds",
    tag: "evals",
    votes: 64,
    pick: true,
    builders: [{ name: "raj_builds", github: "https://github.com/raj_builds" }],
    enhancements: [
      { by: "mira", text: "Auto-generate adversarial variants of each case." },
    ],
  },
  {
    id: 2,
    title: "Local model router",
    desc: "Cheap calls go to a local model, hard ones go to Claude — automatically.",
    by: "kavya",
    tag: "infra",
    votes: 51,
    pick: false,
    builders: [],
    enhancements: [],
  },
  {
    id: 1,
    title: "Screenshot to component diff",
    desc: "Paste a design screenshot, get the minimal JSX change to match it.",
    by: "tarun",
    tag: "frontend",
    votes: 39,
    pick: false,
    builders: [],
    enhancements: [],
  },
];

function Kicker({ children }) {
  return (
    <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
      {children}
    </span>
  );
}

export default function IdeaBoard() {
  const [ideas, setIdeas] = useState(SEED);
  const [voted, setVoted] = useState(() => new Set());
  const [reported] = useState(() => new Set());
  const [sortBy, setSortBy] = useState("top");
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [enhDraft, setEnhDraft] = useState("");
  const [buildDraft, setBuildDraft] = useState(null);

  const sorted = useMemo(() => {
    const arr = [...ideas];
    if (sortBy === "top") arr.sort((a, b) => b.votes - a.votes);
    else arr.sort((a, b) => b.id - a.id);
    return arr;
  }, [ideas, sortBy]);

  const selected = ideas.find((i) => i.id === selectedId) || null;

  function toggleVote(id) {
    const has = voted.has(id);
    setIdeas((prev) =>
      prev.map((i) => (i.id === id ? { ...i, votes: i.votes + (has ? -1 : 1) } : i))
    );
    setVoted((prev) => {
      const n = new Set(prev);
      has ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function submitIdea() {
    const t = draft.trim();
    if (!t) return;
    const id = Date.now();
    setIdeas((prev) => [
      { id, title: t, desc: "", by: "you", tag: null, votes: 1, pick: false, builders: [], enhancements: [] },
      ...prev,
    ]);
    setVoted((prev) => new Set(prev).add(id));
    setDraft("");
    setComposing(false);
    setSortBy("new");
  }

  function addEnhancement() {
    const t = enhDraft.trim();
    if (!t || !selected) return;
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === selected.id
          ? { ...i, enhancements: [...i.enhancements, { by: "you", text: t }] }
          : i
      )
    );
    setEnhDraft("");
  }

  function addBuilder() {
    if (!selected) return;
    const url = (buildDraft || "").trim();
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === selected.id
          ? { ...i, builders: [...i.builders, { name: "you", github: url || null }] }
          : i
      )
    );
    setBuildDraft(null);
  }

  const isSelVoted = selected && voted.has(selected.id);

  return (
    <motion.div
      layout
      transition={MORPH}
      className={`${poppins.className} flex w-full max-w-[380px] select-none flex-col`}
    >
      {/* header — always present */}
      <div className="mb-2.5 flex items-center gap-2">
        <Lightbulb className="h-3.5 w-3.5 text-orange-500" strokeWidth={2.5} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-900">
          Idea board
        </span>
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {selected ? (
          <motion.div
            key="detail"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
          >
            <button
              type="button"
              onClick={() => {
                setSelectedId(null);
                setBuildDraft(null);
              }}
              className="mb-2.5 flex items-center gap-1 text-[10px] font-semibold text-neutral-500 transition-colors hover:text-neutral-900"
            >
              <ArrowLeft className="h-3 w-3" strokeWidth={2.5} />
              All ideas
            </button>

            {/* the same card, morphed up from its grid tile */}
            <motion.div
              layoutId={`idea-card-${selected.id}`}
              transition={MORPH}
              className="rounded-xl p-3"
              style={CARD_GLASS}
            >
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => toggleVote(selected.id)}
                  className="flex h-11 w-9 shrink-0 flex-col items-center justify-center rounded-lg transition-colors"
                  style={{
                    background: isSelVoted ? "rgba(234,88,12,0.12)" : "rgba(10,10,10,0.05)",
                    color: isSelVoted ? "rgb(194,65,12)" : "rgb(64,64,64)",
                  }}
                >
                  <ChevronUp className="h-3.5 w-3.5" strokeWidth={3} />
                  <span className="text-[11px] font-semibold tabular-nums">
                    {selected.votes}
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-1.5">
                    <h3 className="flex-1 text-[13px] font-semibold leading-snug text-neutral-900">
                      {selected.title}
                    </h3>
                    {selected.pick && (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-neutral-900 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white">
                        <Star className="h-2 w-2 fill-orange-400 text-orange-400" />
                        Pick
                      </span>
                    )}
                  </div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.12 }}
                    className="mt-1 text-[11px] leading-snug text-neutral-600"
                  >
                    {selected.desc || "No description yet."}
                  </motion.p>
                  <div className="mt-1.5 flex items-center gap-1.5 text-[9.5px] text-neutral-400">
                    <span className="font-medium text-neutral-500">@{selected.by}</span>
                    {selected.tag && (
                      <>
                        <span className="text-neutral-300">·</span>
                        <span className="rounded bg-neutral-100/70 px-1 py-px font-medium text-neutral-500">
                          {selected.tag}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* expanded-only sections fade in after the card settles */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.14, duration: 0.26 }}
            >
              <div className="mt-3">
                <Kicker>Building this</Kicker>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {selected.builders.length === 0 && buildDraft === null && (
                    <span className="text-[10px] text-neutral-400">Nobody yet — claim it.</span>
                  )}
                  {selected.builders.map((b, i) =>
                    b.github ? (
                      <a
                        key={i}
                        href={b.github}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-full bg-neutral-900 px-2 py-0.5 text-[9.5px] font-semibold text-white transition-transform hover:scale-105"
                      >
                        <GithubMark className="h-2.5 w-2.5" />
                        {b.name}
                      </a>
                    ) : (
                      <span
                        key={i}
                        className="rounded-full bg-neutral-200/80 px-2 py-0.5 text-[9.5px] font-semibold text-neutral-600"
                      >
                        {b.name}
                      </span>
                    )
                  )}
                  {buildDraft === null ? (
                    <button
                      type="button"
                      onClick={() => setBuildDraft("")}
                      className="flex items-center gap-0.5 rounded-full bg-orange-500/10 px-2 py-0.5 text-[9.5px] font-semibold text-orange-700 transition-colors hover:bg-orange-500/20"
                    >
                      <Plus className="h-2.5 w-2.5" strokeWidth={3} />
                      I'm building this
                    </button>
                  ) : (
                    <div className="flex w-full items-center gap-1.5">
                      <input
                        value={buildDraft}
                        onChange={(e) => setBuildDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addBuilder()}
                        placeholder="github.com/you/repo (optional)"
                        className="min-w-0 flex-1 rounded-lg bg-white/70 px-2 py-1 text-[10px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={addBuilder}
                        className="rounded-lg bg-neutral-900 px-2 py-1 text-[9.5px] font-semibold text-white"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <Kicker>Enhancements · {selected.enhancements.length}</Kicker>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {selected.enhancements.map((e, i) => (
                    <li
                      key={i}
                      className="rounded-lg px-2.5 py-1.5 text-[10.5px] leading-snug text-neutral-700"
                      style={CARD_GLASS}
                    >
                      <span className="font-semibold text-neutral-900">@{e.by}</span>{" "}
                      {e.text}
                    </li>
                  ))}
                  {selected.enhancements.length === 0 && (
                    <li className="text-[10px] text-neutral-400">
                      Be the first to suggest an improvement.
                    </li>
                  )}
                </ul>
                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    value={enhDraft}
                    onChange={(e) => setEnhDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addEnhancement()}
                    placeholder="Suggest an enhancement…"
                    className="min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-[10.5px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                    style={CARD_GLASS}
                  />
                  <button
                    type="button"
                    onClick={addEnhancement}
                    disabled={!enhDraft.trim()}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500 text-white disabled:opacity-40"
                  >
                    <CornerDownLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
          >
            <p className="mb-3 text-[13px] font-medium leading-snug text-neutral-900">
              AI tools &amp; products the community wants built.
            </p>

            <div className="mb-2.5 flex items-center gap-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold">
                {["top", "new"].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setSortBy(k)}
                    className={`capitalize transition-colors ${
                      sortBy === k
                        ? "text-neutral-900 underline decoration-orange-400 decoration-2 underline-offset-4"
                        : "text-neutral-400 hover:text-neutral-600"
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setComposing((c) => !c)}
                className="ml-auto flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-semibold text-white transition-transform active:scale-95"
              >
                <Plus className="h-3 w-3" strokeWidth={3} />
                Suggest
              </button>
            </div>

            <AnimatePresence initial={false}>
              {composing && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={SPRING}
                  className="overflow-hidden"
                >
                  <div className="mb-2.5 rounded-xl p-2.5" style={CARD_GLASS}>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={2}
                      placeholder="A tool you wish existed…"
                      className="w-full resize-none bg-transparent text-[12.5px] leading-snug text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                    />
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[9px] text-neutral-400">
                        Posts instantly · anyone can report
                      </span>
                      <button
                        type="button"
                        onClick={submitIdea}
                        disabled={!draft.trim()}
                        className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-semibold text-white disabled:opacity-40"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-1.5">
              {sorted.map((idea) => {
                const isVoted = voted.has(idea.id);
                return (
                  <motion.button
                    key={idea.id}
                    layoutId={`idea-card-${idea.id}`}
                    transition={MORPH}
                    type="button"
                    onClick={() => setSelectedId(idea.id)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex min-h-[104px] flex-col rounded-xl p-2.5 text-left"
                    style={{ ...CARD_GLASS, opacity: reported.has(idea.id) ? 0.5 : 1 }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVote(idea.id);
                        }}
                        className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums transition-colors"
                        style={{
                          background: isVoted ? "rgba(234,88,12,0.12)" : "rgba(10,10,10,0.05)",
                          color: isVoted ? "rgb(194,65,12)" : "rgb(64,64,64)",
                        }}
                      >
                        <ChevronUp className="h-3 w-3" strokeWidth={3} />
                        {idea.votes}
                      </span>
                      {idea.pick && (
                        <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                      )}
                    </div>
                    <h4 className="mt-1.5 line-clamp-3 text-[11.5px] font-semibold leading-snug text-neutral-900">
                      {idea.title}
                    </h4>
                    <span className="mt-auto pt-1.5 text-[9px] font-medium text-neutral-400">
                      @{idea.by}
                      {idea.tag ? ` · ${idea.tag}` : ""}
                      {idea.builders?.length ? " · building" : ""}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-2.5 text-[10px] font-medium text-neutral-900">
              {ideas.length} ideas · tap one to expand
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
