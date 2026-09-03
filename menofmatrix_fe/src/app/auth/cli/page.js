"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

function CliAuthContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callback") || "http://127.0.0.1:7777/callback";
  const state = searchParams.get("state") || "";

  const { data: session, status } = useSession();
  const [authorized, setAuthorized] = useState(false);

  // A real, backend-verifiable JWT (with a `.mid` claim) minted by /api/auth/google — see
  // src/auth.js. The CLI sends this back as `Authorization: Bearer <token>` on every sync, and
  // the backend's requireMember middleware verifies it. There is no other path to a valid token:
  // no self-reported handle/email is ever accepted as an identity here.
  const hasVerifiedToken = Boolean(session?.memberToken);

  const handleAuthorizeSubmit = (e) => {
    e.preventDefault();
    if (!hasVerifiedToken) return;

    const userId = session.user.email || session.user.name || "user";
    const email = session.user.email || "";
    const token = session.memberToken;

    const redirectTarget = `${callbackUrl}?user_id=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}&auth_token=${encodeURIComponent(token)}&state=${encodeURIComponent(state)}`;

    setAuthorized(true);
    setTimeout(() => {
      window.location.href = redirectTarget;
    }, 600);
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[70vh] w-full items-center justify-center p-8 text-center text-sm font-bold text-neutral-600">
        Checking Men of Matrix session...
      </div>
    );
  }

  const isLoggedIn = status === "authenticated" && session && session.user;
  const userDisplay = isLoggedIn ? (session.user.name || session.user.email) : "";
  const emailDisplay = isLoggedIn ? session.user.email : "";

  return (
    <div className="flex min-h-[85vh] w-full items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
        {/* Header */}
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
              Your account ({userDisplay}) is linked. You can close this browser tab and return to your terminal.
            </p>
          </div>
        ) : !isLoggedIn ? (
          /* Step 1: User is NOT logged in -> Require Login First */
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-xs font-bold text-amber-900">
                🔒 Authentication Required
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-800">
                You must be logged into Men of Matrix before authorizing MOM Tracker CLI to connect to your account.
              </p>
            </div>

            <button
              onClick={() => signIn("google")}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-300 bg-white py-3 text-sm font-bold text-neutral-900 shadow-sm transition hover:bg-neutral-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign In with Google
            </button>
          </div>
        ) : !hasVerifiedToken ? (
          /* Signed into Men of Matrix, but the backend never issued a verifiable member token
             (e.g. /api/auth/google failed). Refuse to fall back to an unverified identity. */
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-xs font-bold text-red-900">⚠️ Couldn&apos;t verify your account</p>
              <p className="mt-1 text-[11px] leading-relaxed text-red-800">
                We couldn&apos;t confirm your Men of Matrix membership with our servers, so we can&apos;t
                safely connect the CLI to your account. Please sign out and try again.
              </p>
            </div>
            <button
              onClick={() => signIn("google")}
              className="w-full rounded-xl border border-neutral-300 bg-white py-3 text-sm font-bold text-neutral-900 shadow-sm transition hover:bg-neutral-50"
            >
              Retry Sign In
            </button>
          </div>
        ) : (
          /* Step 2: User IS logged in -> Show Authorization Modal */
          <form onSubmit={handleAuthorizeSubmit} className="mt-6 flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
              <div className="flex items-center gap-3">
                {session.user.image ? (
                  <img src={session.user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                    {(userDisplay || "U")[0]}
                  </div>
                )}
                <div>
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-700">
                    Signed in as
                  </p>
                  <p className="text-sm font-bold text-neutral-900">{userDisplay}</p>
                  {emailDisplay && <p className="text-[10px] text-neutral-500">{emailDisplay}</p>}
                </div>
              </div>
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
