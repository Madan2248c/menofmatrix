"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@/components/SessionProvider";

// Renders Google's own button via GSI; shows the member handle + sign-out once
// authenticated. No-ops (renders nothing) if NEXT_PUBLIC_GOOGLE_CLIENT_ID is unset.
export default function SignInButton({ theme = "outline", size = "medium" }) {
  const { member, loading, signOut } = useSession();
  const ref = useRef(null);
  const [ready, setReady] = useState(
    typeof window !== "undefined" && window.__mmGsiReady
  );

  useEffect(() => {
    if (ready) return;
    const on = () => setReady(true);
    window.addEventListener("mm-gsi-ready", on);
    return () => window.removeEventListener("mm-gsi-ready", on);
  }, [ready]);

  useEffect(() => {
    if (!ready || member || !ref.current) return;
    ref.current.innerHTML = "";
    window.google?.accounts?.id?.renderButton(ref.current, {
      theme,
      size,
      shape: "pill",
      text: "signin_with",
    });
  }, [ready, member, theme, size]);

  if (loading) return null;

  if (member) {
    return (
      <div className="flex items-center gap-2 text-xs text-neutral-600">
        {member.avatar_url && (
          <img
            src={member.avatar_url}
            alt=""
            className="h-6 w-6 rounded-full object-cover ring-1 ring-black/10"
          />
        )}
        <span className="font-semibold text-neutral-800">@{member.handle}</span>
        <button
          type="button"
          onClick={signOut}
          className="rounded-full bg-neutral-100 px-2.5 py-1 font-medium text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
        >
          Sign out
        </button>
      </div>
    );
  }

  return <div ref={ref} className="min-h-[32px]" />;
}
