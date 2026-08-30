"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch, clearToken, getToken } from "@/lib/auth";

function Row({ label, connected, detail, onConnect }) {
  return (
    <div className="flex w-96 items-center justify-between gap-3 rounded-full border border-white bg-white px-5 py-3 shadow-[0_12px_32px_rgba(60,50,35,0.08)]">
      <div className="min-w-0 leading-tight">
        <div className="text-sm font-semibold text-neutral-900">{label}</div>
        <div className="truncate text-xs text-neutral-500">{connected ? detail : "Not connected"}</div>
      </div>
      {!connected && (
        <button
          onClick={onConnect}
          className="shrink-0 rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white"
        >
          Connect
        </button>
      )}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [social, setSocial] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    
    // Fetch social data and mark ready
    fetch("/api/social")
      .then((r) => r.json())
      .then((data) => {
        setSocial(data);
        setReady(true);
      })
      .catch(() => {
        setReady(true);
      });
  }, [router]);

  const connectInstagram = async () => {
    const r = await fetch("/api/auth/instagram/url");
    const j = await r.json();
    if (j.url) window.location.href = j.url;
    else setError(j.error || "Not configured");
  };

  const connectYoutube = async () => {
    const r = await authFetch("/api/youtube/auth/url");
    if (r.status === 401) {
      clearToken();
      router.replace("/login");
      return;
    }
    const j = await r.json();
    if (j.url) window.location.href = j.url;
    else setError(j.error || "Not configured");
  };

  const logout = () => {
    clearToken();
    router.replace("/login");
  };

  if (!ready) return null;

  return (
    <div className="flex w-full flex-1 flex-col items-center justify-center gap-4 px-4 py-12">
      <h1 className="mb-2 text-lg font-semibold text-neutral-900">Connected accounts</h1>
      {error && <div className="text-xs text-red-500">{error}</div>}
      <Row
        label="Instagram"
        connected={!!social?.instagram?.connected}
        detail={`Connected · ${social?.instagram?.followersCount ?? "—"} followers`}
        onConnect={connectInstagram}
      />
      <Row
        label="YouTube"
        connected={!!social?.youtube?.connected}
        detail={`Connected · ${social?.youtube?.followersCount ?? "—"} subscribers`}
        onConnect={connectYoutube}
      />
      <div className="w-96 text-center text-xs text-neutral-400">
        Twitter needs no connection — it&apos;s read live from the public profile page.
      </div>
      <button onClick={logout} className="mt-4 text-xs text-neutral-400 underline">
        Log out
      </button>
    </div>
  );
}
