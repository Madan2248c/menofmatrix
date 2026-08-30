"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Poppins } from "next/font/google";
import { SiInstagram } from "react-icons/si";
import { HiXMark, HiChevronLeft, HiChevronRight, HiOutlinePlay } from "react-icons/hi2";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600"] });

const BOX_GAP = 24;
const BOX_MARGIN = 24;
const BOX_MIN_WIDTH = 200;

// Same trick as the other floating boxes on this page: only one of the
// dock's two responsive variants is actually rendered (display:none on the
// other), so find whichever one has real height right now.
function getDockRect() {
  const candidates = document.querySelectorAll("footer .fixed");
  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    if (rect.height > 0) return rect;
  }
  return null;
}

function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

// ---------------------------------------------------------------------------
// Top hero: Sleek circular story ring component that triggers story popup modal.
// ---------------------------------------------------------------------------
export function StoryCircle({ stories = [], source, panelRef, onOpenStory }) {
  const [index, setIndex] = useState(0);
  const count = stories.length;

  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 3500);
    return () => clearInterval(t);
  }, [count]);

  const currentStory = stories[index] || stories[0];
  const img = currentStory?.thumbnail_url || currentStory?.media_url;

  return (
    <div
      ref={panelRef}
      className="pointer-events-auto absolute top-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 select-none z-10"
    >
      <button
        type="button"
        onClick={() => onOpenStory && onOpenStory(index)}
        aria-label="View Instagram Stories"
        className="group relative flex h-[72px] w-[72px] items-center justify-center rounded-full p-[3px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-[0_8px_20px_rgba(225,48,108,0.28)] transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none"
      >
        {/* Inner white border */}
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white p-[2px]">
          <div className="relative h-full w-full overflow-hidden rounded-full bg-neutral-100 flex items-center justify-center">
            {img ? (
              <img
                src={img}
                alt="Story preview"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                draggable={false}
              />
            ) : (
              <SiInstagram className="h-7 w-7 text-neutral-400 group-hover:text-rose-500 transition-colors" />
            )}
          </div>
        </div>

        {/* Live or Story Count Badge */}
        {source === "live" ? (
          <span className="absolute -bottom-1 flex items-center gap-1 rounded-full bg-gradient-to-r from-red-600 to-rose-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-md ring-2 ring-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
        ) : count > 0 ? (
          <span className="absolute -bottom-1 rounded-full bg-neutral-900 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-md ring-2 ring-white">
            {count} {count === 1 ? "story" : "stories"}
          </span>
        ) : null}
      </button>

      <span className={`${poppins.className} text-[11px] font-medium tracking-wide text-neutral-600 group-hover:text-neutral-900 transition-colors`}>
        Stories
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Interactive Story Modal popup with progress bars & keyboard navigation.
// ---------------------------------------------------------------------------
export function StoryModal({ stories = [], initialIndex = 0, source, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const count = stories.length;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") setIndex((i) => (i > 0 ? i - 1 : count - 1));
      else if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [count, onClose]);

  useEffect(() => {
    if (count === 0 || isPaused) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(0);
    const duration = 5000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          if (index === count - 1) {
            onClose();
            return 100;
          }
          setIndex((i) => i + 1);
          return 0;
        }
        return p + step;
      });
    }, interval);

    return () => clearInterval(t);
  }, [index, count, isPaused, onClose]);

  if (!mounted || count === 0) return null;
  const story = stories[index];
  const img = story?.media_url || story?.thumbnail_url;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Story Container */}
      <div
        className="relative z-10 flex h-[580px] max-h-[85vh] w-[340px] max-w-[90vw] flex-col overflow-hidden rounded-3xl bg-neutral-950 shadow-[0_24px_60px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
      >
        {/* Top Progress Segment Bars */}
        <div className="absolute top-3 inset-x-3 z-20 flex gap-1.5">
          {stories.map((s, i) => (
            <div key={s.id || i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25 backdrop-blur-sm">
              <div
                className="h-full bg-white transition-all duration-75"
                style={{
                  width: i < index ? "100%" : i === index ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="absolute top-6 inset-x-3.5 z-20 flex items-center justify-between text-white drop-shadow-md">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-[1.5px]">
              <div className="h-full w-full rounded-full bg-white/20 overflow-hidden flex items-center justify-center">
                <SiInstagram className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className={`${poppins.className} text-xs font-semibold`}>Instagram Stories</span>
                {source === "live" && (
                  <span className="flex items-center gap-1 rounded-full bg-red-600 px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider text-white">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-white" />
                    Live
                  </span>
                )}
              </div>
              <span className="text-[10px] text-white/75">{timeAgo(story?.posted_at || story?.timestamp)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close story"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>

        {/* Story Media */}
        <div className="relative h-full w-full bg-neutral-900 flex items-center justify-center">
          {img ? (
            <img
              src={img}
              alt=""
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-500">
              <SiInstagram className="h-12 w-12" />
            </div>
          )}

          {/* Left/Right Tap Target Zones */}
          <div
            className="absolute inset-y-0 left-0 w-1/3 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => Math.max(i - 1, 0));
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-1/3 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (index === count - 1) {
                onClose();
              } else {
                setIndex((i) => i + 1);
              }
            }}
          />
        </div>

        {/* Bottom Permalink / Action Footer */}
        {story?.permalink && (
          <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-center">
            <a
              href={story.permalink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-white/30 transition-colors shadow-lg"
            >
              <SiInstagram className="h-3.5 w-3.5" />
              <span>View on Instagram</span>
            </a>
          </div>
        )}
      </div>

      {/* Side Navigation Arrow Buttons */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i > 0 ? i - 1 : count - 1));
            }}
            aria-label="Previous story"
            className="absolute left-6 top-1/2 -translate-y-1/2 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 backdrop-blur-md transition-colors"
          >
            <HiChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i + 1) % count);
            }}
            aria-label="Next story"
            className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 backdrop-blur-md transition-colors"
          >
            <HiChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
    </div>,
    document.body
  );
}

