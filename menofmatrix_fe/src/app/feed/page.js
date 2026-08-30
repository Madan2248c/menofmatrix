"use client";

import React, { useState, useEffect, useRef } from "react";
import { Poppins } from "next/font/google";
import {
  HiOutlinePencilSquare,
  HiOutlineEnvelopeOpen,
  HiOutlineRss,
  HiOutlineCalendar,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineNewspaper,
  HiMiniSignal,
} from "react-icons/hi2";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const SOFT_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const MARGIN = 20;
const GAP = 12;

function BlogPill({ blog, isSelected, onClick }) {
  const date = blog.published_at || blog.created_at;
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left transition-all duration-300 rounded-2xl px-4 py-3 border ${
        isSelected
          ? "bg-neutral-900 border-neutral-900 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
          : "bg-white/80 border-white/70 hover:bg-white/95 hover:border-white hover:shadow-[0_8px_20px_rgba(60,50,35,0.08)] shadow-[0_2px_8px_rgba(60,50,35,0.04)]"
      } backdrop-blur-xl`}
      style={{ transitionTimingFunction: SOFT_EASE }}
    >
      <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 transition-colors ${
        isSelected ? "text-neutral-400" : "text-neutral-400 group-hover:text-neutral-500"
      }`}>
        <span className="flex items-center gap-1">
          <HiOutlineCalendar className="h-3 w-3" />
          {date ? new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}
        </span>
      </div>
      <div className={`text-sm font-bold leading-snug transition-colors line-clamp-2 ${
        isSelected ? "text-white" : "text-neutral-800 group-hover:text-black"
      }`}>
        {blog.title}
      </div>
      {blog.excerpt && (
        <div className={`mt-1 text-xs leading-relaxed line-clamp-1 transition-colors ${
          isSelected ? "text-neutral-300" : "text-neutral-500"
        }`}>
          {blog.excerpt}
        </div>
      )}
    </button>
  );
}

function SkeletonPill() {
  return (
    <div className="w-full rounded-2xl bg-white/80 border border-white/70 px-4 py-3 shadow-[0_2px_8px_rgba(60,50,35,0.04)] backdrop-blur-xl animate-pulse space-y-2">
      <div className="h-2.5 w-16 rounded-full bg-neutral-200/80" />
      <div className="h-3.5 w-4/5 rounded-full bg-neutral-200" />
      <div className="h-2.5 w-2/3 rounded-full bg-neutral-200/60" />
    </div>
  );
}

function NewsRow({ item, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left transition-all duration-300 rounded-xl px-3.5 py-2.5 border ${
        isSelected
          ? "bg-neutral-900 border-neutral-900 shadow-[0_4px_16px_rgba(0,0,0,0.14)]"
          : "bg-white/70 border-white/60 hover:bg-white/90 hover:border-white hover:shadow-[0_4px_12px_rgba(60,50,35,0.07)]"
      } backdrop-blur-md`}
      style={{ transitionTimingFunction: SOFT_EASE }}
    >
      <div className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${
        isSelected ? "text-neutral-400" : "text-neutral-400"
      }`}>
        {item.source || "AI News"}
      </div>
      <div className={`text-xs font-semibold leading-snug line-clamp-2 transition-colors ${
        isSelected ? "text-white" : "text-neutral-700 group-hover:text-black"
      }`}>
        {item.title}
      </div>
    </button>
  );
}

function CategoryDot({ label, icon: Icon, isActive, onClick, color }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`group flex items-center justify-center rounded-full transition-all duration-300 ${
        isActive
          ? `shadow-[0_8px_24px_rgba(0,0,0,0.18)] scale-110 ${color.bg}`
          : "bg-white/80 border border-white/70 hover:bg-white/95 hover:scale-105 shadow-[0_4px_12px_rgba(60,50,35,0.06)]"
      } backdrop-blur-xl`}
      style={{ width: 44, height: 44, transitionTimingFunction: SOFT_EASE }}
    >
      <Icon className={`h-[18px] w-[18px] transition-colors ${isActive ? color.icon : "text-neutral-500 group-hover:text-neutral-700"}`} />
    </button>
  );
}

