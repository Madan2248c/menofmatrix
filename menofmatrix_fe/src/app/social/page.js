"use client";

import { useEffect, useRef, useState } from "react";
import { Poppins } from "next/font/google";
import { SiInstagram, SiYoutube, SiX } from "react-icons/si";
import {
  HiOutlineHeart,
  HiOutlineChatBubbleOvalLeft,
  HiOutlinePlay,
  HiXMark,
  HiOutlineArrowTopRightOnSquare,
} from "react-icons/hi2";
import { Tweet, useTweet } from "react-tweet";
import "react-tweet/theme.css";
import LeftPanel, { StoryDeck, PostDeck } from "./LeftPanel";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"] });

const API = "/api";

const PLATFORM = {
  instagram: {
    label: "Instagram",
    countLabel: "followers",
    actionLabel: "Follow",
    profileUrl: (username) => `https://instagram.com/${username}`,
    icon: <SiInstagram className="h-4 w-4" />,
    badgeBg: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white",
    glowClass:
      "hover:shadow-[0_16px_36px_rgba(225,48,108,0.22)] hover:border-pink-300/60 focus-within:shadow-[0_16px_36px_rgba(225,48,108,0.22)]",
    pulseColor: "bg-pink-500",
  },
  youtube: {
    label: "YouTube",
    countLabel: "subscribers",
    actionLabel: "Subscribe",
    profileUrl: (_username, channelId) =>
      channelId ? `https://youtube.com/channel/${channelId}` : null,
    icon: <SiYoutube className="h-4 w-4" />,
    badgeBg: "bg-red-600 text-white",
    glowClass:
      "hover:shadow-[0_16px_36px_rgba(255,0,0,0.20)] hover:border-red-300/60 focus-within:shadow-[0_16px_36px_rgba(255,0,0,0.20)]",
    pulseColor: "bg-red-500",
  },
  twitter: {
    label: "Twitter",
    countLabel: "followers",
    actionLabel: "Follow",
    profileUrl: (username) => `https://x.com/${username}`,
    icon: <SiX className="h-3.5 w-3.5" />,
    badgeBg: "bg-neutral-950 text-white ring-1 ring-white/20",
    glowClass:
      "hover:shadow-[0_16px_36px_rgba(30,30,30,0.20)] hover:border-neutral-400/60 focus-within:shadow-[0_16px_36px_rgba(30,30,30,0.20)]",
    pulseColor: "bg-neutral-700",
  },
};

function formatCount(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

// Connecting an account only ever happens from the owner-authenticated admin
// app — it stores tokens/data server-side. This page is public and
// read-only: it just displays whatever is currently connected.
function Pill({ platform, data, className = "", transparent = false }) {
  const meta = PLATFORM[platform];
  const connected = !!data?.connected;
  const username = data?.username || meta.label;
  const profileUrl = connected ? meta.profileUrl(username, data?.channelId) : null;
  const primary = connected ? `${formatCount(data?.followersCount)} ${meta.countLabel}` : meta.label;
  const secondary = connected ? `@${username}` : "Not connected yet";

  return (
    <div
      className={
        transparent
          ? `group relative flex w-full max-w-sm sm:w-80 items-center gap-3.5 overflow-hidden px-5 py-3.5 bg-transparent border-none shadow-none backdrop-blur-none transition-all duration-300 ${className}`
          : `group relative flex w-full max-w-sm sm:w-80 items-center gap-3.5 overflow-hidden rounded-full border border-white/85 bg-white/85 px-5 py-3.5 shadow-[0_10px_28px_rgba(60,50,35,0.06),0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 ${meta.glowClass} ${className}`
      }
    >
      {/* Subtle top-edge light reflection for luxury glass feel */}
      {!transparent && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
      )}

      {/* Platform Icon Badge */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ${meta.badgeBg} shadow-xs ring-2 ring-white/80 transition-transform duration-300 group-hover:scale-105`}
      >
        {meta.icon}
      </div>

      <div className="min-w-0 flex-1 leading-tight">
        <div className="flex items-center gap-1.5 truncate text-sm font-semibold text-neutral-900">
          <span>{primary}</span>
          {connected && (
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${meta.pulseColor} opacity-75`}
              title="Verified Sync"
            />
          )}
        </div>
        <div className="truncate text-xs text-neutral-500 transition-colors group-hover:text-neutral-700">
          {secondary}
        </div>
      </div>

      {profileUrl && (
        <a
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          className="w-24 shrink-0 rounded-full bg-neutral-900 py-1.5 text-center text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:scale-[1.03] hover:bg-black hover:shadow-md active:scale-[0.98]"
        >
          {meta.actionLabel}
        </a>
      )}
    </div>
  );
}

function SkeletonPill({ nameWidth }) {
  return (
    <div className="relative flex w-full max-w-sm sm:w-80 items-center gap-3.5 overflow-hidden rounded-full border border-white/80 bg-white/75 px-5 py-3.5 shadow-[0_10px_28px_rgba(60,50,35,0.05)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-60" />
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-neutral-200/80" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-3.5 w-20 animate-pulse rounded-full bg-neutral-200/80" />
        <div className={`h-2.5 animate-pulse rounded-full bg-neutral-100/90 ${nameWidth}`} />
      </div>
    </div>
  );
}