// Keep StoryDeck export available for backwards compatibility
export function StoryDeck(props) {
  return <StoryCircle {...props} />;
}

// ---------------------------------------------------------------------------
// 2x2 animated posts grid – cycles posts sequentially, flipping one card at a time.
// Centred in the bottom half of the panel with a transparent container and dot indicators.
// ---------------------------------------------------------------------------


function InstagramPostCard({ post, actualIdx, cellIdx, isFlipping, count }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  function handleMouseMove(e) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width - 0.5) * 20; // max 10 deg
    const py = (y / rect.height - 0.5) * -20; // max 10 deg
    setTilt({ x: px, y: py });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  const img = post?.thumbnail_url || post?.media_url;
  const isReel = post?.media_product_type === "REELS";
  const permalink = post?.permalink || "https://instagram.com/menofmatrix.ai";

  return (
    <a
      href={permalink}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open Instagram post ${actualIdx + 1}`}
      className="group relative h-[74px] w-[74px] focus:outline-none"
      style={{ perspective: "600px" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cardRef}
        className="relative h-full w-full overflow-hidden rounded-2xl bg-white/90 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.08)] ring-1 ring-black/5 transition-transform duration-300 ease-out"
        style={{
          transform: isFlipping
            ? "rotateY(90deg)"
            : `scale(${tilt.x !== 0 || tilt.y !== 0 ? 1.02 : 1}) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
        }}
      >
        {img ? (
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
            <SiInstagram className="h-6 w-6" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <div className="absolute -inset-[100%] bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.35)_50%,transparent_75%)] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out pointer-events-none" />
        {isReel && (
          <span className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-xs shadow-xs">
            <HiOutlinePlay className="h-2.5 w-2.5" />
          </span>
        )}
      </div>
    </a>
  );
}