function ContentReader({ item, type }) {
  if (!item) return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
          <HiOutlineNewspaper className="h-7 w-7 text-neutral-300" />
        </div>
        <p className="text-sm font-medium text-neutral-400">Select an article or news item to read</p>
      </div>
    </div>
  );

  const isNews = type === "news";
  const date = item.published_at || item.created_at;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isNews ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
            }`}>
              {isNews ? <HiOutlineRss className="h-3 w-3" /> : <HiOutlinePencilSquare className="h-3 w-3" />}
              {isNews ? (item.source || "AI News") : "Blog Post"}
            </span>
            {date && (
              <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                <HiOutlineCalendar className="h-3 w-3" />
                {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-neutral-900 leading-snug">{item.title}</h2>
        </div>
        {(item.link || item.slug) && (
          <a
            href={item.link || `/blogs/${item.slug}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-2 text-[11px] font-semibold text-white shadow-md hover:-translate-y-px transition-all duration-200"
            style={{ transitionTimingFunction: SOFT_EASE }}
          >
            Open <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {!isNews && item.cover_image_url && (
        <div className="mt-4 aspect-[16/7] w-full overflow-hidden rounded-2xl bg-neutral-100 shrink-0">
          <img src={item.cover_image_url} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="mt-4 flex-1 overflow-y-auto pr-1">
        {(item.excerpt || item.description) && (
          <p className="text-sm leading-relaxed text-neutral-600">{item.excerpt || item.description}</p>
        )}
      </div>
    </div>
  );
}

function SubscribeCard({ email, setEmail, onSubmit, submitting, subMessage }) {
  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
            <HiOutlineEnvelopeOpen className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">Stay in the loop</div>
            <div className="text-[10px] text-neutral-400">Weekly drops & insights</div>
          </div>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Articles, AI news, and community drops right in your inbox.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-3 flex flex-col gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-white/20 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-white py-2 text-xs font-bold text-neutral-900 shadow-md hover:bg-neutral-100 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {submitting ? "Joining..." : "Subscribe ?"}
        </button>
        {subMessage && (
          <div className={`rounded-lg p-2 text-[11px] leading-snug ${
            subMessage.type === "success"
              ? "bg-emerald-900/40 text-emerald-300"
              : "bg-rose-900/40 text-rose-300"
          }`}>
            {subMessage.text}
          </div>
        )}
      </form>
    </div>
  );
}

const CATEGORIES = [
  { id: "all",    label: "All",        icon: HiMiniSignal,          color: { bg: "bg-neutral-900", icon: "text-white" } },
  { id: "blog",   label: "Blog",       icon: HiOutlinePencilSquare, color: { bg: "bg-rose-600",    icon: "text-white" } },
  { id: "news",   label: "News",       icon: HiOutlineRss,          color: { bg: "bg-blue-600",    icon: "text-white" } },
  { id: "letter", label: "Newsletter", icon: HiOutlineEnvelopeOpen, color: { bg: "bg-emerald-600", icon: "text-white" } },
];