function clip(text, max) {
  if (!text) return "";
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

// Highlights links/hashtags/mentions like a real tweet renders them.
function TweetText({ children }) {
  const parts = children.split(/(https?:\/\/[^\s]+|[#@][\p{L}\p{N}_]+)/gu);
  return parts.map((part, i) => {
    const highlighted =
      part.startsWith("http://") || part.startsWith("https://") || part.startsWith("#") || part.startsWith("@");
    return highlighted ? (
      <span key={i} className="text-sky-500">
        {part}
      </span>
    ) : (
      part
    );
  });
}

function formatLikeCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function formatTweetDate(iso) {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

// Just the essentials — avatar, text, date, like count — styled with the
// site's own font/colors instead of react-tweet's bundled embed markup
// (which brings its own header, follow button, and Twitter-specific CSS).
// Real data (avatar, text, likes, timestamp) still comes from react-tweet's
// `useTweet`, just rendered with our own minimal JSX.
function MiniTweet({ id, fallbackText, onOpen }) {
  const { data, isLoading, error } = useTweet(id);

  if (isLoading) {
    return (
      <div className="flex animate-pulse gap-2.5">
        <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-200" />
        <div className="flex-1 space-y-1.5 pt-0.5">
          <div className="h-2.5 w-full rounded-full bg-neutral-200" />
          <div className="h-2.5 w-4/5 rounded-full bg-neutral-200" />
          <div className="h-2.5 w-1/3 rounded-full bg-neutral-100" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <p className={`${poppins.className} whitespace-pre-wrap break-words text-[11px] leading-snug text-neutral-700`}>
        {clip(fallbackText, 140)}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(id)}
      className={`${poppins.className} -m-1.5 flex gap-2.5 rounded-xl p-1.5 text-left transition-colors duration-150 hover:bg-neutral-50`}
    >
      <img src={data.user.profile_image_url_https} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <p className="whitespace-pre-wrap break-words text-[11px] leading-snug text-neutral-700">
          <TweetText>{clip(data.text, 150)}</TweetText>
        </p>
        <div className="mt-1 flex items-center text-[10px] text-neutral-400">
          <span>{formatTweetDate(data.created_at)}</span>
          <span className="ml-auto flex items-center gap-3">
            <span className="flex items-center gap-1">
              <HiOutlineChatBubbleOvalLeft className="h-3 w-3" />
              {formatLikeCount(data.conversation_count)}
            </span>
            <span className="flex items-center gap-1">
              <HiOutlineHeart className="h-3 w-3" />
              {formatLikeCount(data.favorite_count)}
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}

// Full, authentic tweet embed (react-tweet's own markup, not our minimal
// card) shown in a centered modal with a soft fade/scale-in — the "beautiful
// full tweet" view when a mini tweet is clicked.
const SOFT_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function TweetModal({ id, onClose }) {
  const [visible, setVisible] = useState(false);
  const { data, isLoading, error } = useTweet(id);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setVisible(false);
    setTimeout(onClose, 320);
  }

  return (
    <div
      className={`${poppins.className} fixed inset-0 z-[100] flex items-center justify-center p-4`}
      style={{
        backgroundColor: visible ? "rgba(20,18,15,0.4)" : "rgba(20,18,15,0)",
        backdropFilter: visible ? "blur(8px)" : "blur(0px)",
        transition: `background-color 320ms ${SOFT_EASE}, backdrop-filter 320ms ${SOFT_EASE}`,
      }}
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[28px] bg-white text-neutral-800 shadow-[0_32px_64px_rgba(20,18,15,0.18),0_8px_24px_rgba(20,18,15,0.06)] border border-neutral-100"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.96)",
          transition: `opacity 320ms ${SOFT_EASE}, transform 320ms ${SOFT_EASE}`,
        }}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100/60 text-neutral-500 transition-colors hover:bg-neutral-200/80 hover:text-neutral-700"
        >
          <HiXMark className="h-4.5 w-4.5" />
        </button>

        {isLoading ? (
          <div className="flex animate-pulse flex-col p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-neutral-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/3 rounded-full bg-neutral-100" />
                <div className="h-2.5 w-1/4 rounded-full bg-neutral-100/60" />
              </div>
            </div>
            <div className="space-y-2 py-2">
              <div className="h-3 w-full rounded-full bg-neutral-100" />
              <div className="h-3 w-5/6 rounded-full bg-neutral-100" />
              <div className="h-3 w-2/3 rounded-full bg-neutral-100/60" />
            </div>
            <div className="h-48 w-full rounded-[20px] bg-neutral-100/60" />
            <div className="h-10 w-full rounded-2xl bg-neutral-100" />
          </div>
        ) : error || !data ? (
          <div className="flex flex-col p-8 text-center items-center justify-center space-y-3">
            <p className="text-sm text-neutral-400">Failed to load tweet data.</p>
            <button
              type="button"
              onClick={close}
              className="rounded-xl bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="flex flex-col p-6">
            {/* Author Header */}
            <div className="flex items-center gap-3 pr-8">
              <img
                src={data.user.profile_image_url_https}
                alt=""
                className="h-11 w-11 rounded-full object-cover ring-1 ring-black/5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-[13px] text-neutral-800 tracking-tight leading-tight block truncate">
                    {data.user.name}
                  </span>
                  {data.user.verified && (
                    <svg className="h-4 w-4 text-sky-500 fill-current shrink-0" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </div>
                <span className="text-[11px] text-neutral-400 block truncate">
                  @{data.user.screen_name}
                </span>
              </div>
              <a
                href={`https://x.com/${data.user.screen_name}/status/${data.id_str || id}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-50 text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                <SiX className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Text content */}
            <div className="mt-4 text-[13px] leading-relaxed text-neutral-700 whitespace-pre-wrap break-words">
              <TweetText>{data.text}</TweetText>
            </div>

            {/* Media attachments */}
            {data.mediaDetails && data.mediaDetails.length > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                {data.mediaDetails.map((media, idx) => {
                  if (media.type === "video" || media.type === "animated_gif") {
                    const mp4Variant = data.video?.variants?.find(
                      (v) => v.content_type === "video/mp4"
                    ) || data.video?.variants?.[0];
                    return (
                      <video
                        key={idx}
                        src={mp4Variant?.url}
                        controls
                        playsInline
                        loop={media.type === "animated_gif"}
                        autoPlay={media.type === "animated_gif"}
                        muted={media.type === "animated_gif"}
                        className="w-full rounded-[20px] overflow-hidden max-h-[300px] object-cover shadow-sm bg-neutral-950 ring-1 ring-black/5"
                      />
                    );
                  } else {
                    return (
                      <img
                        key={idx}
                        src={media.media_url_https}
                        alt=""
                        className="w-full rounded-[20px] overflow-hidden max-h-[300px] object-cover shadow-sm ring-1 ring-black/5"
                      />
                    );
                  }
                })}
              </div>
            )}

            {/* Footer timestamp & stats */}
            <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
              <span>{formatTweetDate(data.created_at)}</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <HiOutlineChatBubbleOvalLeft className="h-4 w-4 text-neutral-400" />
                  {formatLikeCount(data.conversation_count)}
                </span>
                <span className="flex items-center gap-1.5">
                  <HiOutlineHeart className="h-4 w-4 text-neutral-400" />
                  {formatLikeCount(data.favorite_count)}
                </span>
              </div>
            </div>

            {/* CTA Open on Twitter */}
            <a
              href={`https://x.com/${data.user.screen_name}/status/${data.id_str || id}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-neutral-800 transition-colors"
            >
              <span>Open on X</span>
              <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

const BOX_GAP = 24; // px gap between the dock and the box
const BOX_MARGIN = 24; // px breathing room kept from the real viewport edge
const BOX_MIN_WIDTH = 200; // below this it's not worth showing the box

// The floating dock is `position:fixed` (see Footer.js) — only one of its
// two responsive variants is actually rendered at a time (the other is
// `display:none`), so find whichever one has real height right now.
function getDockRect() {
  const candidates = document.querySelectorAll("footer .fixed");
  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    if (rect.height > 0) return rect;
  }
  return null;
}

// A standalone box to the right of the floating dock, top-aligned with the
// Twitter pill and extending down to the dock, showing the latest tweets.
// It's `position:fixed` (viewport-relative, like getBoundingClientRect())
// and entirely outside the normal flex flow, so its size never feeds back
// into and shifts anything else's position.
function TweetsBox({
  twitter,
  twitterRef,
  onOpenTweet,
  transparent = false,
  onMouseEnter,
  onMouseLeave,
  containerRef,
}) {
  const [box, setBox] = useState(null); // null = not measured yet; { left, top, width, height, gapLeft } | false

  useEffect(() => {
    function measure() {
      const dockRect = getDockRect();
      const twitterRect = twitterRef.current?.getBoundingClientRect();
      if (!dockRect || !twitterRect) return;

      const left = dockRect.right + BOX_GAP;
      const width = window.innerWidth - left - BOX_MARGIN;
      if (width < BOX_MIN_WIDTH) {
        setBox(false);
        return;
      }

      const top = twitterRect.top;
      const height = Math.max(dockRect.bottom - top, 0);
      setBox({ left, top, width, height });
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [twitterRef]);

  if (!box) return null;

  return (
    <div
      ref={containerRef}
      className={
        transparent
          ? "fixed overflow-hidden transition-all duration-300 bg-transparent border-none shadow-none backdrop-blur-none"
          : "fixed overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-[0_16px_40px_rgba(60,50,35,0.08),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all duration-300"
      }
      style={{
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {!transparent && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
      )}
      <div className="flex h-full flex-col p-5">
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
          <span className="flex items-center gap-1.5 text-neutral-700">
            <SiX className="h-3 w-3 text-neutral-900" />
            Latest on X
          </span>
          {twitter?.username && (
            <span className="text-[10px] text-neutral-400">@{twitter.username}</span>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-evenly gap-3">
          {twitter.tweets.slice(0, 2).map((tweet, i) => (
            <MiniTweet key={tweet.id || i} id={tweet.id} fallbackText={tweet.text} onOpen={onOpenTweet} />
          ))}
        </div>
        {/* Hints there's more on the profile beyond these two */}
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-neutral-300" />
          <span className="h-1 w-1 rounded-full bg-neutral-300" />
          <span className="h-1 w-1 rounded-full bg-neutral-300" />
        </div>
      </div>
    </div>
  );
}

// A second standalone box, same left/width as TweetsBox, stacked directly
function formatViewCount(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(num);
}

function VideoRow({ video, compact }) {
  return (
    <a
      href={video.video_url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-neutral-50"
    >
      <div className="relative shrink-0 overflow-hidden rounded-lg">
        <img
          src={video.thumbnail_url}
          alt=""
          className={`aspect-video ${compact ? "h-10" : "h-12"} w-auto object-cover`}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-150 group-hover:bg-black/25">
          <div className="flex h-5 w-5 scale-90 items-center justify-center rounded-full bg-white/0 text-white opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:bg-black/40 group-hover:opacity-100">
            <HiOutlinePlay className="h-3 w-3 translate-x-[1px]" />
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`${poppins.className} line-clamp-2 text-[11px] leading-snug font-medium text-neutral-800`}>
          {video.title}
        </p>
        <p className="mt-1 text-[10px] text-neutral-400">{formatViewCount(video.view_count)} views</p>
      </div>
    </a>
  );
}

// Bigger banner-style card for the two featured slots on the left half.
function FeaturedVideoCard({ video, label }) {
  return (
    <a
      href={video.video_url}
      target="_blank"
      rel="noreferrer"
      className="group flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl transition-colors hover:bg-neutral-50"
    >
      <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-lg bg-neutral-100">
        <img src={video.thumbnail_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white">
          {label}
        </span>
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-150 group-hover:bg-black/25">
          <div className="flex h-6 w-6 scale-90 items-center justify-center rounded-full bg-white/0 text-white opacity-0 transition-all duration-150 group-hover:scale-100 group-hover:bg-black/40 group-hover:opacity-100">
            <HiOutlinePlay className="h-3.5 w-3.5 translate-x-[1px]" />
          </div>
        </div>
      </div>
      <p className={`${poppins.className} mt-1.5 line-clamp-2 shrink-0 text-[11px] leading-snug font-medium text-neutral-800`}>
        {video.title}
      </p>
      <p className="mt-0.5 shrink-0 text-[10px] text-neutral-400">{formatViewCount(video.view_count)} views</p>
    </a>
  );
}

// Vertically scroll-snapped list: the card nearest the container's vertical
// center sits at full scale, cards further away shrink slightly, top/bottom
// edges fade via a mask, native scroll-snap locks the nearest card to
// center on release, and timely auto-scrolling cycles top-to-bottom and
// bottom-to-top continuously.
function VideoCarousel({ videos, boxHeight }) {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const [scales, setScales] = useState(() => videos.map(() => 1));
  const [centerIndex, setCenterIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const directionRef = useRef(1); // 1 = downwards, -1 = upwards
  const currentIndexRef = useRef(0);

  const edgePad = Math.max((boxHeight || 300) * 0.32, 32);

  // Keep currentIndexRef in sync with centerIndex
  useEffect(() => {
    currentIndexRef.current = centerIndex;
  }, [centerIndex]);

  // Timely auto-movement: cycles top-to-bottom and bottom-to-top
  useEffect(() => {
    if (videos.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      const current = currentIndexRef.current;
      let dir = directionRef.current;
      let next = current + dir;

      if (next >= videos.length) {
        dir = -1;
        directionRef.current = -1;
        next = Math.max(0, current - 1);
      } else if (next < 0) {
        dir = 1;
        directionRef.current = 1;
        next = Math.min(videos.length - 1, current + 1);
      }

      if (next >= 0 && next < videos.length) {
        itemRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [videos.length, isPaused]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let raf = null;
    function update() {
      raf = null;
      const cRect = container.getBoundingClientRect();
      const centerY = cRect.top + cRect.height / 2;
      const maxDist = cRect.height / 2 || 1;
      let closestIdx = 0;
      let closestDist = Infinity;
      const nextScales = itemRefs.current.map((el, i) => {
        if (!el) return 1;
        const r = el.getBoundingClientRect();
        const dist = Math.abs(r.top + r.height / 2 - centerY);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
        return 1 - Math.min(dist / maxDist, 1) * 0.2;
      });
      setScales(nextScales);
      setCenterIndex(closestIdx);
    }
    function onScroll() {
      if (raf == null) raf = requestAnimationFrame(update);
    }

    update();
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [videos.length]);

  function goTo(i) {
    directionRef.current = i >= centerIndex ? 1 : -1;
    itemRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div
      className="flex min-h-0 flex-1 gap-1.5"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={containerRef}
        className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          paddingTop: edgePad,
          paddingBottom: edgePad,
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
          maskImage: "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)",
        }}
      >
        {videos.map((video, i) => (
          <div
            key={video.id}
            ref={(el) => (itemRefs.current[i] = el)}
            className="snap-center py-1"
            style={{
              transform: `scale(${scales[i] ?? 1})`,
              transition: "transform 150ms ease-out",
            }}
          >
            <VideoRow video={video} compact />
          </div>
        ))}
      </div>
      <div className="flex w-2 shrink-0 flex-col items-center justify-center gap-1.5">
        {videos.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Jump to video ${i + 1}`}
            className={`rounded-full bg-neutral-300 transition-all duration-200 ${
              i === centerIndex ? "h-2.5 w-1.5 !bg-red-500 rounded-full" : "h-1 w-1 hover:bg-neutral-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// A second standalone box, same left/width as TweetsBox, stacked directly
// above it — spanning from the real viewport top edge down to just above
// where TweetsBox starts. Left half: the most recent video and the
// highest-viewed video, featured. Right half: everything else, as a
// center-snapping vertical carousel.
function TopBox({
  youtubeRef,
  videos,
  transparent = false,
  onMouseEnter,
  onMouseLeave,
  containerRef,
}) {
  const [box, setBox] = useState(null); // null = not measured yet; { left, top, width, height, gapLeft } | false

  useEffect(() => {
    function measure() {
      const dockRect = getDockRect();
      const youtubeRect = youtubeRef.current?.getBoundingClientRect();
      if (!dockRect || !youtubeRect) return;

      const left = dockRect.right + BOX_GAP;
      const width = window.innerWidth - left - BOX_MARGIN;
      if (width < BOX_MIN_WIDTH) {
        setBox(false);
        return;
      }

      const top = BOX_MARGIN;
      const height = Math.max(youtubeRect.bottom - top, 0);
      setBox({ left, top, width, height });
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [youtubeRef]);

  if (!box) return null;

  const recent = videos[0];
  const byViews = [...videos].sort((a, b) => (Number(b.view_count) || 0) - (Number(a.view_count) || 0));
  let topViewed = byViews[0];
  if (topViewed && recent && topViewed.id === recent.id) topViewed = videos[1] || byViews[1];
  const featuredIds = new Set([recent?.id, topViewed?.id].filter(Boolean));
  const remaining = videos.filter((v) => !featuredIds.has(v.id));

  return (
    <div
      ref={containerRef}
      className={
        transparent
          ? "fixed overflow-hidden transition-all duration-300 bg-transparent border-none shadow-none backdrop-blur-none"
          : "fixed overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-[0_16px_40px_rgba(60,50,35,0.08),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all duration-300"
      }
      style={{
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {!transparent && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
      )}
      <div className="flex h-full flex-col p-5">
        <div className="mb-2 flex shrink-0 items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
          <span className="flex items-center gap-1.5 text-neutral-700">
            <SiYoutube className="h-3.5 w-3.5 text-red-600" />
            More on YouTube
          </span>
          <span className="text-[9px] text-neutral-400">Broadcasts</span>
        </div>
        <div className="flex min-h-0 flex-1 gap-4">
          <div className="flex min-h-0 w-[45%] flex-col gap-2">
            {recent && <FeaturedVideoCard video={recent} label="Latest" />}
            {topViewed && <FeaturedVideoCard video={topViewed} label="Most viewed" />}
          </div>
          {remaining.length > 0 && (
            <div className="flex min-h-0 flex-1 border-l border-neutral-100/80 pl-3">
              <VideoCarousel videos={remaining} boxHeight={box.height} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile & Tablet Bento Grid Feed Component
// ---------------------------------------------------------------------------
function MobileBentoFeed({ data, stories, posts, followers, onOpenTweet }) {
  const videos = data?.youtube?.videos || [];
  const tweets = data?.twitter?.tweets || [];
  const recentVideo = videos[0];
  const otherVideos = videos.slice(1, 5);

  return (
    <div className="flex w-full max-w-xl flex-col gap-6 px-4 pt-6 pb-36">
      {/* Header section */}
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white/90 px-3 py-1 shadow-xs backdrop-blur-xs">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-neutral-600">
            Official Network
          </span>
        </div>
        <h1 className={`${poppins.className} text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900`}>
          Connect with MenOfMatrix
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-md">
          Live stories, broadcasts, and thoughts from our digital collective.
        </p>
      </div>

      {/* Main Channel Badges */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-3">
        {data ? (
          <>
            <Pill platform="instagram" data={data.instagram} />
            <Pill platform="youtube" data={data.youtube} />
            <Pill platform="twitter" data={data.twitter} />
          </>
        ) : (
          <>
            <SkeletonPill nameWidth="w-32" />
            <SkeletonPill nameWidth="w-24" />
            <SkeletonPill nameWidth="w-28" />
          </>
        )}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 gap-5">
        {/* Card 1: Instagram Studio */}
        <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_36px_rgba(60,50,35,0.06),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_18px_42px_rgba(60,50,35,0.1)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-xs">
                <SiInstagram className="h-4 w-4" />
              </div>
              <div>
                <h2 className={`${poppins.className} text-xs font-semibold text-neutral-900`}>Instagram Feed</h2>
                <p className="text-[10px] text-neutral-400">
                  {data?.instagram?.username ? `@${data.instagram.username}` : "Stories & Posts"}
                </p>
              </div>
            </div>
            {data?.instagram?.username && (
              <a
                href={`https://instagram.com/${data.instagram.username}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 rounded-full bg-neutral-100/90 px-3 py-1 text-[10px] font-semibold text-neutral-700 hover:bg-neutral-200/90 transition-colors"
              >
                <span>View</span>
                <HiOutlineArrowTopRightOnSquare className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="space-y-4">
            {/* Story Showcase or Highlights */}
            {stories.data.length > 0 && (
              <div className="relative flex h-56 w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-50/80 p-2 border border-neutral-100">
                <StoryDeck stories={stories.data} source={stories.source} />
              </div>
            )}

            {/* Recent Posts Grid */}
            {posts.length > 0 && (
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Recent Posts & Reels
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {posts.slice(0, 4).map((post) => {
                    const img = post.thumbnail_url || post.media_url;
                    return (
                      <a
                        key={post.id}
                        href={post.permalink || undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-100 shadow-xs border border-white/50"
                      >
                        {img && (
                          <img
                            src={img}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                        {post.media_product_type === "REELS" && (
                          <span className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs">
                            <HiOutlinePlay className="h-2 w-2" />
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Community Follower Avatar Bubbles Ribbon */}
            {followers.length > 0 && (
              <div className="pt-2">
                <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  <span>Community Network</span>
                  <span>{followers.length}+ active</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {followers.slice(0, 14).map((follower, idx) => (
                    <div
                      key={follower.id || idx}
                      title={follower.username ? `@${follower.username}` : follower.full_name}
                      className="group relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white bg-neutral-200 shadow-xs ring-1 ring-black/5"
                    >
                      {follower.profile_pic_url ? (
                        <img
                          src={follower.profile_pic_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-neutral-400">
                          {follower.username?.[0]?.toUpperCase() || "M"}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: YouTube Broadcast Hub */}
        {videos.length > 0 && (
          <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_36px_rgba(60,50,35,0.06),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_18px_42px_rgba(60,50,35,0.1)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
                  <SiYoutube className="h-4 w-4" />
                </div>
                <div>
                  <h2 className={`${poppins.className} text-xs font-semibold text-neutral-900`}>YouTube Broadcasts</h2>
                  <p className="text-[10px] text-neutral-400">Latest drops & deep dives</p>
                </div>
              </div>
              {data?.youtube?.channelId && (
                <a
                  href={`https://youtube.com/channel/${data.youtube.channelId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-full bg-neutral-100/90 px-3 py-1 text-[10px] font-semibold text-neutral-700 hover:bg-neutral-200/90 transition-colors"
                >
                  <span>Channel</span>
                  <HiOutlineArrowTopRightOnSquare className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* Featured Video */}
            {recentVideo && (
              <a
                href={recentVideo.video_url}
                target="_blank"
                rel="noreferrer"
                className="group block overflow-hidden rounded-2xl bg-neutral-50/90 p-2.5 transition-all hover:bg-neutral-100/90 border border-neutral-100"
              >
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-900 shadow-sm">
                  <img
                    src={recentVideo.thumbnail_url}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg transition-transform group-hover:scale-110">
                      <HiOutlinePlay className="h-5 w-5 translate-x-[1px]" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase text-white backdrop-blur-xs">
                    Latest Drop
                  </span>
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-[9px] text-white backdrop-blur-xs">
                    {formatViewCount(recentVideo.view_count)} views
                  </span>
                </div>
                <div className="mt-2.5 px-1">
                  <h3 className={`${poppins.className} line-clamp-2 text-xs font-semibold text-neutral-900`}>
                    {recentVideo.title}
                  </h3>
                </div>
              </a>
            )}

            {/* Secondary Videos List */}
            {otherVideos.length > 0 && (
              <div className="mt-3 divide-y divide-neutral-100">
                {otherVideos.map((video) => (
                  <div key={video.id} className="py-2">
                    <VideoRow video={video} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Card 3: X / Twitter Pulse */}
        {tweets.length > 0 && (
          <div className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_14px_36px_rgba(60,50,35,0.06),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_18px_42px_rgba(60,50,35,0.1)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-950 text-white shadow-xs ring-1 ring-white/20">
                  <SiX className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h2 className={`${poppins.className} text-xs font-semibold text-neutral-900`}>Latest on X</h2>
                  <p className="text-[10px] text-neutral-400">
                    {data?.twitter?.username ? `@${data.twitter.username}` : "Thoughts & Updates"}
                  </p>
                </div>
              </div>
              {data?.twitter?.username && (
                <a
                  href={`https://x.com/${data.twitter.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 rounded-full bg-neutral-100/90 px-3 py-1 text-[10px] font-semibold text-neutral-700 hover:bg-neutral-200/90 transition-colors"
                >
                  <span>Open X</span>
                  <HiOutlineArrowTopRightOnSquare className="h-3 w-3" />
                </a>
              )}
            </div>

            <div className="divide-y divide-neutral-100">
              {tweets.slice(0, 3).map((tweet, i) => (
                <div key={tweet.id || i} className="py-2">
                  <MiniTweet id={tweet.id} fallbackText={tweet.text} onOpen={onOpenTweet} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConvexInstagramBackground({ layout, isHovered }) {
  if (!layout) return null;

  const { panel, pill } = layout;

  // Local coordinates mapping
  const lw = panel.width;
  const lh = panel.height;
  const pw = pill.width;
  const ph = pill.height;
  const gapLeft = pill.left - panel.left;
  const pt = pill.top - panel.top;

  // Radii
  const rp = ph / 2;     // Pill-shaped right end
  const rt = 24;         // standard rounded-3xl
  const ri = 16;         // concave inner corner fillet

  const pathD = `M 0 ${rt} A ${rt} ${rt} 0 0 1 ${rt} 0 L ${lw - rt} 0 A ${rt} ${rt} 0 0 1 ${lw} ${rt} L ${lw} ${pt - ri} A ${ri} ${ri} 0 0 0 ${lw + ri} ${pt} L ${gapLeft + pw - rp} ${pt} A ${rp} ${rp} 0 0 1 ${gapLeft + pw - rp} ${pt + ph} L ${lw + ri} ${pt + ph} A ${ri} ${ri} 0 0 0 ${lw} ${pt + ph + ri} L ${lw} ${lh - rt} A ${rt} ${rt} 0 0 1 ${lw - rt} ${lh} L ${rt} ${lh} A ${rt} ${rt} 0 0 1 0 ${lh - rt} Z`;

  return (
    <div
      className="fixed pointer-events-none z-0 transition-all duration-300 ease-out"
      style={{
        left: panel.left,
        top: panel.top,
        width: pill.left + pw - panel.left,
        height: lh,
        filter: isHovered
          ? "drop-shadow(0 20px 48px rgba(225,48,108,0.18)) drop-shadow(0 1px 3px rgba(0,0,0,0.04))"
          : "drop-shadow(0 16px 40px rgba(60,50,35,0.08)) drop-shadow(0 1px 3px rgba(0,0,0,0.03))",
      }}
    >
      <div
        className="absolute inset-0 bg-white/90 backdrop-blur-xl transition-colors duration-300"
        style={{ clipPath: `path('${pathD}')` }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-85"
        style={{ height: 1.5, clipPath: `path('${pathD}')` }}
      />
      <svg className="absolute inset-0 w-full h-full">
        <path
          d={pathD}
          fill="none"
          stroke={isHovered ? "rgba(225, 48, 108, 0.25)" : "rgba(255, 255, 255, 0.85)"}
          strokeWidth="1.2"
          className="transition-all duration-300"
        />
      </svg>
    </div>
  );
}

function ConvexYoutubeBackground({ layout, isHovered }) {
  if (!layout) return null;

  const { pill, box: tbBox } = layout;

  // Local coordinates mapping
  const pw = pill.width;
  const ph = pill.height;
  const tw = tbBox.width;
  const th = tbBox.height;
  const gapLeft = tbBox.left - pill.left;
  const pt = th - ph; // bottom aligned

  // Radii
  const rp = ph / 2;     // Pill-shaped left end
  const rt = 24;         // standard rounded-3xl
  const ri = 16;         // concave inner corner fillet

  const pathD = `M ${gapLeft + rt} 0 L ${gapLeft + tw - rt} 0 A ${rt} ${rt} 0 0 1 ${gapLeft + tw} ${rt} L ${gapLeft + tw} ${th - rt} A ${rt} ${rt} 0 0 1 ${gapLeft + tw - rt} ${th} L ${rp} ${th} A ${rp} ${rp} 0 0 1 ${rp} ${pt} L ${gapLeft - ri} ${pt} A ${ri} ${ri} 0 0 0 ${gapLeft} ${pt - ri} L ${gapLeft} ${rt} A ${rt} ${rt} 0 0 1 ${gapLeft + rt} 0 Z`;

  return (
    <div
      className="fixed pointer-events-none z-0 transition-all duration-300 ease-out"
      style={{
        left: pill.left,
        top: tbBox.top,
        width: tbBox.left + tw - pill.left,
        height: th,
        filter: isHovered
          ? "drop-shadow(0 20px 48px rgba(255,0,0,0.16)) drop-shadow(0 1px 3px rgba(0,0,0,0.04))"
          : "drop-shadow(0 16px 40px rgba(60,50,35,0.08)) drop-shadow(0 1px 3px rgba(0,0,0,0.03))",
      }}
    >
      <div
        className="absolute inset-0 bg-white/90 backdrop-blur-xl transition-colors duration-300"
        style={{ clipPath: `path('${pathD}')` }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-85"
        style={{ height: 1.5, clipPath: `path('${pathD}')` }}
      />
      <svg className="absolute inset-0 w-full h-full">
        <path
          d={pathD}
          fill="none"
          stroke={isHovered ? "rgba(255, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.85)"}
          strokeWidth="1.2"
          className="transition-all duration-300"
        />
      </svg>
    </div>
  );
}

function ConvexTwitterBackground({ layout, isHovered }) {
  if (!layout) return null;

  const { pill, tweets } = layout;

  // Local coordinates mapping
  const pw = pill.width;
  const ph = pill.height;
  const tw = tweets.width;
  const th = tweets.height;
  const gapLeft = tweets.left - pill.left;

  // Radii
  const rp = ph / 2;     // Pill-shaped left end
  const rt = 24;         // standard rounded-3xl
  const ri = 16;         // concave inner corner fillet

  const pathD = `M ${rp} 0 L ${gapLeft + tw - rt} 0 A ${rt} ${rt} 0 0 1 ${gapLeft + tw} ${rt} L ${gapLeft + tw} ${th - rt} A ${rt} ${rt} 0 0 1 ${gapLeft + tw - rt} ${th} L ${gapLeft + rt} ${th} A ${rt} ${rt} 0 0 1 ${gapLeft} ${th - rt} L ${gapLeft} ${ph + ri} A ${ri} ${ri} 0 0 0 ${gapLeft - ri} ${ph} L ${rp} ${ph} A ${rp} ${rp} 0 0 1 0 ${rp} A ${rp} ${rp} 0 0 1 ${rp} 0 Z`;

  return (
    <div
      className="fixed pointer-events-none z-0 transition-all duration-300 ease-out"
      style={{
        left: pill.left,
        top: pill.top,
        width: tweets.left + tw - pill.left,
        height: Math.max(ph, th),
        filter: isHovered
          ? "drop-shadow(0 20px 48px rgba(0,0,0,0.14)) drop-shadow(0 1px 3px rgba(0,0,0,0.04))"
          : "drop-shadow(0 16px 40px rgba(60,50,35,0.08)) drop-shadow(0 1px 3px rgba(0,0,0,0.03))",
      }}
    >
      {/* Frosted glass backdrop */}
      <div
        className="absolute inset-0 bg-white/90 backdrop-blur-xl transition-colors duration-300"
        style={{
          clipPath: `path('${pathD}')`,
        }}
      />

      {/* Shiny top light reflection line clipped to shape */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-85"
        style={{
          height: 1.5,
          clipPath: `path('${pathD}')`,
        }}
      />

      {/* Border path */}
      <svg className="absolute inset-0 w-full h-full">
        <path
          d={pathD}
          fill="none"
          stroke={isHovered ? "rgba(30, 30, 30, 0.25)" : "rgba(255, 255, 255, 0.85)"}
          strokeWidth="1.2"
          className="transition-all duration-300"
        />
      </svg>
    </div>
  );
}

export default function Social() {
  const [data, setData] = useState(null);
  const [stories, setStories] = useState({ data: [], source: "cache" });
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [openTweetId, setOpenTweetId] = useState(null);

  const instagramRef = useRef(null);
  const youtubeRef = useRef(null);
  const twitterRef = useRef(null);
  const leftPanelRef = useRef(null);
  const topBoxRef = useRef(null);
  const tweetsBoxRef = useRef(null);

  const [instagramLayout, setInstagramLayout] = useState(null);
  const [youtubeLayout, setYoutubeLayout] = useState(null);
  const [convexLayout, setConvexLayout] = useState(null);

  const [isInstagramHovered, setIsInstagramHovered] = useState(false);
  const [isYoutubeHovered, setIsYoutubeHovered] = useState(false);
  const [isTwitterHovered, setIsTwitterHovered] = useState(false);

  const tweets = data?.twitter?.tweets || [];
  const videos = data?.youtube?.videos || [];

  useEffect(() => {
    fetch(`${API}/social`)
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then(setData)
      .catch(() => {});
    fetch("/api/stories?limit=8")
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((d) => setStories({ data: d.data || [], source: d.source }))
      .catch(() => {});
    fetch("/api/posts?limit=8")
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((d) => setPosts(d.data || []))
      .catch(() => {});
    fetch("/api/public/instagram/followers?limit=200")
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((d) => setFollowers(d.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!data) return;

    function measure() {
      // 1. Twitter / X (Pill + TweetsBox)
      const twitterPill = twitterRef.current;
      const tweetsBox = tweetsBoxRef.current;
      if (twitterPill && tweetsBox) {
        const pillRect = twitterPill.getBoundingClientRect();
        const boxRect = tweetsBox.getBoundingClientRect();
        setConvexLayout({
          pill: { left: pillRect.left, top: pillRect.top, width: pillRect.width, height: pillRect.height },
          tweets: { left: boxRect.left, top: boxRect.top, width: boxRect.width, height: boxRect.height }
        });
      }

      // 2. Instagram (LeftPanel + Instagram Pill)
      const instaPill = instagramRef.current;
      const leftPanel = leftPanelRef.current;
      if (instaPill && leftPanel) {
        const pillRect = instaPill.getBoundingClientRect();
        const panelRect = leftPanel.getBoundingClientRect();
        setInstagramLayout({
          pill: { left: pillRect.left, top: pillRect.top, width: pillRect.width, height: pillRect.height },
          panel: { left: panelRect.left, top: panelRect.top, width: panelRect.width, height: panelRect.height }
        });
      }

      // 3. YouTube (YouTube Pill + TopBox)
      const ytPill = youtubeRef.current;
      const topBox = topBoxRef.current;
      if (ytPill && topBox) {
        const pillRect = ytPill.getBoundingClientRect();
        const boxRect = topBox.getBoundingClientRect();
        setYoutubeLayout({
          pill: { left: pillRect.left, top: pillRect.top, width: pillRect.width, height: pillRect.height },
          box: { left: boxRect.left, top: boxRect.top, width: boxRect.width, height: boxRect.height }
        });
      }
    }

    const t = setTimeout(measure, 150);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, [data, tweets.length, videos.length]);

  return (
    <div className="relative flex min-h-dvh w-full flex-1 flex-col items-center overflow-x-hidden bg-transparent">
      {/* Ambient background aura glow spheres for glassmorphism refraction */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-pink-400/10 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-red-400/8 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-24 left-1/3 h-80 w-80 rounded-full bg-amber-400/8 blur-[100px]" />

      {/* Desktop View (Floating Panels + Center Identity Column) */}
      <div className="hidden xl:flex w-full flex-1 flex-col items-center justify-center gap-4 px-4 py-12">
        {instagramLayout && (
          <ConvexInstagramBackground layout={instagramLayout} isHovered={isInstagramHovered} />
        )}
        {youtubeLayout && (
          <ConvexYoutubeBackground layout={youtubeLayout} isHovered={isYoutubeHovered} />
        )}
        {convexLayout && (
          <ConvexTwitterBackground layout={convexLayout} isHovered={isTwitterHovered} />
        )}
        <div className="flex flex-col gap-4" style={{ zoom: 0.8 }}>
          {data ? (
            <>
              <div
                ref={instagramRef}
                onMouseEnter={() => setIsInstagramHovered(true)}
                onMouseLeave={() => setIsInstagramHovered(false)}
              >
                <Pill platform="instagram" data={data.instagram} transparent={true} />
              </div>
              <div
                ref={youtubeRef}
                onMouseEnter={() => setIsYoutubeHovered(true)}
                onMouseLeave={() => setIsYoutubeHovered(false)}
              >
                <Pill platform="youtube" data={data.youtube} transparent={true} />
              </div>
              <div
                ref={twitterRef}
                onMouseEnter={() => setIsTwitterHovered(true)}
                onMouseLeave={() => setIsTwitterHovered(false)}
              >
                <Pill platform="twitter" data={data.twitter} transparent={true} />
              </div>
            </>
          ) : (
            <>
              <SkeletonPill nameWidth="w-32" />
              <div ref={youtubeRef}>
                <SkeletonPill nameWidth="w-24" />
              </div>
              <div ref={twitterRef}>
                <SkeletonPill nameWidth="w-28" />
              </div>
            </>
          )}
        </div>
        <LeftPanel
          stories={stories}
          posts={posts}
          followers={followers}
          transparent={true}
          onMouseEnter={() => setIsInstagramHovered(true)}
          onMouseLeave={() => setIsInstagramHovered(false)}
          containerRef={leftPanelRef}
        />
        {videos.length > 0 && (
          <TopBox
            youtubeRef={youtubeRef}
            videos={videos}
            transparent={true}
            onMouseEnter={() => setIsYoutubeHovered(true)}
            onMouseLeave={() => setIsYoutubeHovered(false)}
            containerRef={topBoxRef}
          />
        )}
        {tweets.length > 0 && (
          <TweetsBox
            twitter={data.twitter}
            twitterRef={twitterRef}
            onOpenTweet={setOpenTweetId}
            transparent={true}
            onMouseEnter={() => setIsTwitterHovered(true)}
            onMouseLeave={() => setIsTwitterHovered(false)}
            containerRef={tweetsBoxRef}
          />
        )}
      </div>

      {/* Mobile & Tablet Bento Feed View */}
      <div className="flex xl:hidden w-full items-center justify-center">
        <MobileBentoFeed
          data={data}
          stories={stories}
          posts={posts}
          followers={followers}
          onOpenTweet={setOpenTweetId}
        />
      </div>

      {/* Global Interactive Tweet Modal */}
      {openTweetId && <TweetModal id={openTweetId} onClose={() => setOpenTweetId(null)} />}
    </div>
  );
}
