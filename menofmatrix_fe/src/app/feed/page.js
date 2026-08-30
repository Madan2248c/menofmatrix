"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Poppins } from "next/font/google";
import {
  HiOutlinePencilSquare,
  HiOutlineEnvelopeOpen,
  HiOutlineRss,
  HiOutlineCalendar,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineNewspaper,
  HiMiniSignal,
  HiOutlineArrowRight,
  HiOutlineArrowPath,
  HiOutlineExclamationTriangle,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineClock,
  HiOutlineShare,
  HiOutlineCheck,
} from "react-icons/hi2";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const SOFT_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const MARGIN = 20;
const GAP = 14;

// ---------------------------------------------------------------------------
// Math & SVG Canvas Generators: Organic Blob Curves & Fluid Connectors
// ---------------------------------------------------------------------------

function concaveRectPath(w, h) {
  const r = Math.min(w, h) / 2;
  return `M ${r} 0 L ${w - r} 0 A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${h - r} A ${r} ${r} 0 0 1 ${w - r} ${h} L ${r} ${h} A ${r} ${r} 0 0 1 0 ${h - r} L 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
}

function blobPath(w, h, seed = 0) {
  const n = 12;
  const cx = w / 2;
  const cy = h / 2;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const wob = 1 + 0.045 * Math.sin(i * 2.2 + seed * 1.5) + 0.03 * Math.cos(i * 1.7 + seed * 2.3);
    pts.push([cx + Math.cos(a) * cx * 0.96 * wob, cy + Math.sin(a) * cy * 0.96 * wob]);
  }
  const p = (i) => pts[((i % n) + n) % n];
  let d = `M ${p(0)[0].toFixed(1)} ${p(0)[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d} Z`;
}

function BlobShell({ className = "", style = {}, w, h, seed = 0, tone = "light", children }) {
  const pathD = blobPath(w, h, seed);
  const dark = tone === "dark";
  return (
    <div
      className={className}
      style={{
        filter: dark
          ? "drop-shadow(0 24px 56px rgba(0,0,0,0.32)) drop-shadow(0 2px 6px rgba(0,0,0,0.15))"
          : "drop-shadow(0 24px 56px rgba(60,50,35,0.08)) drop-shadow(0 2px 6px rgba(0,0,0,0.03))",
        ...style,
      }}
    >
      {/* Translucent Frosted Glass Hull */}
      <div
        className="absolute inset-0 backdrop-blur-2xl pointer-events-none"
        style={{
          clipPath: `path('${pathD}')`,
          backgroundColor: dark ? "rgba(18, 18, 22, 0.94)" : "rgba(255, 255, 255, 0.88)",
          transition: `background-color 500ms ${SOFT_EASE}`,
        }}
      />
      {/* Specular Rim Light */}
      <div
        className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none opacity-80"
        style={{ clipPath: `path('${pathD}')` }}
      />
      {/* SVG Border Outline */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <path
          d={pathD}
          fill="none"
          stroke={dark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.92)"}
          strokeWidth="1.2"
        />
      </svg>
      {children}
    </div>
  );
}

function BlobNeck({ box }) {
  const { x, y, w, h } = box;
  const pathD = concaveRectPath(w, h);
  return (
    <div
      className="fixed pointer-events-none z-0"
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        filter: "drop-shadow(0 16px 40px rgba(60,50,35,0.07))",
      }}
    >
      <div
        className="absolute inset-0 bg-white/85 backdrop-blur-2xl"
        style={{ clipPath: `path('${pathD}')` }}
      />
      <svg className="absolute inset-0 w-full h-full">
        <path d={pathD} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers: Read Time & Formatter
// ---------------------------------------------------------------------------

function estimateReadTime(text) {
  if (!text) return "2 min read";
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
// Sub-components: Cards, Pills, Reader, Subscribe
// ---------------------------------------------------------------------------

function FeaturedHeroPill({ blog, isSelected, onClick }) {
  const date = formatDate(blog.published_at || blog.created_at);
  const readTime = estimateReadTime(blog.content_html || blog.excerpt);

  return (
    <button
      onClick={onClick}
      data-selected={isSelected || undefined}
      className={`group relative w-full overflow-hidden text-left transition-all duration-300 rounded-3xl p-4 border ${
        isSelected
          ? "bg-neutral-900 border-neutral-900 text-white shadow-[0_12px_32px_rgba(0,0,0,0.2)]"
          : "bg-white/80 border-white/80 text-neutral-900 hover:bg-white/95 hover:border-white shadow-[0_4px_16px_rgba(60,50,35,0.05)]"
      } backdrop-blur-xl cursor-pointer`}
      style={{ transitionTimingFunction: SOFT_EASE }}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          <span className={`text-[10px] font-bold tracking-wider uppercase ${isSelected ? "text-rose-300" : "text-rose-600"}`}>
            Featured Drop
          </span>
        </div>
        <div className={`flex items-center gap-2 text-[10px] ${isSelected ? "text-neutral-400" : "text-neutral-400"}`}>
          <span className="flex items-center gap-1"><HiOutlineClock className="h-3 w-3" /> {readTime}</span>
          {date && <span>• {date}</span>}
        </div>
      </div>

      <div className="flex gap-3 items-center">
        {blog.cover_image_url && (
          <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/5">
            <img src={blog.cover_image_url} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`text-xs sm:text-sm font-bold leading-snug line-clamp-2 ${isSelected ? "text-white" : "text-neutral-900 group-hover:text-black"}`}>
            {blog.title}
          </h3>
          {blog.excerpt && (
            <p className={`mt-1 text-[11px] leading-relaxed line-clamp-1 ${isSelected ? "text-neutral-300" : "text-neutral-500"}`}>
              {blog.excerpt}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function BlogPill({ blog, isSelected, onClick }) {
  const date = formatDate(blog.published_at || blog.created_at);
  const readTime = estimateReadTime(blog.content_html || blog.excerpt);

  return (
    <button
      onClick={onClick}
      data-selected={isSelected || undefined}
      className={`group w-full text-left transition-all duration-300 rounded-2xl px-4 py-3 border ${
        isSelected
          ? "bg-neutral-900 border-neutral-900 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
          : "bg-white/80 border-white/70 hover:bg-white/95 hover:border-white hover:shadow-[0_8px_20px_rgba(60,50,35,0.08)] shadow-[0_2px_8px_rgba(60,50,35,0.04)]"
      } backdrop-blur-xl cursor-pointer`}
      style={{ transitionTimingFunction: SOFT_EASE }}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
          isSelected ? "text-neutral-400" : "text-neutral-400 group-hover:text-neutral-500"
        }`}>
          <HiOutlineCalendar className="h-3 w-3" />
          {date || "Article"}
        </span>
        <span className={`text-[10px] font-medium flex items-center gap-1 ${
          isSelected ? "text-neutral-400" : "text-neutral-400"
        }`}>
          <HiOutlineClock className="h-3 w-3" /> {readTime}
        </span>
      </div>
      <div className={`text-xs sm:text-sm font-bold leading-snug transition-colors line-clamp-2 ${
        isSelected ? "text-white" : "text-neutral-800 group-hover:text-black"
      }`}>
        {blog.title}
      </div>
      {blog.excerpt && (
        <div className={`mt-1 text-[11px] leading-relaxed line-clamp-1 transition-colors ${
          isSelected ? "text-neutral-300" : "text-neutral-500"
        }`}>
          {blog.excerpt}
        </div>
      )}
    </button>
  );
}

