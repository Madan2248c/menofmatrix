"use client";

import { useSession, signIn, signOut } from "next-auth/react";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export default function AuthButton({ className = "" }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className={`h-10 w-40 animate-pulse rounded-full bg-neutral-200/70 ${className}`} />;
  }

  if (session?.user) {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        {session.user.image && (
          <img
            src={session.user.image}
            alt=""
            className="h-8 w-8 rounded-full object-cover ring-1 ring-black/10"
          />
        )}
        <span className="text-sm font-medium text-neutral-800">
          {session.user.name || session.user.email}
        </span>
        <button
          type="button"
          onClick={() => signOut()}
          className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn("google")}
      className={`inline-flex items-center gap-2.5 rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition-all hover:border-neutral-300 hover:shadow-md active:scale-95 ${className}`}
    >
      <GoogleMark />
      Sign in with Google
    </button>
  );
}