export function MiniPostsGrid({ posts = [], gridRef }) {
  const count = posts?.length || 0;
  const [cellPostIndices, setCellPostIndices] = useState([0, 1, 2, 3]);
  const [flippingCell, setFlippingCell] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [latestFlippedIndex, setLatestFlippedIndex] = useState(0);

  const nextPostIndexRef = useRef(4);
  const nextCellToFlipRef = useRef(0);

  useEffect(() => {
    if (count <= 4 || isPaused) return;

    const interval = setInterval(() => {
      const cellIdx = nextCellToFlipRef.current;
      const nextPostIdx = nextPostIndexRef.current;

      setFlippingCell(cellIdx);
      setLatestFlippedIndex(nextPostIdx);

      setTimeout(() => {
        setCellPostIndices((prev) => {
          const nextIndices = [...prev];
          nextIndices[cellIdx] = nextPostIdx;
          return nextIndices;
        });
        nextPostIndexRef.current = (nextPostIdx + 1) % count;
      }, 300);

      setTimeout(() => {
        setFlippingCell(null);
        nextCellToFlipRef.current = (cellIdx + 1) % 4;
      }, 600);

    }, 3000);

    return () => clearInterval(interval);
  }, [count, isPaused]);

  if (count === 0) {
    return (
      <div
        ref={gridRef}
        className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <div className="grid grid-cols-2 gap-2 p-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[74px] w-[74px] rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/5 flex items-center justify-center text-neutral-300">
              <SiInstagram className="h-6 w-6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visibleIndices = new Set(cellPostIndices.map((idx) => idx % count));

  return (
    <div
      ref={gridRef}
      className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
    >
      <div
        className="pointer-events-auto flex flex-col items-center gap-2"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="grid grid-cols-2 gap-2 p-2 bg-transparent">
          {cellPostIndices.map((postIdx, cellIdx) => {
            const actualIdx = postIdx % count;
            return (
              <InstagramPostCard
                key={cellIdx}
                post={posts[actualIdx]}
                actualIdx={actualIdx}
                cellIdx={cellIdx}
                isFlipping={flippingCell === cellIdx}
                count={count}
              />
            );
          })}
        </div>

        {/* Dots under the grid */}
        {count > 4 && (
          <div className="flex items-center gap-1.5 bg-white/65 backdrop-blur-md py-1 px-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-black/5">
            {Array.from({ length: Math.min(count, 8) }).map((_, i) => {
              const isVisible = visibleIndices.has(i);
              const isLatestFlipped = latestFlippedIndex % count === i;

              return (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    isLatestFlipped
                      ? "h-1.5 w-3.5 bg-rose-500"
                      : isVisible
                      ? "h-1.5 w-1.5 bg-neutral-700"
                      : "h-1.5 w-1.5 bg-neutral-300"
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}





// ---------------------------------------------------------------------------
// Background: follower avatars, floating free, colliding softly, draggable,
// and steering clear of whatever obstacle rects (story deck / post grids)
// are passed in.
// ---------------------------------------------------------------------------
// Fixed number of avatar slots on screen at once — kept modest regardless of
// how many followers exist so the box never gets crowded or the icons tiny.
// Which follower fills each slot rotates on a timer instead (see
// ROTATE_INTERVAL_MS below), so a large follower list still gets fully
// cycled through over time.
const SLOT_COUNT = 36;
const ROTATE_INTERVAL_MS = 5000;
const FADE_MS = 800; // one-way fade duration — swap is fade-out then fade-in

// A single avatar image that crossfades (fade out, swap src, fade in)
// whenever its `url` prop changes, instead of the image snapping instantly.
function FadeAvatar({ url }) {
  const [displayUrl, setDisplayUrl] = useState(url);
  const [pendingUrl, setPendingUrl] = useState(null);
  const [visible, setVisible] = useState(true);

  // Adjusting state in response to a prop change during render (React's
  // documented pattern for this) rather than in an effect — starting the
  // fade-out here means it takes effect on this very render, no wasted frame.
  if (url !== displayUrl && url !== pendingUrl) {
    setPendingUrl(url);
    setVisible(false);
  }

  useEffect(() => {
    if (pendingUrl == null) return;
    const t = setTimeout(() => {
      setDisplayUrl(pendingUrl);
      setPendingUrl(null);
      requestAnimationFrame(() => setVisible(true));
    }, FADE_MS);
    return () => clearTimeout(t);
  }, [pendingUrl]);

  if (!displayUrl) return null;
  return (
    <img
      src={displayUrl}
      alt=""
      draggable={false}
      className="h-full w-full object-cover transition-opacity ease-in-out"
      style={{ opacity: visible ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}
    />
  );
}

function FollowerBubbles({ followers, containerRef, obstacleRefs, box }) {
  // Structural properties of each on-screen slot (radius) — stable for the
  // component's lifetime so the physics sim never has to reseed positions.
  const slotCount = Math.min(SLOT_COUNT, followers.length);
  const slots = useMemo(
    () => Array.from({ length: slotCount }, (_, i) => ({ r: 12 + ((i * 37) % 9) })),
    [slotCount]
  );

  // Which follower currently fills each slot — this is what rotates every
  // few seconds, independent of the slots' physical positions.
  const [slotContent, setSlotContent] = useState([]);
  const orderRef = useRef([]); // shuffled queue of followers still to show
  const cursorRef = useRef(0);

  useEffect(() => {
    if (slotCount === 0) return;
    orderRef.current = [...followers].sort(() => Math.random() - 0.5);
    cursorRef.current = 0;

    function pullBatch() {
      const order = orderRef.current;
      const batch = Array.from({ length: slotCount }, (_, k) => {
        const f = order[(cursorRef.current + k) % order.length];
        return { url: f.profile_pic_url, username: f.username, fullName: f.full_name };
      });
      cursorRef.current = (cursorRef.current + slotCount) % order.length;
      setSlotContent(batch);
    }

    pullBatch();
    const t = setInterval(pullBatch, ROTATE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [followers, slotCount]);

  const elsRef = useRef([]);
  const physicsRef = useRef([]); // { x, y, vx, vy, r }
  const obstaclesRef = useRef([]);
  const draggingRef = useRef(null);
  const [initialized, setInitialized] = useState(false);

  // (Re)seed physics state and measure obstacles whenever the slot count or
  // box size changes — NOT on every content rotation, so bubbles keep
  // drifting smoothly while just swapping which avatar/name they show.
  useEffect(() => {
    if (!box || slots.length === 0) return;

    function measureObstacles() {
      const cRect = containerRef.current?.getBoundingClientRect();
      if (!cRect) return [];
      return obstacleRefs
        .map((ref) => {
          const el = ref.current;
          if (!el) return null;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return null;
          // Generous obstacle padding to completely clear fanned cards, rotations, and shadows
          const padLeft = 18;
          const padRight = 36;
          const padTop = 24;
          const padBottom = 24;
          return {
            x: r.left - cRect.left - padLeft,
            y: r.top - cRect.top - padTop,
            w: r.width + padLeft + padRight,
            h: r.height + padTop + padBottom,
          };
        })
        .filter(Boolean);
    }

    function overlapsObstacle(x, y, r, obstacles) {
      return obstacles.some((o) => {
        return x + r > o.x - 6 && x - r < o.x + o.w + 6 && y + r > o.y - 6 && y - r < o.y + o.h + 6;
      });
    }

    const raf = requestAnimationFrame(() => {
      const obstacles = measureObstacles();
      obstaclesRef.current = obstacles;

      const BUBBLE_INSET = 24;
      physicsRef.current = slots.map((b) => {
        let x, y, tries = 0;
        do {
          x = BUBBLE_INSET + b.r + Math.random() * Math.max(10, box.width - BUBBLE_INSET * 2 - b.r * 2);
          y = BUBBLE_INSET + b.r + Math.random() * Math.max(10, box.height - BUBBLE_INSET * 2 - b.r * 2);
          tries++;
        } while (overlapsObstacle(x, y, b.r, obstacles) && tries < 100);
        const angle = Math.random() * Math.PI * 2;
        const speed = 6 + Math.random() * 10;
        return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: b.r };
      });
      setInitialized(true);
    });

    function onResize() {
      obstaclesRef.current = measureObstacles();
    }
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, box?.width, box?.height]);

  // Main simulation loop — mutates DOM transforms directly, no React state
  // per frame.
  useEffect(() => {
    if (!initialized || !box) return;
    let raf;
    let last = performance.now();
    let frame = 0;

    function step(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      frame++;

      // Re-measure dynamic obstacles every 30 frames to stay perfectly synced with loaded card content
      if (frame % 30 === 0) {
        const cRect = containerRef.current?.getBoundingClientRect();
        if (cRect) {
          obstaclesRef.current = obstacleRefs
            .map((ref) => {
              const el = ref.current;
              if (!el) return null;
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.height === 0) return null;
              return {
                x: r.left - cRect.left - 18,
                y: r.top - cRect.top - 24,
                w: r.width + 54,
                h: r.height + 48,
              };
            })
            .filter(Boolean);
        }
      }

      const bubbles = physicsRef.current;
      const obstacles = obstaclesRef.current;
      const dragging = draggingRef.current;

      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        if (dragging === i) continue; // position driven by pointer instead

        // Gentle ambient drift.
        b.vx += (Math.random() - 0.5) * 4 * dt;
        b.vy += (Math.random() - 0.5) * 4 * dt;
        const speed = Math.hypot(b.vx, b.vy);
        const maxSpeed = 14;
        if (speed > maxSpeed) {
          b.vx = (b.vx / speed) * maxSpeed;
          b.vy = (b.vy / speed) * maxSpeed;
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Wall bounds — 24px inset from outer container edges so bubbles never touch borders
        const WALL = 24;
        if (b.x - b.r < WALL) { b.x = WALL + b.r; b.vx = Math.abs(b.vx); }
        if (b.x + b.r > box.width - WALL) { b.x = box.width - WALL - b.r; b.vx = -Math.abs(b.vx); }
        if (b.y - b.r < WALL) { b.y = WALL + b.r; b.vy = Math.abs(b.vy); }
        if (b.y + b.r > box.height - WALL) { b.y = box.height - WALL - b.r; b.vy = -Math.abs(b.vy); }

        // Hard obstacle avoidance — strictly push bubbles outside card boundaries
        for (const o of obstacles) {
          const overlapX = (b.x + b.r > o.x) && (b.x - b.r < o.x + o.w);
          const overlapY = (b.y + b.r > o.y) && (b.y - b.r < o.y + o.h);

          if (overlapX && overlapY) {
            const penLeft = (b.x + b.r) - o.x;
            const penRight = (o.x + o.w) - (b.x - b.r);
            const penTop = (b.y + b.r) - o.y;
            const penBottom = (o.y + o.h) - (b.y - b.r);

            const roomLeft = o.x > b.r * 2.2;
            const roomRight = (box.width - (o.x + o.w)) > b.r * 2.2;
            const roomTop = o.y > b.r * 2.2;
            const roomBottom = (box.height - (o.y + o.h)) > b.r * 2.2;

            let minPen = Infinity;
            let dir = "bottom";

            if (roomBottom && penBottom < minPen) { minPen = penBottom; dir = "bottom"; }
            if (roomTop && penTop < minPen) { minPen = penTop; dir = "top"; }
            if (roomLeft && penLeft < minPen) { minPen = penLeft; dir = "left"; }
            if (roomRight && penRight < minPen) { minPen = penRight; dir = "right"; }

            if (dir === "left") {
              b.x = o.x - b.r;
              b.vx = -Math.abs(b.vx) - 10;
            } else if (dir === "right") {
              b.x = o.x + o.w + b.r;
              b.vx = Math.abs(b.vx) + 10;
            } else if (dir === "top") {
              b.y = o.y - b.r;
              b.vy = -Math.abs(b.vy) - 10;
            } else {
              b.y = o.y + o.h + b.r;
              b.vy = Math.abs(b.vy) + 10;
            }
          }
        }
      }

      // Pairwise collision — bubbles push each other apart, never overlap.
      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
          const a = bubbles[i];
          const b = bubbles[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const minDist = a.r + b.r + 3;
          if (dist < minDist) {
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;
            const aFixed = draggingRef.current === i;
            const bFixed = draggingRef.current === j;
            if (!aFixed) { a.x -= nx * overlap; a.y -= ny * overlap; }
            if (!bFixed) { b.x += nx * overlap; b.y += ny * overlap; }
          }
        }
      }

      for (let i = 0; i < bubbles.length; i++) {
        const el = elsRef.current[i];
        if (!el) continue;
        const b = bubbles[i];
        el.style.transform = `translate3d(${b.x - b.r}px, ${b.y - b.r}px, 0)`;
      }

      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [initialized, box]);

  function handlePointerDown(e, i) {
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = i;
  }
  function handlePointerMove(e, i) {
    if (draggingRef.current !== i) return;
    const cRect = containerRef.current?.getBoundingClientRect();
    if (!cRect) return;
    const b = physicsRef.current[i];
    let targetX = Math.min(Math.max(e.clientX - cRect.left, b.r), box.width - b.r);
    let targetY = Math.min(Math.max(e.clientY - cRect.top, b.r), box.height - b.r);
    for (const o of obstaclesRef.current) {
      const cx = Math.max(o.x, Math.min(targetX, o.x + o.w));
      const cy = Math.max(o.y, Math.min(targetY, o.y + o.h));
      const dx = targetX - cx;
      const dy = targetY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < b.r && dist > 0) {
        targetX = cx + (dx / dist) * b.r;
        targetY = cy + (dy / dist) * b.r;
      }
    }
    b.x = targetX;
    b.y = targetY;
    b.vx = 0;
    b.vy = 0;
  }
  function handlePointerUp() {
    draggingRef.current = null;
  }

  // The whole bubbles layer normally paints BEHIND the story deck and post
  // grids (it's the first child in LeftPanel). A bubble's own z-index can
  // only reorder it among its *own* siblings inside this layer, so it can
  // never rise above those other layers on its own — the layer itself has
  // to be lifted while something inside it is hovered.
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltip, setTooltip] = useState(null); // { x, y, username, fullName }

  if (slots.length === 0) return null;

  return (
    <>
      <div className={`absolute inset-0 overflow-visible ${hoveredIndex !== null ? "z-40" : "z-0"}`}>
        {slots.map((s, i) => {
          const content = slotContent[i] || {};
          return (
            <div
              key={`slot-${i}`}
              ref={(el) => (elsRef.current[i] = el)}
              onPointerDown={(e) => handlePointerDown(e, i)}
              onPointerMove={(e) => {
                handlePointerMove(e, i);
                if (draggingRef.current === i || hoveredIndex === i) {
                  setTooltip((t) =>
                    t ? { ...t, x: e.clientX, y: e.clientY } : t
                  );
                }
              }}
              onPointerUp={handlePointerUp}
              onPointerEnter={(e) => {
                setHoveredIndex(i);
                const c = slotContent[i] || {};
                if (c.username || c.fullName) {
                  setTooltip({ x: e.clientX, y: e.clientY, username: c.username, fullName: c.fullName });
                }
              }}
              onPointerLeave={() => {
                setHoveredIndex((h) => (h === i ? null : h));
                setTooltip(null);
              }}
              className="group absolute left-0 top-0 cursor-grab will-change-transform hover:z-30 active:z-30 active:cursor-grabbing"
              style={{ width: s.r * 2, height: s.r * 2, touchAction: "none" }}
            >
              <div className="h-full w-full overflow-hidden rounded-full bg-neutral-200 shadow-sm ring-1 ring-black/5">
                <FadeAvatar url={content.url} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Portal tooltip — rendered directly into <body> so it escapes all stacking contexts */}
      {tooltip && typeof window !== "undefined" && createPortal(
        <div
          className="pointer-events-none fixed z-[200] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-neutral-900/95 px-2.5 py-1.5 text-center shadow-xl ring-1 ring-white/10 backdrop-blur-sm"
          style={{ left: tooltip.x, top: tooltip.y - 10 }}
        >
          {tooltip.fullName && (
            <div className={`${poppins.className} text-[10px] font-semibold leading-tight text-white`}>
              {tooltip.fullName}
            </div>
          )}
          {tooltip.username && (
            <div className="text-[9px] leading-tight text-neutral-400">@{tooltip.username}</div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Top-level panel: measures the box against the floating dock (same layout
// contract as TweetsBox/TopBox on the right), fetches its own data, and
// composes the three layers.
// ---------------------------------------------------------------------------
export default function LeftPanel({
  stories: propStories,
  posts: propPosts,
  followers: propFollowers,
  isLoading: propIsLoading,
  transparent = false,
  onMouseEnter,
  onMouseLeave,
  containerRef,
} = {}) {
  const [box, setBox] = useState(null); // null = not measured; { left, top, width, height } | false
  const [internalStories, setInternalStories] = useState({ data: [], source: "cache" });
  const [internalPosts, setInternalPosts] = useState([]);
  const [internalFollowers, setInternalFollowers] = useState([]);

  const stories = propStories || internalStories;
  const posts = propPosts || internalPosts;
  const followers = propFollowers || internalFollowers;

  const localRef = useRef(null);
  const resolvedRef = containerRef || localRef;
  const storyRef = useRef(null);
  const bottomGridRef = useRef(null);

  useEffect(() => {
    function measure() {
      const dockRect = getDockRect();
      if (!dockRect) return;
      const right = dockRect.left - BOX_GAP;
      const left = BOX_MARGIN;
      const width = Math.max(120, right - left);
      const top = BOX_MARGIN;
      const height = Math.max(dockRect.bottom - top, 0);
      setBox({ left, top, width, height });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!propStories) {
      fetch("/api/stories?limit=8")
        .then((r) => r.ok ? r.json() : Promise.reject(r))
        .then((d) => setInternalStories({ data: d.data || [], source: d.source }))
        .catch(() => {});
    }
    if (!propPosts) {
      fetch("/api/posts?limit=8")
        .then((r) => r.ok ? r.json() : Promise.reject(r))
        .then((d) => setInternalPosts(d.data || []))
        .catch(() => {});
    }
    if (!propFollowers) {
      fetch("/api/public/instagram/followers?limit=200")
        .then((r) => r.ok ? r.json() : Promise.reject(r))
        .then((d) => setInternalFollowers(d.data || []))
        .catch(() => {});
    }
  }, [propStories, propPosts, propFollowers]);

  const [activeStoryIndex, setActiveStoryIndex] = useState(null);

  if (!box) return null;

  const isLoading = propIsLoading !== undefined ? propIsLoading : (stories.data.length === 0 && posts.length === 0);

  if (isLoading) {
    return (
      <div
        ref={resolvedRef}
        className={
          transparent
            ? `${poppins.className} fixed overflow-hidden transition-all duration-300 bg-transparent border-none shadow-none backdrop-blur-none`
            : `${poppins.className} fixed overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-[0_16px_40px_rgba(60,50,35,0.08),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-xl transition-all duration-300`
        }
        style={{
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
        }}
      >
        {!transparent && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
        )}
        {/* Shimmering Story Circle Skeleton at top-5 */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full p-[3px] bg-gradient-to-tr from-neutral-200 to-neutral-300 animate-pulse">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white p-[2px]">
              <div className="h-full w-full rounded-full bg-neutral-200" />
            </div>
          </div>
          <div className="h-2.5 w-12 rounded-full bg-neutral-200 animate-pulse" />
        </div>

        {/* Ambient Floating Follower Bubbles Skeleton */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute left-[12%] top-[20%] h-8 w-8 rounded-full bg-neutral-200/50 animate-pulse" />
          <div className="absolute left-[78%] top-[22%] h-10 w-10 rounded-full bg-neutral-200/40 animate-pulse" />
          <div className="absolute left-[82%] top-[45%] h-7 w-7 rounded-full bg-neutral-200/50 animate-pulse" />
          <div className="absolute left-[10%] top-[42%] h-11 w-11 rounded-full bg-neutral-200/40 animate-pulse" />
          <div className="absolute left-[45%] top-[48%] h-9 w-9 rounded-full bg-neutral-200/50 animate-pulse" />
          <div className="absolute left-[20%] top-[60%] h-8 w-8 rounded-full bg-neutral-200/40 animate-pulse" />
          <div className="absolute left-[74%] top-[62%] h-10 w-10 rounded-full bg-neutral-200/50 animate-pulse" />
        </div>

        {/* 2x2 Posts Grid Skeleton at bottom-5 */}
        <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="grid grid-cols-2 gap-2 p-1 bg-transparent">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[74px] w-[74px] rounded-2xl bg-neutral-200/60 shadow-sm animate-pulse" />
            ))}
          </div>
          <div className="flex items-center gap-1.5 bg-white/65 backdrop-blur-md py-1 px-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.04)] ring-1 ring-black/5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-1.5 w-1.5 rounded-full bg-neutral-300 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={resolvedRef}
        className={
          transparent
            ? `${poppins.className} fixed transition-all duration-300 bg-transparent border-none shadow-none backdrop-blur-none`
            : `${poppins.className} fixed transition-all duration-300`
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
        {/* Visual card background — separate from layout container so hover animations never get clipped */}
        {!transparent && (
          <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/80 bg-white/90 shadow-[0_16px_40px_rgba(60,50,35,0.08),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-xl" />
        )}
        {!transparent && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] rounded-t-3xl bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
        )}
        <FollowerBubbles
          followers={followers}
          containerRef={resolvedRef}
          obstacleRefs={[storyRef, bottomGridRef]}
          box={box}
        />
        <StoryCircle
          stories={stories.data}
          source={stories.source}
          panelRef={storyRef}
          onOpenStory={(idx) => setActiveStoryIndex(idx)}
        />
        <MiniPostsGrid
          posts={posts}
          gridRef={bottomGridRef}
          onOpenPost={(idx) => {
            const post = posts[idx];
            if (post?.permalink) {
              window.open(post.permalink, "_blank", "noopener,noreferrer");
            }
          }}
        />
      </div>

      {activeStoryIndex !== null && (
        <StoryModal
          stories={stories.data}
          initialIndex={activeStoryIndex}
          source={stories.source}
          onClose={() => setActiveStoryIndex(null)}
        />
      )}
    </>
  );
}