function NewsRow({ item, isSelected, onClick }) {
  const date = formatDate(item.published_at || item.created_at);

  return (
    <button
      onClick={onClick}
      data-selected={isSelected || undefined}
      className={`group w-full text-left transition-all duration-300 rounded-2xl px-3.5 py-2.5 border ${
        isSelected
          ? "bg-neutral-900 border-neutral-900 shadow-[0_6px_20px_rgba(0,0,0,0.16)]"
          : "bg-white/70 border-white/60 hover:bg-white/90 hover:border-white hover:shadow-[0_4px_12px_rgba(60,50,35,0.07)]"
      } backdrop-blur-md cursor-pointer`}
      style={{ transitionTimingFunction: SOFT_EASE }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className={`text-[9px] font-bold uppercase tracking-wider ${
            isSelected ? "text-blue-300" : "text-blue-600"
          }`}>
            {item.source || "AI Radar"}
          </span>
        </div>
        {date && (
          <span className={`text-[9px] ${isSelected ? "text-neutral-400" : "text-neutral-400"}`}>
            {date}
          </span>
        )}
      </div>
      <div className={`text-xs font-semibold leading-snug line-clamp-2 transition-colors ${
        isSelected ? "text-white" : "text-neutral-700 group-hover:text-black"
      }`}>
        {item.title}
      </div>
    </button>
  );
}

function SkeletonPill() {
  return (
    <div className="w-full rounded-2xl bg-white/80 border border-white/70 px-4 py-3 shadow-[0_2px_8px_rgba(60,50,35,0.04)] backdrop-blur-xl animate-pulse space-y-2">
      <div className="flex items-center justify-between">
        <div className="h-2.5 w-16 rounded-full bg-neutral-200/80" />
        <div className="h-2.5 w-12 rounded-full bg-neutral-200/60" />
      </div>
      <div className="h-3.5 w-4/5 rounded-full bg-neutral-200" />
      <div className="h-2.5 w-2/3 rounded-full bg-neutral-200/60" />
    </div>
  );
}

function CategoryDot({ label, icon: Icon, count, isActive, onClick, color }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`group relative flex items-center justify-center rounded-2xl transition-all duration-300 shrink-0 cursor-pointer ${
        isActive
          ? `shadow-[0_8px_24px_rgba(0,0,0,0.18)] scale-105 ${color.bg}`
          : "bg-white/80 border border-white/70 hover:bg-white/95 hover:scale-102 shadow-[0_4px_12px_rgba(60,50,35,0.06)]"
      } backdrop-blur-xl`}
      style={{ width: 44, height: 44, transitionTimingFunction: SOFT_EASE }}
    >
      <Icon className={`h-[18px] w-[18px] transition-colors ${isActive ? color.icon : "text-neutral-500 group-hover:text-neutral-700"}`} />
      {count !== undefined && count > 0 && (
        <span className={`absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold ${
          isActive ? "bg-white text-neutral-900" : "bg-neutral-900 text-white"
        } shadow-xs`}>
          {count}
        </span>
      )}
    </button>
  );
}

