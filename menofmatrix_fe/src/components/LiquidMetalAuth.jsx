"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import LiquidMetalButton from "@/components/LiquidMetalButton";

const LM_SIZE = { fontSize: 11, padding: "0.5rem 1.5rem" };

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export default function LiquidMetalAuth() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-8 w-36 animate-pulse rounded-full bg-neutral-200/70" />;
  }

  if (session?.user) {
    const label = session.user.name || session.user.email || "Account";
    return (
      <LiquidMetalButton variant="silver" onClick={() => signOut()} {...LM_SIZE}>
        {session.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="-ml-1.5 h-4 w-4 rounded-full object-cover ring-1 ring-black/20"
          />
        ) : (
          <span className="-ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/80 text-[9px] font-bold text-white">
            {label.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="max-w-[10rem] truncate">{label}</span>
      </LiquidMetalButton>
    );
  }

  return (
    <LiquidMetalButton variant="silver" onClick={() => signIn("google")} {...LM_SIZE}>
      <GoogleMark />
      Sign in with Google
    </LiquidMetalButton>
  );
}
