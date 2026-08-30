"use client";

import React, { useState, useEffect } from "react";
import { Poppins } from "next/font/google";
import {
  HiOutlinePencilSquare,
  HiOutlineEnvelopeOpen,
  HiOutlineBookOpen,
  HiOutlineRss,
  HiOutlineCalendar,
} from "react-icons/hi2";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SOFT_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export default function FeedPage() {
  const [data, setData] = useState(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subMessage, setSubMessage] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetch("/api/feed")
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then(setData)
      .catch(() => {});

    function handleMouseMove(e) {
      setMousePos({ x: e.clientX, y: e.clientY });
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
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
        setSubMessage({
          type: "success",
          text: resData.alreadySubscribed
            ? "You are already subscribed to our newsletter! 🖤"
            : "Welcome aboard! Check your inbox for confirmation. 🖤",
        });
        setEmail("");
      } else {
        setSubMessage({ type: "error", text: resData.error || "Subscription failed." });
      }
    } catch {
      setSubMessage({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const isLoading = !data;
  const blogs = data?.blogs || [];
  const news = data?.news || [];

  return (
    <div className={`${poppins.className} relative flex min-h-dvh w-full flex-1 flex-col items-center overflow-x-hidden bg-transparent`}>
      {/* Interactive mouse-tracking spotlight radial gradient beam */}
      <div
        className="pointer-events-none fixed inset-0 z-[-1] transition-opacity duration-300 opacity-60"
        style={{
          background: `radial-gradient(650px circle at ${mousePos.x}px ${mousePos.y}px, rgba(219, 154, 255, 0.05), rgba(244, 63, 94, 0.03), transparent 70%)`,
        }}
      />

      {/* Ambient background aura glow spheres */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-pink-400/10 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-red-400/8 blur-[100px]" />

      <div className="flex w-full max-w-6xl flex-col gap-8 px-6 pt-16 pb-36">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3.5 py-1 shadow-xs backdrop-blur-xs">
            <HiOutlineBookOpen className="h-4 w-4 text-neutral-600 animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-600">
              Community Feed
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 leading-none">
            MenOfMatrix Feed
          </h1>
          <p className="text-sm text-neutral-500 max-w-md">
            Our collection of published articles, drop insights, and curated AI news.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Blogs Feed (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2 px-1">
              <HiOutlinePencilSquare className="h-5 w-5 text-neutral-500" />
              Latest Articles
            </h2>

            {isLoading ? (
              // Blogs Skeleton loader
              [1, 2].map((n) => (
                <div key={n} className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_16px_40px_rgba(60,50,35,0.06)] backdrop-blur-xl animate-pulse space-y-4">
                  <div className="aspect-[16/9] w-full rounded-2xl bg-neutral-200/50" />
                  <div className="h-5 w-3/4 rounded-full bg-neutral-200" />
                  <div className="h-3 w-full rounded-full bg-neutral-200/60" />
                  <div className="h-3 w-2/3 rounded-full bg-neutral-200/40" />
                </div>
              ))
            ) : blogs.length === 0 ? (
              <div className="rounded-3xl border border-white/80 bg-white/90 p-8 text-center shadow-[0_16px_40px_rgba(60,50,35,0.06)] backdrop-blur-xl">
                <p className="text-sm text-neutral-400">No published articles yet. Check back soon!</p>
              </div>
            ) : (
              blogs.map((blog) => (
                <article
                  key={blog.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_16px_40px_rgba(60,50,35,0.06),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_24px_56px_rgba(60,50,35,0.12)]"
                  style={{ transitionTimingFunction: SOFT_EASE }}
                >
                  {/* cover image */}
                  {blog.cover_image_url && (
                    <div className="mb-4 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-neutral-100 relative">
                      <img
                        src={blog.cover_image_url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                        style={{ transitionTimingFunction: SOFT_EASE }}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-neutral-400 mb-2">
                    <span className="flex items-center gap-1">
                      <HiOutlineCalendar className="h-3.5 w-3.5" />
                      {new Date(blog.published_at || blog.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-neutral-800 leading-snug group-hover:text-black transition-colors duration-300">
                    {blog.title}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-neutral-600 line-clamp-3">
                    {blog.excerpt}
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                      Blog Post
                    </span>
                    <a
                      href={`/blogs/${blog.slug}`}
                      className="text-xs font-semibold text-neutral-900 group-hover:translate-x-1 transition-transform duration-300 flex items-center gap-1"
                    >
                      Read Article &rarr;
                    </a>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Right Column: Newsletter & News Feed (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-neutral-800 flex items-center gap-2 px-1">
              <HiOutlineEnvelopeOpen className="h-5 w-5 text-neutral-500" />
              Newsletter Center
            </h2>

            {/* Subscription Card */}
            <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_16px_40px_rgba(60,50,35,0.06),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-xl">
              <h3 className="text-sm font-bold text-neutral-800">Subscribe to MenOfMatrix</h3>
              <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
                Stay updated with weekly newsletters covering latest drops, tech logs, and community notes.
              </p>

              <form onSubmit={handleSubscribe} className="mt-4 flex flex-col gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full rounded-2xl border border-neutral-100 bg-white/60 px-4 py-2.5 text-xs text-neutral-800 placeholder-neutral-400 shadow-inner focus:border-neutral-300 focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-neutral-900 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-neutral-800 disabled:bg-neutral-400 transition-colors cursor-pointer"
                >
                  {submitting ? "Joining..." : "Subscribe Now"}
                </button>
              </form>

              {subMessage && (
                <div
                  className={`mt-3 rounded-xl p-3 text-xs leading-snug animate-in fade-in slide-in-from-top-2 duration-300 ${
                    subMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                      : "bg-rose-50 text-rose-800 border border-rose-100"
                  }`}
                  style={{ transitionTimingFunction: SOFT_EASE }}
                >
                  {subMessage.text}
                </div>
              )}
            </div>

            {/* AI News Feed */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-neutral-700 flex items-center gap-1.5 px-1 mt-2">
                <HiOutlineRss className="h-4 w-4 text-neutral-500" />
                Latest Curated News
              </h3>

              {isLoading ? (
                // News skeleton
                [1, 2, 3].map((n) => (
                  <div key={n} className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-[0_16px_40px_rgba(60,50,35,0.04)] backdrop-blur-xl animate-pulse space-y-2">
                    <div className="h-3 w-1/3 rounded-full bg-neutral-200" />
                    <div className="h-4 w-5/6 rounded-full bg-neutral-200/70" />
                  </div>
                ))
              ) : news.length === 0 ? (
                <div className="rounded-3xl border border-white/80 bg-white/90 p-6 text-center shadow-[0_16px_40px_rgba(60,50,35,0.04)] backdrop-blur-xl">
                  <p className="text-xs text-neutral-400">No news feeds loaded. Subscribe to stay in touch!</p>
                </div>
              ) : (
                news.slice(0, 5).map((item) => (
                  <a
                    key={item.id}
                    href={item.link || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-3xl border border-white/80 bg-white/90 p-4 shadow-[0_16px_40px_rgba(60,50,35,0.04),0_1px_3px_rgba(0,0,0,0.02)] backdrop-blur-xl transition-all duration-400 hover:shadow-[0_20px_48px_rgba(60,50,35,0.08)] flex flex-col gap-1.5"
                    style={{ transitionTimingFunction: SOFT_EASE }}
                  >
                    <div className="flex items-center justify-between text-[9px] text-neutral-400">
                      <span className="font-semibold text-neutral-500 uppercase tracking-wider">
                        {item.source || "AI News"}
                      </span>
                      <span>
                        {new Date(item.published_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-neutral-800 leading-snug group-hover:text-black transition-colors duration-200">
                      {item.title}
                    </h4>

                    {item.description && (
                      <p className="text-[11px] leading-relaxed text-neutral-500 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </a>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