function ArticleBody({ item, type, content, onRetry }) {
  const fallbackText = item.excerpt || item.summary || item.description;

  if (type === "news") {
    return (
      <div className="space-y-4">
        {fallbackText && (
          <p className="text-sm leading-relaxed text-neutral-700">{fallbackText}</p>
        )}
        {item.link && (
          <div className="pt-3 border-t border-neutral-100">
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-neutral-800 transition-colors"
            >
              <span>Read Full Story on {item.source || "Source"}</span>
              <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>
    );
  }

  // Blog post content rendering
  if (content?.loading) {
    return (
      <div className="space-y-3 animate-pulse pt-2">
        <div className="h-4 w-1/3 rounded-full bg-neutral-200/80" />
        <div className="space-y-2 pt-2">
          {[92, 96, 88, 70, 90, 60, 85, 75].map((w, i) => (
            <div key={i} className="h-3 rounded-full bg-neutral-200/70" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (content?.error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <HiOutlineExclamationTriangle className="h-7 w-7 text-neutral-400" />
        <p className="text-xs text-neutral-500">Could not retrieve full article text.</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer shadow-xs"
        >
          <HiOutlineArrowPath className="h-3.5 w-3.5" /> Retry Fetch
        </button>
      </div>
    );
  }

  if (content?.html) {
    return (
      <div
        className="article-body prose prose-sm max-w-none text-neutral-700 leading-relaxed [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-blue-600 [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: content.html }}
      />
    );
  }

  return fallbackText ? (
    <p className="text-sm leading-relaxed text-neutral-700">{fallbackText}</p>
  ) : (
    <p className="text-xs text-neutral-400">Full article content is coming shortly.</p>
  );
}

function ContentReader({ item, type, content, onRetry, isModal = false, onClose = null }) {
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const readerScrollRef = useRef(null);

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-neutral-100 text-neutral-400 shadow-inner">
            <HiOutlineNewspaper className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-neutral-800">Select an Item</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Click on any article or AI radar dispatch from the stream to read the full editorial breakdown.
          </p>
        </div>
      </div>
    );
  }

  const isNews = type === "news";
  const date = formatDate(item.published_at || item.created_at);
  const readTime = estimateReadTime(content?.html || item.excerpt);

  function handleScroll(e) {
    const el = e.target;
    const max = el.scrollHeight - el.clientHeight;
    if (max > 0) {
      setScrollProgress((el.scrollTop / max) * 100);
    }
  }

  function handleCopyLink() {
    const url = isNews && item.link ? item.link : window.location.href;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Scroll Reading Progress Bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-neutral-100 z-20">
        <div
          className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Reader Header Bar */}
      <div className="flex items-start justify-between gap-3 pb-3 pt-2 border-b border-neutral-100 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isNews ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
            }`}>
              {isNews ? <HiOutlineRss className="h-3 w-3" /> : <HiOutlinePencilSquare className="h-3 w-3" />}
              {isNews ? (item.source || "AI Radar") : "Matrix Article"}
            </span>
            {date && (
              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                <HiOutlineCalendar className="h-3 w-3" />
                {date}
              </span>
            )}
            <span className="text-[10px] text-neutral-400 flex items-center gap-1">
              <HiOutlineClock className="h-3 w-3" />
              {readTime}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 leading-snug line-clamp-2">
            {item.title}
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopyLink}
            title={copied ? "Link Copied!" : "Copy Link"}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            {copied ? <HiOutlineCheck className="h-4 w-4 text-emerald-600" /> : <HiOutlineShare className="h-4 w-4" />}
          </button>
          {isNews && item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-xl bg-neutral-900 px-3 py-1.5 text-[11px] font-semibold text-white shadow-xs hover:bg-neutral-800 transition-colors"
            >
              <span>Source</span>
              <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
            </a>
          )}
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors cursor-pointer ml-1"
            >
              <HiOutlineXMark className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Article Cover Image Banner */}
      {!isNews && item.cover_image_url && (
        <div className="mt-3 aspect-[16/7] w-full overflow-hidden rounded-2xl bg-neutral-100 shrink-0 ring-1 ring-black/5 shadow-xs">
          <img src={item.cover_image_url} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      {/* Article Scrollable Body */}
      <div
        ref={readerScrollRef}
        onScroll={handleScroll}
        className="mt-3 flex-1 overflow-y-auto pr-1 text-neutral-700 leading-relaxed [scrollbar-width:thin]"
      >
        <ArticleBody item={item} type={type} content={content} onRetry={onRetry} />
      </div>
    </div>
  );
}

function SubscribeCard({ email, setEmail, onSubmit, submitting, subMessage }) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-xs">
            <HiOutlineEnvelopeOpen className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-white leading-tight">Alpha Dispatch</div>
            <div className="text-[10px] text-neutral-400">Weekly intelligence drops</div>
          </div>
        </div>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          Curated AI models, system prompts, and digital culture delivered straight to your inbox.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-white/30 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-white py-2 text-xs font-bold text-neutral-900 shadow-md hover:bg-neutral-100 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          {submitting ? "Joining..." : <>Join Alpha Network <HiOutlineArrowRight className="h-3 w-3" /></>}
        </button>
        {subMessage && (
          <div className={`rounded-xl p-2 text-[11px] leading-snug ${
            subMessage.type === "success"
              ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700/50"
              : "bg-rose-900/50 text-rose-300 border border-rose-700/50"
          }`}>
            {subMessage.text}
          </div>
        )}
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category Definitions
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { id: "all",  label: "All Streams", icon: HiMiniSignal,          color: { bg: "bg-neutral-900", icon: "text-white" } },
  { id: "blog", label: "Articles",    icon: HiOutlinePencilSquare, color: { bg: "bg-rose-600",    icon: "text-white" } },
  { id: "news", label: "AI Radar",    icon: HiOutlineRss,          color: { bg: "bg-blue-600",    icon: "text-white" } },
];

// ---------------------------------------------------------------------------
// Main Feed Page Component
// ---------------------------------------------------------------------------

export default function FeedPage() {
  const [data, setData]             = useState(null);
  const [dataError, setDataError]   = useState(false);
  const [email, setEmail]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subMessage, setSubMessage] = useState(null);
  const [mousePos, setMousePos]     = useState({ x: 0, y: 0 });
  const [category, setCategory]     = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected]     = useState(null);
  const [isMobileReaderOpen, setIsMobileReaderOpen] = useState(false);
  const [layout, setLayout]         = useState(null);
  const listRef = useRef(null);

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

  useEffect(() => {
    function measure() {
      const narrow = window.innerWidth < 1024;
      const dock = document.querySelector("[data-floating-dock]");
      const dockTop = dock ? dock.getBoundingClientRect().top : window.innerHeight - 90;
      setLayout({
        narrow,
        top: MARGIN,
        left: MARGIN,
        narrowW: window.innerWidth - MARGIN * 2 - 2,
        totalWidth: window.innerWidth - MARGIN * 2,
        totalHeight: dockTop - GAP - MARGIN,
      });
    }
    const t = setTimeout(measure, 120);
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);

  const isLoading = !data;
  const blogs = useMemo(() => data?.blogs || [], [data]);
  const news  = useMemo(() => data?.news  || [], [data]);

  // Search & Category Filtering
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

  const items = useMemo(() => {
    const list = [];
    filteredBlogs.forEach((b) => list.push({ type: "blog", item: b }));
    filteredNews.forEach((n) => list.push({ type: "news", item: n }));
    return list;
  }, [filteredBlogs, filteredNews]);

  // Keep a valid selection
  const [prevFeedState, setPrevFeedState] = useState({ data: null, category, searchQuery });
  if (data && (prevFeedState.data !== data || prevFeedState.category !== category || prevFeedState.searchQuery !== searchQuery)) {
    setPrevFeedState({ data, category, searchQuery });
    const stillValid = selected && items.some(
      (x) => x.type === selected.type && x.item.id === selected.item.id
    );
    if (!stillValid) setSelected(items[0] || null);
  }

  // Fetch full blog content
  const [contentMap, setContentMap] = useState({});
  const [retryBumps, setRetryBumps] = useState({});

  useEffect(() => {
    if (selected?.type !== "blog" || !selected.item.slug) return;
    const key = `${selected.item.slug}:${retryBumps[selected.item.slug] || 0}`;
    if (contentMap[key] !== undefined) return;

    let alive = true;
    fetch(`/api/blog/${encodeURIComponent(selected.item.slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((json) => {
        if (alive) setContentMap((m) => ({ ...m, [key]: json?.post?.content_html || "" }));
      })
      .catch(() => { if (alive) setContentMap((m) => ({ ...m, [key]: "error" })); });
    return () => { alive = false; };
  }, [selected, contentMap, retryBumps]);

  const contentKey = selected?.type === "blog" && selected.item.slug
    ? `${selected.item.slug}:${retryBumps[selected.item.slug] || 0}`
    : null;
  const contentEntry = contentKey ? contentMap[contentKey] : undefined;
  const content = contentKey
    ? contentEntry === undefined
      ? { loading: true }
      : contentEntry === "error"
        ? { error: true }
        : { loading: false, html: contentEntry }
    : null;

  function retryContent() {
    if (selected?.type !== "blog" || !selected.item.slug) return;
    const slug = selected.item.slug;
    setRetryBumps((b) => ({ ...b, [slug]: (b[slug] || 0) + 1 }));
  }

  // Keyboard navigation
  useEffect(() => {
    if (!items.length) return;
    function onKey(e) {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      setSelected((prev) => {
        const idx = items.findIndex((x) => prev && x.type === prev.type && x.item.id === prev.item.id);
        const next = e.key === "ArrowDown"
          ? Math.min((idx === -1 ? 0 : idx + 1), items.length - 1)
          : Math.max((idx === -1 ? 1 : idx - 1), 0);
        return items[next];
      });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items]);

  // Keep selected pill visible
  useEffect(() => {
    if (!selected || !listRef.current) return;
    listRef.current.querySelector("[data-selected]")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected, layout]);

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
        setSubMessage({ type: "success", text: resData.alreadySubscribed ? "You're already on the Alpha roster!" : "Welcome to the Alpha Network!" });
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

  if (!layout) {
    return <div className={`${poppins.className} relative min-h-dvh w-full bg-transparent`} />;
  }

  const { narrow, top, left, totalWidth, totalHeight } = layout;

  const leftColW  = Math.round(totalWidth * 0.38);
  const rightColW = totalWidth - leftColW - GAP;
  const rightColL = left + leftColW + GAP;

  const bottomRowH = Math.max(170, Math.round(totalHeight * 0.32));
  const topRowH    = totalHeight - bottomRowH - GAP;

  const dotsColW    = 56;
  const newsletterW = leftColW - dotsColW - GAP;

  const isNarrow = narrow;
  const listW = isNarrow ? layout.narrowW : leftColW;
  const listH = isNarrow ? 480 : topRowH;
  const readerW = isNarrow ? layout.narrowW : rightColW;
  const readerH = isNarrow ? 640 : totalHeight;
  const newsW = isNarrow ? layout.narrowW : newsletterW;
  const newsH = isNarrow ? 280 : bottomRowH;

  const listPanelCls  = isNarrow ? "relative w-full" : "fixed";
  const listPanelStyle = isNarrow ? { height: listH } : { left, top, width: leftColW, height: topRowH };

  const readerPanelCls  = isNarrow ? "relative w-full" : "fixed";
  const readerPanelStyle = isNarrow ? { height: readerH } : { left: rightColL, top, width: rightColW, height: totalHeight };

  const letterPanelCls  = isNarrow ? "relative w-full" : "fixed";
  const letterPanelStyle = isNarrow ? { height: newsH } : { left, top: top + topRowH + GAP, width: newsletterW, height: bottomRowH };

  const featuredBlog = filteredBlogs[0];
  const remainingBlogs = filteredBlogs.slice(1);

  return (
    <div className={`${poppins.className} relative ${isNarrow ? "min-h-dvh w-full bg-transparent px-4 pt-6 pb-36 flex flex-col gap-4 overflow-y-auto" : "min-h-dvh w-full bg-transparent overflow-hidden"}`}>
      {/* Dynamic Cursor Spotlight & Ambient Glows */}
      <div
        className="pointer-events-none fixed inset-0 z-[-1] opacity-70"
        style={{ background: `radial-gradient(700px circle at ${mousePos.x}px ${mousePos.y}px, rgba(219,154,255,0.06), rgba(244,63,94,0.04), transparent 70%)` }}
      />
      <div className="pointer-events-none fixed -top-28 left-1/4 h-96 w-96 rounded-full bg-pink-400/12 blur-[110px]" />
      <div className="pointer-events-none fixed top-1/3 right-1/4 h-96 w-96 rounded-full bg-blue-400/8 blur-[110px]" />
      <div className="pointer-events-none fixed bottom-10 left-1/2 h-80 w-80 rounded-full bg-amber-300/10 blur-[120px]" />

      {/* Organic Glass Necks Fusing the Pods (Desktop Only) */}
      {!isNarrow && (
        <>
          {/* Stream Pod ↔ Reader Pod Channel */}
          <BlobNeck
            box={{
              x: left + leftColW - 14,
              y: top + Math.round(topRowH * 0.26),
              w: GAP + 28,
              h: Math.round(topRowH * 0.46),
            }}
          />
          {/* Stream Pod ↔ Newsletter Pod Channel */}
          <BlobNeck
            box={{
              x: left + Math.round(leftColW * 0.22),
              y: top + topRowH - 14,
              w: Math.max(140, Math.round(newsletterW * 0.52)),
              h: GAP + 28,
            }}
          />
          {/* Newsletter Pod ↔ Dots Capsule Channel */}
          <BlobNeck
            box={{
              x: left + newsletterW - 14,
              y: top + topRowH + Math.round(bottomRowH / 2) - 45,
              w: GAP + 26,
              h: 90,
            }}
          />
        </>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Pod 1: Knowledge Stream & Search Radar (Top Left)                   */}
      {/* -------------------------------------------------------------------- */}
      <div className={listPanelCls} style={listPanelStyle}>
        <BlobShell w={listW} h={listH} seed={1} className="absolute inset-0">
          <div className="relative h-full flex flex-col px-6 pt-5 pb-4">
            {/* Search Radar Input */}
            <div className="relative mb-3 shrink-0">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <HiOutlineMagnifyingGlass className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, insights, or sources..."
                className="w-full rounded-2xl border border-neutral-200/80 bg-white/70 pl-9 pr-8 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:bg-white focus:outline-none transition-all shadow-xs backdrop-blur-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  <HiOutlineXMark className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Stream Header & Active Count */}
            <div className="flex items-center justify-between gap-2 mb-2.5 shrink-0 px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  {category === "news" ? "AI Radar Stream" : category === "blog" ? "Matrix Articles" : "Live Nexus Stream"}
                </span>
              </div>
              {!isLoading && !dataError && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
                  {items.length} {items.length === 1 ? "story" : "stories"}
                </span>
              )}
            </div>

            {/* Scrollable Stream Content */}
            <div ref={listRef} className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-0.5 [scrollbar-width:thin]">
              {isLoading ? (
                [1, 2, 3].map((n) => <SkeletonPill key={n} />)
              ) : dataError ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center py-6">
                  <HiOutlineExclamationTriangle className="h-6 w-6 text-neutral-300" />
                  <p className="text-xs text-neutral-500">Could not retrieve the feed stream.</p>
                  <button
                    onClick={loadFeed}
                    className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    <HiOutlineArrowPath className="h-3 w-3" /> Retry Stream
                  </button>
                </div>
              ) : (
                <>
                  {/* Featured Hero Story (if on 'all' or 'blog' category and no search active) */}
                  {featuredBlog && !searchQuery && (
                    <FeaturedHeroPill
                      blog={featuredBlog}
                      isSelected={selected?.type === "blog" && selected.item.id === featuredBlog.id}
                      onClick={() => {
                        setSelected({ type: "blog", item: featuredBlog });
                        if (isNarrow) setIsMobileReaderOpen(true);
                      }}
                    />
                  )}

                  {/* Standard Blog Articles */}
                  {(searchQuery ? filteredBlogs : remainingBlogs).map((blog) => (
                    <BlogPill
                      key={blog.id}
                      blog={blog}
                      isSelected={selected?.type === "blog" && selected.item.id === blog.id}
                      onClick={() => {
                        setSelected({ type: "blog", item: blog });
                        if (isNarrow) setIsMobileReaderOpen(true);
                      }}
                    />
                  ))}

                  {/* Section Divider: AI Radar */}
                  {filteredNews.length > 0 && category === "all" && (
                    <div className="flex items-center gap-1.5 mt-2 mb-1 px-1 shrink-0">
                      <HiOutlineRss className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Live AI Radar</span>
                    </div>
                  )}

                  {/* AI News Radar Cards */}
                  {filteredNews.map((item) => (
                    <NewsRow
                      key={item.id}
                      item={item}
                      isSelected={selected?.type === "news" && selected.item.id === item.id}
                      onClick={() => {
                        setSelected({ type: "news", item });
                        if (isNarrow) setIsMobileReaderOpen(true);
                      }}
                    />
                  ))}

                  {items.length === 0 && (
                    <div className="flex h-32 flex-col items-center justify-center text-center">
                      <p className="text-xs font-semibold text-neutral-400">No stories match your criteria</p>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="mt-2 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Keyboard shortcut hint */}
            {!isNarrow && !dataError && !isLoading && items.length > 0 && (
              <div className="mt-2 shrink-0 flex items-center justify-between text-[9px] text-neutral-400 pt-1 border-t border-neutral-100">
                <div className="flex items-center gap-1">
                  <kbd className="rounded border border-neutral-200 bg-white/80 px-1 font-sans">↑</kbd>
                  <kbd className="rounded border border-neutral-200 bg-white/80 px-1 font-sans">↓</kbd>
                  <span>to browse</span>
                </div>
                <span>Auto-sync enabled</span>
              </div>
            )}
          </div>
        </BlobShell>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Category Morph Switcher Capsule                                      */}
      {/* -------------------------------------------------------------------- */}
      <div
        className={narrow
          ? "relative flex flex-row items-center justify-center gap-3 rounded-full border border-white/80 bg-white/80 backdrop-blur-xl px-4 py-2 self-center shadow-xs"
          : "fixed flex flex-col items-center justify-center gap-3"}
        style={narrow ? {} : { left: left + newsletterW + GAP, top: top + topRowH + GAP, width: dotsColW, height: bottomRowH }}
      >
        {!narrow && (
          <div className="pointer-events-none absolute inset-x-[4px] inset-y-[8px] rounded-full border border-white/80 bg-white/70 shadow-[0_8px_24px_rgba(60,50,35,0.06),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-xl" />
        )}
        {CATEGORIES.map((cat) => (
          <CategoryDot
            key={cat.id}
            label={cat.label}
            icon={cat.icon}
            count={cat.id === "blog" ? blogs.length : cat.id === "news" ? news.length : undefined}
            isActive={category === cat.id}
            onClick={() => setCategory(cat.id)}
            color={cat.color}
          />
        ))}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Pod 2: Immersive Reader Sanctum (Right Column)                       */}
      {/* -------------------------------------------------------------------- */}
      <div className={readerPanelCls} style={readerPanelStyle}>
        <BlobShell w={readerW} h={readerH} seed={2} className="absolute inset-0">
          <div className="relative h-full px-8 py-6">
            {isLoading ? (
              <div className="h-full animate-pulse space-y-4 pt-4">
                <div className="h-4 w-28 rounded-full bg-neutral-200/70" />
                <div className="h-8 w-4/5 rounded-2xl bg-neutral-200" />
                <div className="aspect-[16/7] w-full rounded-2xl bg-neutral-200/50" />
                <div className="space-y-2.5 pt-2">
                  {[1, 2, 3, 4].map((n) => <div key={n} className="h-3 rounded-full bg-neutral-200/60" />)}
                </div>
              </div>
            ) : (
              <ContentReader
                item={selected?.item}
                type={selected?.type}
                content={content}
                onRetry={retryContent}
              />
            )}
          </div>
        </BlobShell>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Pod 3: Obsidian Alpha Dispatch Capsule (Bottom Left)                 */}
      {/* -------------------------------------------------------------------- */}
      <div className={letterPanelCls} style={letterPanelStyle}>
        <BlobShell w={newsW} h={newsH} seed={3} tone="dark" className="absolute inset-0">
          <div className="relative h-full px-6 py-5">
            <SubscribeCard
              email={email}
              setEmail={setEmail}
              onSubmit={handleSubscribe}
              submitting={submitting}
              subMessage={subMessage}
            />
          </div>
        </BlobShell>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Mobile / Tablet Full-Screen Reader Drawer / Modal                     */}
      {/* -------------------------------------------------------------------- */}
      {isNarrow && isMobileReaderOpen && selected && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white/95 backdrop-blur-2xl p-5 overflow-hidden animate-in fade-in slide-in-from-bottom duration-300">
          <ContentReader
            item={selected.item}
            type={selected.type}
            content={content}
            onRetry={retryContent}
            isModal={true}
            onClose={() => setIsMobileReaderOpen(false)}
          />
        </div>
      )}
    </div>
  );
}