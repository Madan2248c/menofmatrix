"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const ORIGIN = "https://menofmatrix.vercel.app";
const EXTENSION_DETECT_TIMEOUT = 1300;

function ago(at) {
  const s = Math.round((Date.now() - at) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
function resetLabel(iso) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return "now";
  const h = Math.round(ms / 3.6e6);
  if (h < 1) return `in ${Math.max(1, Math.round(ms / 6e4))}m`;
  if (h < 48) return `in ${h}h`;
  return `in ${Math.round(h / 24)}d`;
}
function levelFor(pct) {
  return pct >= 90 ? "high" : pct >= 70 ? "mid" : "low";
}

function Meter({ entry }) {
  if (!entry) return null;
  const usage = entry.usage;
  const stamp = ago(entry.at);
  const meters = [
    ...(usage.spend ? [{ kind: "spend", spend: usage.spend }] : []),
    ...(usage.windows || []).map((w) => ({ kind: "window", window: w })),
  ];
  if (!meters.length) return <p className="text-xs text-neutral-500 text-center">No usage reported.</p>;
  return (
    <div className="flex flex-col gap-3">
      {meters.map((m, i) => {
        if (m.kind === "spend") {
          const s = m.spend;
          const pct = s.limit > 0 ? Math.min(100, Math.max(0, Math.round((s.used / s.limit) * 100))) : 0;
          const money = (v) =>
            new Intl.NumberFormat(undefined, {
              style: "currency",
              currency: s.currency,
              maximumFractionDigits: v % 1 ? 2 : 0,
            }).format(v);
          const reset = s.resetsAt ? resetLabel(s.resetsAt) : null;
          return (
            <div key="spend" className="flex flex-col gap-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-[18px] font-bold tracking-tight">
                  {money(s.used >= 100 ? Math.floor(s.used) : s.used)}
                  <span className="text-[11px] font-semibold text-neutral-500 ml-1">/ {money(s.limit)}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    levelFor(pct) === "high" ? "bg-red-500" : levelFor(pct) === "mid" ? "bg-amber-500" : "bg-emerald-600"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-neutral-500">
                <span>
                  {pct}% used{reset ? ` · Resets ${reset}` : ""}
                </span>
                <span>{stamp}</span>
              </div>
              {i < meters.length - 1 && <div className="h-px bg-neutral-100 mt-1" />}
            </div>
          );
        }
        const w = m.window;
        const pct = Math.min(100, Math.max(0, Math.round(w.percent)));
        const reset = w.resetsAt ? resetLabel(w.resetsAt) : null;
        return (
          <div key={w.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-[18px] font-bold tracking-tight">
                {pct}
                <span className="text-[11px] font-semibold text-neutral-500 ml-0.5">%</span>
              </span>
              <span className="text-xs text-neutral-500">{w.label}</span>
            </div>
            <div className="h-1.5 rounded-full bg-neutral-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  levelFor(pct) === "high" ? "bg-red-500" : levelFor(pct) === "mid" ? "bg-amber-500" : "bg-emerald-600"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>{reset ? `Resets ${reset}` : w.label}</span>
              <span>{stamp}</span>
            </div>
            {i < meters.length - 1 && <div className="h-px bg-neutral-100 mt-1" />}
          </div>
        );
      })}
    </div>
  );
}

export default function LlmUsageWidget() {
  const { data: session, status: sessionStatus } = useSession();
  const [data, setData] = useState(null); // { 'usageCache:claude': {at, usage}, ... }
  const [hasExtension, setHasExtension] = useState(null); // null=checking, true/false
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");

  const requestData = useCallback(() => {
    window.postMessage({ type: "GET_LLM_USAGE" }, "*");
  }, []);

  const refresh = useCallback((provider) => {
    setBusy(true);
    setError(null);
    window.postMessage({ type: "REFRESH_LLM_USAGE", provider }, "*");
    // fallback timeout if extension not responding
    setTimeout(() => setBusy(false), 8000);
  }, []);

  useEffect(() => {
    // restore sync preference
    try {
      setSyncEnabled(localStorage.getItem("llmSyncEnabled") === "1");
    } catch {}

    const onMessage = (e) => {
      if (e.data?.type === "LLM_USAGE" && e.data.ok) {
        setHasExtension(true);
        setData(e.data.data);
        setBusy(false);
        setError(null);
      }
      if (e.data?.type === "LLM_USAGE_PUSH" && e.data.data) {
        setData(e.data.data);
      }
      if (e.data?.type === "LLM_USAGE_REFRESHED") {
        setBusy(false);
        if (!e.data.ok) setError("Refresh failed");
      }
    };
    window.addEventListener("message", onMessage);
    requestData();
    const t = setTimeout(() => {
      setHasExtension((prev) => (prev === null ? false : prev));
    }, EXTENSION_DETECT_TIMEOUT);
    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(t);
    };
  }, [requestData]);

  // auto-sync to DB when data arrives and syncEnabled
  useEffect(() => {
    if (!syncEnabled || !data) return;
    if (sessionStatus === "loading") return;
    if (!session?.user) {
      setSyncStatus("Sign in with Google to sync");
      return;
    }
    const payloads = [];
    for (const id of ["claude", "chatgpt"]) {
      const entry = data[`usageCache:${id}`];
      if (entry?.usage) payloads.push({ provider: id, at: entry.at, usage: entry.usage });
    }
    if (!payloads.length) return;
    let deviceId = null;
    try {
      deviceId = localStorage.getItem("mom_device_id");
      if (!deviceId) {
        deviceId = (crypto.randomUUID && crypto.randomUUID()) || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem("mom_device_id", deviceId);
      }
    } catch {}
    // use Google session email as identity; device as fallback for legacy
    const userEmail = session?.user?.email || session?.email || null;
    setSyncStatus("Syncing…");
    fetch("/api/usage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(deviceId ? { "x-device-id": deviceId } : {}),
        ...(userEmail ? { "x-user-email": userEmail } : {}),
      },
      body: JSON.stringify({ snapshots: payloads, deviceId, userEmail }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then(() => setSyncStatus("Synced ✓"))
      .catch(() => setSyncStatus("Sync failed"))
      .finally(() => setTimeout(() => setSyncStatus(""), 3000));
  }, [data, syncEnabled, session, sessionStatus]);

  const toggleSync = (v) => {
    setSyncEnabled(v);
    try {
      localStorage.setItem("llmSyncEnabled", v ? "1" : "0");
    } catch {}
  };

  return (
    <div className="w-full max-w-[360px] rounded-2xl border border-neutral-200 bg-white/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Coding Agents Limits</h3>
          <p className="text-[11px] text-neutral-500">Claude & ChatGPT — local only</p>
        </div>
        <button
          onClick={() => refresh()}
          disabled={busy || hasExtension === false}
          className="text-xs font-medium px-3 py-1.5 rounded-full border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 disabled:opacity-50"
        >
          {busy ? "…" : "Refresh"}
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {hasExtension === null && <p className="text-xs text-neutral-500 text-center py-4">Checking for extension…</p>}

        {hasExtension === false && (
          <div className="relative overflow-hidden rounded-xl border border-neutral-100">
            {/* blurred preview */}
            <div className="blur-[6px] opacity-60 pointer-events-none select-none p-3 flex flex-col gap-4 bg-neutral-50/60">
              <div className="rounded-xl border border-neutral-100 bg-white p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-md bg-[#d97757]" />
                  <span className="text-xs font-semibold">Claude</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[18px] font-bold">42%</span>
                  <span className="text-xs text-neutral-500">Weekly</span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-200 mt-1">
                  <div className="h-full rounded-full bg-emerald-600" style={{ width: "42%" }} />
                </div>
                <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
                  <span>Resets in 3d</span>
                  <span>just now</span>
                </div>
              </div>
              <div className="rounded-xl border border-neutral-100 bg-white p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-md bg-black" />
                  <span className="text-xs font-semibold">ChatGPT</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[18px] font-bold">$128</span>
                  <span className="text-[11px] text-neutral-500">/ $200</span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-200 mt-1">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: "64%" }} />
                </div>
              </div>
            </div>
            {/* overlay CTA */}
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center text-center p-4 gap-3">
              <p className="text-sm font-semibold text-neutral-900">Install Chrome Extension to track limits</p>
              <p className="text-xs text-neutral-600 leading-relaxed max-w-[260px]">
                This widget reads your Claude & ChatGPT usage from your own signed-in tabs. No backend, no conversations.
              </p>
              <a
                href="https://chromewebstore.google.com/detail/llm-usage-claude-chatgpt/placeholder"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-5 py-2.5 rounded-full bg-black text-white hover:bg-neutral-800 shadow"
              >
                Install Chrome Extension
              </a>
              <p className="text-[11px] text-neutral-500">
                After install: grant <b>claude.ai</b> & <b>chatgpt.com</b> → Refresh → reload.
              </p>
              <button onClick={requestData} className="text-xs text-neutral-500 underline">
                Check again
              </button>
            </div>
          </div>
        )}

        {hasExtension === true && (
          <>
            {/* Claude */}
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-md bg-[#d97757] flex items-center justify-center text-white">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0h3.767l6.57 16.96H13.24l-1.343-3.465H5.024l-1.344 3.465H0L6.569 3.52zm4.132 10.222L8.517 7.51l-2.184 6.232h4.368z" />
                  </svg>
                </span>
                <span className="text-xs font-semibold">Claude</span>
                <span className="text-[11px] text-neutral-400">claude.ai</span>
                <button
                  onClick={() => refresh("claude")}
                  disabled={busy}
                  className="ml-auto text-[11px] px-2 py-1 rounded-full border bg-white hover:bg-neutral-50 disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
              {data?.["usageCache:claude"] ? (
                <Meter entry={data["usageCache:claude"]} />
              ) : (
                <p className="text-xs text-neutral-500 text-center py-2">
                  No cached reading. <button onClick={() => refresh("claude")} className="underline font-medium">Read usage</button>
                </p>
              )}
            </div>

            {/* ChatGPT */}
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-md bg-black flex items-center justify-center text-white">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
                  </svg>
                </span>
                <span className="text-xs font-semibold">ChatGPT</span>
                <span className="text-[11px] text-neutral-400">chatgpt.com</span>
                <button
                  onClick={() => refresh("chatgpt")}
                  disabled={busy}
                  className="ml-auto text-[11px] px-2 py-1 rounded-full border bg-white hover:bg-neutral-50 disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
              {data?.["usageCache:chatgpt"] ? (
                <Meter entry={data["usageCache:chatgpt"]} />
              ) : (
                <p className="text-xs text-neutral-500 text-center py-2">
                  No cached reading. <button onClick={() => refresh("chatgpt")} className="underline font-medium">Read usage</button>
                </p>
              )}
            </div>

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            {session?.user ? (
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                <img src={session.user.image || ""} alt="" className="w-6 h-6 rounded-full bg-neutral-200" />
                <span className="text-xs text-neutral-700 flex-1 truncate">{session.user.email}</span>
                <button onClick={() => signOut()} className="text-xs px-2 py-1 rounded-full border hover:bg-neutral-50">
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="w-full flex items-center justify-center gap-2 text-xs font-medium px-4 py-2 rounded-full bg-white border border-neutral-200 hover:bg-neutral-50"
              >
                <span className="w-4 h-4 rounded-full bg-white border flex items-center justify-center text-[10px] font-bold">G</span>
                Sign in with Google to sync
              </button>
            )}
            <div className="flex items-center gap-2">
              <input
                id="syncToggle"
                type="checkbox"
                checked={syncEnabled}
                onChange={(e) => toggleSync(e.target.checked)}
                disabled={!session?.user}
                className="rounded disabled:opacity-50"
              />
              <label htmlFor="syncToggle" className="text-xs text-neutral-600 flex-1">
                Sync to my MenOfMatrix account {!session?.user && "(sign in first)"}
              </label>
              {syncStatus && <span className="text-[11px] text-neutral-500">{syncStatus}</span>}
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Local by default. When signed in and enabled, this page POSTs only the numbers (percent/spend/resetsAt) to <code>/api/usage</code> bound to your Google email. No conversations.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
