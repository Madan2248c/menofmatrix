"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Poppins } from "next/font/google";
import {
  HiOutlinePencilSquare,
  HiOutlineEnvelopeOpen,
  HiOutlineRss,
  HiOutlineCalendar,
  HiOutlineArrowTopRightOnSquare,
  HiMiniSignal,
  HiOutlineArrowRight,
  HiOutlineArrowPath,
  HiOutlineExclamationTriangle,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineClock,
  HiOutlineShare,
  HiOutlineCheck,
  HiOutlineSparkles,
  HiOutlineBookOpen,
} from "react-icons/hi2";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const SOFT_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

// ---------------------------------------------------------------------------
// Procedural Organic SVG Blob Generator
// Produces genuine, irregular, multi-lobed amoeba / liquid contours.
// ---------------------------------------------------------------------------

function generateBlobPath(w, h, seed = 0, lobes = 8, irregularity = 0.18) {
  const cx = w / 2;
  const cy = h / 2;
  const rx = (w / 2) * 0.92;
  const ry = (h / 2) * 0.92;
  const pts = [];

  for (let i = 0; i < lobes; i++) {
    const angle = (i / lobes) * Math.PI * 2 - Math.PI / 2;
    // Harmonic wave variation based on seed and lobe index
    const wave = 1 + irregularity * Math.sin(i * 2.8 + seed * 1.7) + (irregularity * 0.5) * Math.cos(i * 1.5 + seed * 2.4);
    const x = cx + Math.cos(angle) * rx * wave;
    const y = cy + Math.sin(angle) * ry * wave;
    pts.push([Math.max(6, Math.min(w - 6, x)), Math.max(6, Math.min(h - 6, y))]);
  }

  const p = (i) => pts[((i % lobes) + lobes) % lobes];
  let d = `M ${p(0)[0].toFixed(1)} ${p(0)[1].toFixed(1)}`;

  for (let i = 0; i < lobes; i++) {
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }

  return `${d} Z`;
}

// ---------------------------------------------------------------------------
// Organic Blob Container (SVG Hull + Frosted Glass + Specular Highlights)
// ---------------------------------------------------------------------------