export default function FeedPage() {
  const [data, setData]             = useState(null);
  const [email, setEmail]           = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subMessage, setSubMessage] = useState(null);
  const [mousePos, setMousePos]     = useState({ x: 0, y: 0 });
  const [category, setCategory]     = useState("all");
  const [selected, setSelected]     = useState(null);
  const [layout, setLayout]         = useState(null);

  useEffect(() => {
    fetch("/api/feed")
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then(setData)
      .catch(() => {});

    function handleMouseMove(e) { setMousePos({ x: e.clientX, y: e.clientY }); }
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    function measure() {
      const dock = document.querySelector("[data-floating-dock]");
      const dockTop = dock ? dock.getBoundingClientRect().top : window.innerHeight - 90;
      setLayout({
        top: MARGIN,
        left: MARGIN,
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
        setSubMessage({ type: "success", text: resData.alreadySubscribed ? "Already subscribed!" : "Welcome aboard!" });
        setEmail("");
      } else {
        setSubMessage({ type: "error", text: resData.error || "Subscription failed." });
      }
    } catch {
      setSubMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setSubmitting(false);
    }
  }

  const isLoading = !data;
  const blogs = data?.blogs || [];
  const news  = data?.news  || [];

  if (!layout) {
    return <div className={`${poppins.className} relative min-h-dvh w-full bg-transparent`} />;
  }

  const { top, left, totalWidth, totalHeight } = layout;

  const leftColW  = Math.round(totalWidth * 0.37);
  const rightColW = totalWidth - leftColW - GAP;
  const rightColL = left + leftColW + GAP;

  const bottomRowH = Math.max(160, Math.round(totalHeight * 0.32));
  const topRowH    = totalHeight - bottomRowH - GAP;

  const dotsColW    = 56;
  const newsletterW = leftColW - dotsColW - GAP;

  const showNewsletter = category === "all" || category === "letter";
  const filteredBlogs = category === "news" ? [] : blogs;
  const filteredNews  = category === "blog" ? [] : news;

  return (
    <div className={`${poppins.className} relative min-h-dvh w-full bg-transparent overflow-hidden`}>
      {/* Mouse spotlight */}
      <div
        className="pointer-events-none fixed inset-0 z-[-1] opacity-60"
        style={{ background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(219,154,255,0.05), rgba(244,63,94,0.03), transparent 70%)` }}
      />
      <div className="pointer-events-none fixed -top-24 left-1/4 h-80 w-80 rounded-full bg-pink-400/10 blur-[100px]" />
      <div className="pointer-events-none fixed top-1/3 right-1/4 h-80 w-80 rounded-full bg-blue-400/6 blur-[100px]" />

      {/* -- Panel 1: Blog / News List (top-left) */}
      <div className="fixed" style={{ left, top, width: leftColW, height: topRowH }}>
        <div className="absolute inset-0 rounded-3xl border border-white/80 bg-white/85 shadow-[0_16px_40px_rgba(60,50,35,0.07),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-xl pointer-events-none" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] rounded-t-3xl bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

        <div className="relative h-full flex flex-col px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-3 shrink-0">
            <HiOutlinePencilSquare className="h-4 w-4 text-neutral-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              {category === "news" ? "News" : "Articles"}
            </span>
            {!isLoading && (
              <span className="ml-auto text-[10px] font-semibold text-neutral-400">
                {category === "news" ? filteredNews.length : filteredBlogs.length}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-0.5">
            {isLoading ? (
              [1, 2, 3].map((n) => <SkeletonPill key={n} />)
            ) : (
              <>
                {filteredBlogs.map((blog) => (
                  <BlogPill
                    key={blog.id}
                    blog={blog}
                    isSelected={selected?.type === "blog" && selected.item.id === blog.id}
                    onClick={() => setSelected({ type: "blog", item: blog })}
                  />
                ))}

                {filteredBlogs.length > 0 && filteredNews.length > 0 && category === "all" && (
                  <div className="flex items-center gap-1.5 mt-2 mb-1 px-1 shrink-0">
                    <HiOutlineRss className="h-3 w-3 text-neutral-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">News</span>
                  </div>
                )}

                {filteredNews.map((item) => (
                  <NewsRow
                    key={item.id}
                    item={item}
                    isSelected={selected?.type === "news" && selected.item.id === item.id}
                    onClick={() => setSelected({ type: "news", item })}
                  />
                ))}

                {filteredBlogs.length === 0 && filteredNews.length === 0 && (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-xs text-neutral-400">Nothing to show</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* -- Panel 2: Content Reader (right, full height) */}
      <div className="fixed" style={{ left: rightColL, top, width: rightColW, height: totalHeight }}>
        <div className="absolute inset-0 rounded-3xl border border-white/80 bg-white/90 shadow-[0_20px_56px_rgba(60,50,35,0.09),0_1px_3px_rgba(0,0,0,0.04)] backdrop-blur-xl pointer-events-none" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] rounded-t-3xl bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />

        <div className="relative h-full px-6 py-5">
          {isLoading ? (
            <div className="h-full animate-pulse space-y-4">
              <div className="h-4 w-24 rounded-full bg-neutral-200/70" />
              <div className="h-8 w-5/6 rounded-2xl bg-neutral-200" />
              <div className="aspect-[16/7] w-full rounded-2xl bg-neutral-200/50" />
              <div className="space-y-2">
                {[1, 2, 3].map((n) => <div key={n} className="h-3 rounded-full bg-neutral-200/60" />)}
              </div>
            </div>
          ) : (
            <ContentReader item={selected?.item} type={selected?.type} />
          )}
        </div>
      </div>

      {/* -- Panel 3: Newsletter card (bottom-left) */}
      <div className="fixed" style={{ left, top: top + topRowH + GAP, width: newsletterW, height: bottomRowH }}>
        <div className="absolute inset-0 rounded-3xl border border-white/8 bg-neutral-900/92 shadow-[0_16px_40px_rgba(0,0,0,0.22),0_1px_3px_rgba(0,0,0,0.12)] backdrop-blur-xl pointer-events-none" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] rounded-t-3xl bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="pointer-events-none absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-rose-500/15 blur-2xl" />
        <div className="pointer-events-none absolute -top-4 -left-4 h-20 w-20 rounded-full bg-blue-500/10 blur-xl" />

        <div className="relative h-full px-5 py-4">
          {showNewsletter ? (
            <SubscribeCard
              email={email}
              setEmail={setEmail}
              onSubmit={handleSubscribe}
              submitting={submitting}
              subMessage={subMessage}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-xs text-neutral-500 text-center px-4">Switch to &ldquo;All&rdquo; or &ldquo;Newsletter&rdquo; to subscribe</p>
            </div>
          )}
        </div>
      </div>

      {/* -- Panel 4: Category dots (bottom-center) */}
      <div
        className="fixed flex flex-col items-center justify-center gap-3"
        style={{ left: left + newsletterW + GAP, top: top + topRowH + GAP, width: dotsColW, height: bottomRowH }}
      >
        {CATEGORIES.map((cat) => (
          <CategoryDot
            key={cat.id}
            label={cat.label}
            icon={cat.icon}
            isActive={category === cat.id}
            onClick={() => setCategory(cat.id)}
            color={cat.color}
          />
        ))}
      </div>
    </div>
  );
}
