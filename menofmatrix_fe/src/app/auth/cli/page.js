"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getToken, setToken } from "@/lib/auth";

function CliAuthContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callback") || "http://127.0.0.1:7777/callback";
  const state = searchParams.get("state") || "";

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const existingToken = getToken();
    const savedHandle = localStorage.getItem("mom_handle");
    const savedEmail = localStorage.getItem("mom_email");

    if (savedHandle) setHandle(savedHandle);
    if (savedEmail) setEmail(savedEmail);

    if (existingToken || savedHandle) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userHandle = handle.trim() || "builder";
      localStorage.setItem("mom_handle", userHandle);
      if (email.trim()) localStorage.setItem("mom_email", email.trim());
      setToken("tok_" + Math.random().toString(36).substring(2, 14));

      setIsLoggedIn(true);
    } catch (err) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeSubmit = (e) => {
    e.preventDefault();
    const userHandle = handle.trim() || "builder";
    const userEmail = email.trim();
    const token = getToken() || "tok_" + Math.random().toString(36).substring(2, 14);

    const redirectTarget = `${callbackUrl}?user_id=${encodeURIComponent(userHandle)}&email=${encodeURIComponent(userEmail)}&auth_token=${encodeURIComponent(token)}&state=${encodeURIComponent(state)}`;

    setAuthorized(true);
    setTimeout(() => {
      window.location.href = redirectTarget;
    }, 600);
  };

  return (
    <div className="flex min-h-[85vh] w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white/75 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-900 text-xl font-bold text-white shadow">
            M
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600">
              Men of Matrix
            </p>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">
              CLI Authorization
            </h1>
          </div>
        </div>

        {authorized ? (
          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
            <span className="text-4xl">✅</span>
            <h2 className="mt-3 text-lg font-bold text-neutral-900">
              MOM Tracker CLI Connected!
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
              Your account (@{handle || "builder"}) is linked. You can close this browser tab and return to your terminal.
            </p>
          </div>
        ) : !isLoggedIn ? (
          /* Step 1: User is NOT logged in -> Require Login First */
          <form onSubmit={handleLoginSubmit} className="mt-6 flex flex-col gap-4">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-xs font-bold text-amber-900">
                🔒 Authentication Required
              </p>
              <p className="mt-1 text-[11px] text-amber-800">
                Please log in to your Men of Matrix account first before authorizing MOM Tracker CLI.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700">
                Username / Handle
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. madan"
                required
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm font-medium text-neutral-900 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. madan@menofmatrix.com"
                className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-sm font-medium text-neutral-900 outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>

            {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-neutral-900 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-neutral-800 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Log In to Men of Matrix"}
            </button>
          </form>
        ) : (
          /* Step 2: User IS logged in -> Show Authorization Modal */
          <form onSubmit={handleAuthorizeSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Signed in as
                </p>
                <p className="text-sm font-bold text-neutral-900">@{handle || "builder"}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsLoggedIn(false);
                  localStorage.removeItem("mom_handle");
                }}
                className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 underline"
              >
                Switch Account
              </button>
            </div>

            <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-4">
              <p className="text-xs font-bold text-neutral-900">
                Allow <span className="text-orange-600">MOM Tracker CLI</span> access to your token usage data?
              </p>
              <ul className="mt-2.5 flex flex-col gap-1.5 text-[11px] text-neutral-600">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span> Link daily AI agent token counts to your profile
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span> Display score on community rankings leaderboard
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span> Zero source code or prompt contents ever transmitted
                </li>
              </ul>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-xl bg-orange-600 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-orange-700"
            >
              Allow Access & Connect CLI
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CliAuthPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-bold">Loading authorization page...</div>}>
      <CliAuthContent />
    </Suspense>
  );
}
