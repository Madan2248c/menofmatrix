"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { IconExternalLink } from "@tabler/icons-react";
import { BentoGrid, BentoGridItem } from "../ui/bento-grid";

type FeedItem = {
  id: string | number;
  title: string;
  description?: string;
  source?: string;
  url?: string;
  image?: string;
  publishedAt?: string;
};

type Size = "small" | "wide" | "tall" | "large";

// The size multiset the grid always uses: one hero, one wide, one tall, the
// rest uniform. Spans sum to 12 on the 3×4 grid — large(4) + wide(2) + tall(2)
// + 4×small(4) = 12 — so any *permutation* of it fits without overflow.
const SHAPES: Size[] = ["large", "wide", "tall", "small", "small", "small", "small"];
const MAX_CARDS = SHAPES.length;
const RESHUFFLE_MS = 4500;

// A permutation of the size multiset for `count` items (Fisher–Yates).
function shuffledSizes(count: number): Size[] {
  const sizes = SHAPES.slice(0, count);
  for (let i = sizes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sizes[i], sizes[j]] = [sizes[j], sizes[i]];
  }
  return sizes;
}

const spanClass = (size: Size) =>
  size === "large" ? "md:col-span-2 md:row-span-2"
  : size === "wide" ? "md:col-span-2 md:row-span-1"
  : size === "tall" ? "md:col-span-1 md:row-span-2"
  : "md:col-span-1 md:row-span-1";

function Header({ item }: { item: FeedItem }) {
  return item.image ? (
    <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover" />
  ) : (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-700 to-neutral-300">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:12px_12px]" />
      <span className="absolute bottom-2 left-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/75">{item.source || "Men of Matrix"}</span>
    </div>
  );
}

export function BentoGridDemo() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [layout, setLayout] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Pause the ambient reshuffle while the pointer is over the grid, so a tile
  // never moves out from under the reader as they're about to click.
  const paused = useRef(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/feed?limit=12", { cache: "no-store" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "Feed unavailable");
        const news = (json.news || []).map((item: any) => ({ id: `news-${item.id}`, title: item.title, description: item.summary, source: item.source, url: item.link, image: item.image_url, publishedAt: item.published_at }));
        const blogs = (json.blogs || []).map((item: any) => ({ id: `blog-${item.id || item.slug}`, title: item.title, description: item.excerpt || item.summary, source: "Men of Matrix", url: item.url || (item.slug ? `/blogs/${item.slug}` : undefined), image: item.cover_image || item.image_url, publishedAt: item.published_at }));
        const merged = [...blogs, ...news].slice(0, MAX_CARDS);
        if (alive) {
          setItems(merged);
          // First paint is intentional: freshest story as the hero. It comes
          // alive from there.
          setLayout(SHAPES.slice(0, merged.length));
        }
      })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  // Ambient reshuffle: tiles glide to new sizes/positions on a gentle timer
  // (BentoGridItem carries `layout` + a spring, so the motion is smooth).
  // Off for reduced-motion users; needs enough tiles to be worth animating.
  useEffect(() => {
    if (items.length < 3) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (!paused.current) setLayout(shuffledSizes(items.length));
    }, RESHUFFLE_MS);
    return () => window.clearInterval(id);
  }, [items.length]);

  const cards = useMemo(
    () => items.map((item, index) => ({ ...item, size: layout[index] || SHAPES[index] || "small" })),
    [items, layout]
  );

  const open = (item: FeedItem) => {
    if (!item.url) return;
    if (item.url.startsWith("/")) window.location.assign(item.url);
    else window.open(item.url, "_blank", "noopener,noreferrer");
  };

  if (loading) return <div className="h-full min-h-[60vh] w-full animate-pulse rounded-2xl bg-neutral-100" />;
  if (!items.length) return (
    <div className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white px-8 text-center">
      <p className="text-sm font-semibold text-neutral-900">The feed is ready for its first story</p>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-neutral-500">Publish a news item from Admin, or run the news importer. Nothing fabricated will be shown here.</p>
      {error && <p className="mt-3 text-[10px] text-red-500">{error}</p>}
    </div>
  );

  return (
    <div
      className="h-auto w-full lg:h-full"
      onPointerEnter={() => { paused.current = true; }}
      onPointerLeave={() => { paused.current = false; }}
    >
      <BentoGrid className="h-full w-full max-w-none rounded-2xl bg-white/20 p-2">
        {cards.map((item) => (
          <BentoGridItem
            key={item.id}
            title={item.title}
            description={item.description || "Open the source for the full story."}
            header={<Header item={item} />}
            icon={<IconExternalLink className="h-4 w-4 text-neutral-500" />}
            meta={item.source}
            expanded={item.size === "large"}
            onClick={() => open(item)}
            className={spanClass(item.size)}
          />
        ))}
      </BentoGrid>
    </div>
  );
}