function OrganicBlobCard({
  seed = 0,
  lobes = 8,
  irregularity = 0.18,
  tone = "light",
  gradientClass = "from-white/95 via-white/90 to-pink-50/40",
  className = "",
  style = {},
  children,
  onClick,
}) {
  const containerRef = useRef(null);
  const [dim, setDim] = useState({ w: 400, h: 300 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDim({
          w: Math.max(200, Math.round(entry.contentRect.width)),
          h: Math.max(150, Math.round(entry.contentRect.height)),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const pathD = useMemo(
    () => generateBlobPath(dim.w, dim.h, seed, lobes, irregularity),
    [dim.w, dim.h, seed, lobes, irregularity]
  );

  const isDark = tone === "dark";

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`relative group ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        filter: isDark
          ? "drop-shadow(0 28px 60px rgba(0,0,0,0.38)) drop-shadow(0 2px 8px rgba(0,0,0,0.2))"
          : "drop-shadow(0 24px 54px rgba(60,50,35,0.08)) drop-shadow(0 2px 6px rgba(0,0,0,0.03))",
        ...style,
      }}
    >
      {/* SVG True Organic Blob Background */}
      <div
        className={`absolute inset-0 transition-transform duration-500 group-hover:scale-[1.01] ${
          isDark
            ? "bg-neutral-950/95"
            : `bg-gradient-to-br ${gradientClass} backdrop-blur-2xl`
        }`}
        style={{
          clipPath: `path('${pathD}')`,
          transitionTimingFunction: SOFT_EASE,
        }}
      />

      {/* Specular Rim Stroke SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-500 group-hover:scale-[1.01]">
        <path
          d={pathD}
          fill="none"
          stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.92)"}
          strokeWidth="1.5"
        />
      </svg>

      {/* Internal Content Slot (Safely Padded inside the Blob Center) */}
      <div className="relative z-10 p-6 sm:p-9 h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers: Read Time & Formatter
// ---------------------------------------------------------------------------

function estimateReadTime(text) {
  if (!text) return "3 min read";
  const words = text.replace(/<[^>]*>/g, "").split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Modal Reader Sanctum (Interactive Deep Dive)
// ---------------------------------------------------------------------------

function ReaderModal({ item, type, onClose }) {
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [content, setContent] = useState({ loading: type === "blog", html: null, error: false });
  const isNews = type === "news";
  const date = formatDate(item?.published_at || item?.created_at);
  const readTime = estimateReadTime(content.html || item?.excerpt);

  useEffect(() => {
    if (type !== "blog" || !item?.slug) return;
    let alive = true;
    fetch(`/api/blog/${encodeURIComponent(item.slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((json) => {
        if (alive) setContent({ loading: false, html: json?.post?.content_html || "", error: false });
      })
      .catch(() => {
        if (alive) setContent({ loading: false, html: null, error: true });
      });
    return () => { alive = false; };
  }, [item?.slug, type]);

  function handleScroll(e) {
    const el = e.target;
    const max = el.scrollHeight - el.clientHeight;
    if (max > 0) setScrollProgress((el.scrollTop / max) * 100);
  }

  function handleCopy() {
    const url = isNews && item?.link ? item.link : window.location.href;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90dvh] overflow-hidden rounded-[36px] sm:rounded-[44px] border border-white/90 bg-white/95 shadow-[0_32px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
        {/* Progress Bar */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-neutral-100 z-30">
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 sm:p-8 pb-4 border-b border-neutral-100 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                isNews ? "bg-blue-100/80 text-blue-700" : "bg-rose-100/80 text-rose-700"
              }`}>
                {isNews ? <HiOutlineRss className="h-3.5 w-3.5" /> : <HiOutlinePencilSquare className="h-3.5 w-3.5" />}
                {isNews ? (item.source || "AI Radar") : "Matrix Editorial"}
              </span>
              {date && (
                <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                  <HiOutlineCalendar className="h-3.5 w-3.5" /> {date}
                </span>
              )}
              <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                <HiOutlineClock className="h-3.5 w-3.5" /> {readTime}
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-neutral-900 leading-tight">
              {item.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              title={copied ? "Copied!" : "Copy Link"}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors cursor-pointer shadow-xs"
            >
              {copied ? <HiOutlineCheck className="h-4 w-4 text-emerald-600" /> : <HiOutlineShare className="h-4 w-4" />}
            </button>
            {isNews && item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-2xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-neutral-800 transition-all cursor-pointer"
              >
                <span>Source</span>
                <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors cursor-pointer shadow-xs"
            >
              <HiOutlineXMark className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 sm:p-8 pt-4 space-y-6 text-neutral-700 leading-relaxed [scrollbar-width:thin]"
        >
          {!isNews && item.cover_image_url && (
            <div className="aspect-[16/8] w-full overflow-hidden rounded-3xl bg-neutral-100 shadow-sm ring-1 ring-black/5">
              <img src={item.cover_image_url} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          {isNews ? (
            <div className="space-y-4">
              <p className="text-sm sm:text-base leading-relaxed text-neutral-700">
                {item.excerpt || item.summary || item.description || "Live dispatch from the AI radar stream."}
              </p>
              {item.link && (
                <div className="pt-4 border-t border-neutral-100">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-neutral-800 transition-all"
                  >
                    <span>Read Full Coverage on {item.source || "External Source"}</span>
                    <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          ) : content.loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-1/3 rounded-full bg-neutral-200/80" />
              <div className="space-y-2 pt-2">
                {[95, 98, 90, 80, 92, 70, 88].map((w, i) => (
                  <div key={i} className="h-3.5 rounded-full bg-neutral-200/60" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          ) : content.error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <HiOutlineExclamationTriangle className="h-7 w-7 text-neutral-400" />
              <p className="text-xs text-neutral-500">Could not fetch full article text.</p>
              <p className="text-sm text-neutral-600 max-w-md">{item.excerpt}</p>
            </div>
          ) : content.html ? (
            <div
              className="prose prose-neutral max-w-none text-sm sm:text-base leading-relaxed [&_h1]:text-xl [&_h1]:font-black [&_h2]:text-lg [&_h2]:font-bold [&_p]:my-3.5 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-blue-600 [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: content.html }}
            />
          ) : (
            <p className="text-sm leading-relaxed text-neutral-600">{item.excerpt}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page: Fluid Organic Cosmos Archipelago
// ---------------------------------------------------------------------------

export default function FeedPage() {
  const [data, setData] = useState(null);
  const [dataError, setDataError] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subMessage, setSubMessage] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [category, setCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [readingItem, setReadingItem] = useState(null);

  const loadFeed = useCallback(() => {
    fetch("/api/feed")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(setData)
      .catch(() => setDataError(true));
  }, []);

  useEffect(() => {
    loadFeed();
    function handleMouseMove(e) { setMousePos({ x: e.clientX, y: e.clientY }); }
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [loadFeed]);

  const isLoading = !data;
  const blogs = useMemo(() => data?.blogs || [], [data]);
  const news = useMemo(() => data?.news || [], [data]);

  const filteredBlogs = useMemo(() => {
    if (category === "news") return [];
    let list = blogs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((b) => b.title?.toLowerCase().includes(q) || b.excerpt?.toLowerCase().includes(q));
    }
    return list;
  }, [category, blogs, searchQuery]);

  const filteredNews = useMemo(() => {
    if (category === "blog") return [];
    let list = news;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((n) => n.title?.toLowerCase().includes(q) || n.source?.toLowerCase().includes(q));
    }
    return list;
  }, [category, news, searchQuery]);

  async function handleSubscribe(e) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setSubMessage(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const resData = await res.json();
      if (res.ok) {
        setSubMessage({ type: "success", text: resData.alreadySubscribed ? "You're already subscribed!" : "Welcome to the Alpha Network!" });
        setEmail("");
      } else {
        setSubMessage({ type: "error", text: resData.error || "Subscription failed." });
      }
    } catch {
      setSubMessage({ type: "error", text: "Network error. Try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const heroBlog = filteredBlogs[0];
  const secondaryBlogs = filteredBlogs.slice(1, 3);
  const remainingBlogs = filteredBlogs.slice(3);

  return (
    <div className={`${poppins.className} relative min-h-dvh w-full bg-[#fbf9f6] text-neutral-900 overflow-x-hidden selection:bg-rose-500 selection:text-white pb-36`}>
      {/* Dynamic Ambient Background Canvas */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-75"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}px ${mousePos.y}px, rgba(244,114,182,0.08), rgba(168,85,247,0.05), transparent 70%)`,
        }}
      />
      <div className="pointer-events-none fixed -top-32 left-10 h-[480px] w-[480px] rounded-full bg-gradient-to-tr from-pink-300/20 via-rose-200/15 to-transparent blur-[130px]" />
      <div className="pointer-events-none fixed top-1/3 right-10 h-[520px] w-[520px] rounded-full bg-gradient-to-bl from-blue-300/15 via-indigo-200/10 to-transparent blur-[140px]" />
      <div className="pointer-events-none fixed -bottom-20 left-1/3 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-amber-300/15 via-purple-200/10 to-transparent blur-[130px]" />

      {/* Main Content Cosmos */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* ------------------------------------------------------------------ */}
        {/* Header Archipelago: Title, Category Pills & Search Capsule        */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-8 border-b border-neutral-200/60">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white/90 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-neutral-600 shadow-xs backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Organic Knowledge Archipelago</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-neutral-900">
              Matrix <span className="bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">Dispatches</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md">
              Curated intelligence drops, deep research breakthroughs, and real-time AI radar.
            </p>
          </div>

          {/* Interactive Search & Filter Matrix */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Search Capsule */}
            <div className="relative w-full sm:w-72">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
                <HiOutlineMagnifyingGlass className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ideas, tags, sources..."
                className="w-full rounded-full border border-neutral-200/80 bg-white/90 pl-10 pr-9 py-2.5 text-xs font-medium text-neutral-900 placeholder-neutral-400 shadow-xs backdrop-blur-xl focus:border-neutral-400 focus:bg-white focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  <HiOutlineXMark className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pill */}
            <div className="flex items-center gap-1 rounded-full border border-neutral-200/80 bg-white/90 p-1 shadow-xs backdrop-blur-xl">
              {[
                { id: "all", label: "All Streams", count: blogs.length + news.length },
                { id: "blog", label: "Articles", count: blogs.length },
                { id: "news", label: "AI Radar", count: news.length },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    category === cat.id
                      ? "bg-neutral-900 text-white shadow-sm scale-102"
                      : "text-neutral-600 hover:text-black hover:bg-neutral-100/80"
                  }`}
                  style={{ transitionTimingFunction: SOFT_EASE }}
                >
                  <span>{cat.label}</span>
                  {!isLoading && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      category === cat.id ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-500"
                    }`}>
                      {cat.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Irregular Organic Blobs Grid                                       */}
        {/* ------------------------------------------------------------------ */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 rounded-[48px] bg-white/70 border border-white/80 animate-pulse p-6 shadow-sm space-y-4">
                <div className="h-5 w-28 rounded-full bg-neutral-200" />
                <div className="h-8 w-3/4 rounded-2xl bg-neutral-200/70" />
                <div className="h-24 w-full rounded-3xl bg-neutral-200/40" />
              </div>
            ))}
          </div>
        ) : dataError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <HiOutlineExclamationTriangle className="h-10 w-10 text-neutral-400" />
            <h3 className="text-base font-bold text-neutral-800">Knowledge Stream Offline</h3>
            <p className="text-xs text-neutral-500">Could not sync dispatches from the Matrix backend.</p>
            <button
              onClick={loadFeed}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-neutral-800 transition-all cursor-pointer"
            >
              <HiOutlineArrowPath className="h-4 w-4" /> Retry Connection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 pt-8 items-start">
            {/* ---------------------------------------------------------------- */}
            {/* BLOB 1: The Prime Nexus Amoeba (Irregular Lobe Seed = 1)          */}
            {/* ---------------------------------------------------------------- */}
            {heroBlog && (
              <div className="lg:col-span-8">
                <OrganicBlobCard
                  seed={1}
                  lobes={9}
                  irregularity={0.22}
                  gradientClass="from-white/95 via-white/90 to-rose-50/40"
                  onClick={() => setReadingItem({ type: "blog", item: heroBlog })}
                  className="min-h-[420px]"
                >
                  <div>
                    {/* Header Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
                        <span className="rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-rose-600">
                          Prime Nexus Drop
                        </span>
                        <span className="flex items-center gap-1 rounded-full bg-neutral-100/90 px-3 py-1 text-[11px] font-semibold text-neutral-600">
                          <HiOutlineClock className="h-3.5 w-3.5" /> {estimateReadTime(heroBlog.content_html || heroBlog.excerpt)}
                        </span>
                      </div>
                      {formatDate(heroBlog.published_at || heroBlog.created_at) && (
                        <span className="text-[11px] font-semibold text-neutral-400">
                          {formatDate(heroBlog.published_at || heroBlog.created_at)}
                        </span>
                      )}
                    </div>

                    {/* Headline & Excerpt */}
                    <div className="space-y-3">
                      <h2 className="text-xl sm:text-3xl font-black text-neutral-900 leading-tight group-hover:text-rose-600 transition-colors">
                        {heroBlog.title}
                      </h2>
                      {heroBlog.excerpt && (
                        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed line-clamp-3 max-w-2xl">
                          {heroBlog.excerpt}
                        </p>
                      )}
                    </div>

                    {/* Cover Artwork */}
                    {heroBlog.cover_image_url && (
                      <div className="mt-5 aspect-[16/8] w-full overflow-hidden rounded-[28px] bg-neutral-100 ring-1 ring-black/5 shadow-inner">
                        <img
                          src={heroBlog.cover_image_url}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-neutral-100/80">
                    <div className="flex items-center gap-2 text-xs font-black text-rose-600">
                      <span>Enter Deep Dive</span>
                      <HiOutlineArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                    <span className="text-[11px] text-neutral-400 font-medium">Click blob to read full story</span>
                  </div>
                </OrganicBlobCard>
              </div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* BLOB 2: AI Radar Liquid Amoeba (Irregular Lobe Seed = 2)          */}
            {/* ---------------------------------------------------------------- */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <OrganicBlobCard
                seed={2}
                lobes={8}
                irregularity={0.2}
                gradientClass="from-white/95 via-blue-50/30 to-indigo-50/20"
                className="min-h-[380px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xs">
                        <HiMiniSignal className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">AI Radar Stream</h3>
                        <p className="text-[10px] text-neutral-400">Live autonomous signal radar</p>
                      </div>
                    </div>
                    <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                  </div>

                  {/* News Stream List */}
                  <div className="divide-y divide-neutral-100">
                    {filteredNews.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setReadingItem({ type: "news", item })}
                        className="group/news py-3 first:pt-1 last:pb-1 cursor-pointer transition-all hover:translate-x-1"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {item.source || "AI Radar"}
                          </span>
                          {formatDate(item.published_at || item.created_at) && (
                            <span className="text-[9px] font-medium text-neutral-400">
                              {formatDate(item.published_at || item.created_at)}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold leading-snug text-neutral-800 group-hover/news:text-blue-600 transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                      </div>
                    ))}
                    {filteredNews.length === 0 && (
                      <div className="py-6 text-center text-xs text-neutral-400">
                        No live radar signals matching your search.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-100/80 flex items-center justify-between text-[10px] text-neutral-400">
                  <span>Continuous RSS ingest active</span>
                  <span className="text-blue-600 font-bold">{filteredNews.length} signals</span>
                </div>
              </OrganicBlobCard>

              {/* Mini Audio Synthesis Pulse Bubble */}
              <div className="relative overflow-hidden rounded-[36px] border border-white/90 bg-white/90 p-5 shadow-[0_12px_36px_rgba(60,50,35,0.06)] backdrop-blur-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-end gap-1 h-5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        className="w-1 bg-gradient-to-t from-pink-500 to-purple-600 rounded-full"
                        style={{
                          height: `${8 + (i * 3)}px`,
                        }}
                      />
                    ))}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-neutral-900">Synthesis Radar Pulse</div>
                    <div className="text-[9px] text-neutral-400">Live intelligence pipeline</div>
                  </div>
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
                  <HiOutlineSparkles className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* BLOB 3: Secondary Editorial Blobs (Irregular Lobe Seed = 3 & 4)   */}
            {/* ---------------------------------------------------------------- */}
            {secondaryBlogs.map((blog, idx) => (
              <div key={blog.id} className="lg:col-span-4">
                <OrganicBlobCard
                  seed={idx + 3}
                  lobes={8}
                  irregularity={0.21}
                  gradientClass={
                    idx === 0
                      ? "from-white/95 via-purple-50/25 to-pink-50/20"
                      : "from-white/95 via-amber-50/25 to-rose-50/20"
                  }
                  onClick={() => setReadingItem({ type: "blog", item: blog })}
                  className="min-h-[360px]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-full bg-neutral-100/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-700">
                        Editorial Deep Dive
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-400 flex items-center gap-1">
                        <HiOutlineClock className="h-3 w-3" /> {estimateReadTime(blog.content_html || blog.excerpt)}
                      </span>
                    </div>

                    {blog.cover_image_url && (
                      <div className="mb-3.5 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/5">
                        <img src={blog.cover_image_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      </div>
                    )}

                    <h3 className="text-sm sm:text-base font-black text-neutral-900 leading-snug group-hover:text-purple-600 transition-colors line-clamp-2">
                      {blog.title}
                    </h3>
                    {blog.excerpt && (
                      <p className="mt-1.5 text-xs text-neutral-500 leading-relaxed line-clamp-2">
                        {blog.excerpt}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-xs font-black text-neutral-900 group-hover:text-purple-600 transition-colors">
                    <span>Read Analysis</span>
                    <HiOutlineArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </OrganicBlobCard>
              </div>
            ))}

            {/* ---------------------------------------------------------------- */}
            {/* BLOB 4: Obsidian Alpha Dispatch (Irregular Dark Amoeba Seed = 5)  */}
            {/* ---------------------------------------------------------------- */}
            <div className="lg:col-span-4">
              <OrganicBlobCard
                seed={5}
                lobes={9}
                irregularity={0.24}
                tone="dark"
                className="min-h-[360px] text-white"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-md">
                      <HiOutlineEnvelopeOpen className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">Alpha Dispatch</h3>
                      <p className="text-[10px] text-neutral-400">Weekly intelligence drops</p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Exclusive system prompts, research models, and digital culture delivered directly to your inbox.
                  </p>
                </div>

                <form onSubmit={handleSubscribe} className="space-y-2.5 pt-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your work email..."
                    required
                    className="w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs text-white placeholder-neutral-500 backdrop-blur-md focus:border-white/40 focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-white py-2.5 text-xs font-black text-neutral-950 shadow-md hover:bg-neutral-100 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting ? "Transmitting..." : <>Join 2,400+ Pioneers <HiOutlineArrowRight className="h-3.5 w-3.5" /></>}
                  </button>
                  {subMessage && (
                    <div className={`rounded-xl p-2 text-[11px] leading-snug text-center ${
                      subMessage.type === "success"
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/50"
                        : "bg-rose-950/80 text-rose-300 border border-rose-700/50"
                    }`}>
                      {subMessage.text}
                    </div>
                  )}
                </form>
              </OrganicBlobCard>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* BLOB 5: Archive Pebble Cluster (Remaining Articles)               */}
            {/* ---------------------------------------------------------------- */}
            {remainingBlogs.length > 0 && (
              <div className="lg:col-span-12 pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <HiOutlineBookOpen className="h-4 w-4 text-neutral-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-600">Archive Dispatches</h3>
                  <span className="text-[10px] text-neutral-400">({remainingBlogs.length} articles)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {remainingBlogs.map((blog, idx) => (
                    <OrganicBlobCard
                      key={blog.id}
                      seed={idx + 6}
                      lobes={7}
                      irregularity={0.18}
                      gradientClass="from-white/95 via-white/85 to-neutral-50/50"
                      onClick={() => setReadingItem({ type: "blog", item: blog })}
                      className="min-h-[160px]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2 text-[10px] text-neutral-400">
                          <span>{formatDate(blog.published_at || blog.created_at) || "Archive"}</span>
                          <span>{estimateReadTime(blog.content_html || blog.excerpt)}</span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold leading-snug text-neutral-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                          {blog.title}
                        </h4>
                        {blog.excerpt && (
                          <p className="mt-1.5 text-[11px] text-neutral-500 leading-relaxed line-clamp-2">
                            {blog.excerpt}
                          </p>
                        )}
                      </div>
                    </OrganicBlobCard>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Interactive Deep Dive Reader Modal */}
      {readingItem && (
        <ReaderModal
          item={readingItem.item}
          type={readingItem.type}
          onClose={() => setReadingItem(null)}
        />
      )}
    </div>
  );
}