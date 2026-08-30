"use client";

import { useEffect, useState } from "react";

const API = "/api";

export default function Instagram() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${API}/social`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const ig = data?.instagram;
  const username = ig?.username || "menofmatrix.ai";
  const postsCount = ig?.postsCount ?? "—";
  const connected = ig?.connected;

  return (
    <div className="flex w-full flex-1 items-center justify-center bg-transparent px-4">
      <div className="flex items-center gap-2 rounded-full border border-white bg-white px-5 py-3 shadow-[0_12px_32px_rgba(60,50,35,0.08)]">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black p-1.5">
          <img src="/brand/menofmatrix-mark.svg" alt="" className="h-5 w-5 object-contain" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-neutral-900">@{username}</div>
          <div className="text-xs text-neutral-500">
            {connected ? "Connected" : "—"} · {postsCount} posts
          </div>
        </div>
        <a
          href={`https://instagram.com/${username}`}
          target="_blank"
          rel="noreferrer"
          className="ml-3 rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white"
        >
          Follow
        </a>
      </div>
    </div>
  );
}
