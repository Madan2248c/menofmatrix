"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { motion } from "motion/react";
import EyeFollowButton, { Eye, TopFlares, manrope } from "@/components/EyeFollowButton";

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

const BG = "#0a0a0a";
const SPRING = { type: "spring", stiffness: 380, damping: 34, mass: 0.9 };

export default function EyeFollowAuth() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  if (status === "loading") {
    return <div className="h-9 w-40 animate-pulse rounded-full bg-neutral-200/70" />;
  }

  if (session?.user) {
    const label = session.user.name || session.user.email || "Account";
    return (
      <div
        ref={ref}
        className={`${manrope.className} relative flex flex-col text-white`}
        style={{
          background: BG,
          borderRadius: "0 0 22px 22px",
          boxShadow: "0 16px 30px rgba(0,0,0,0.24)",
        }}
      >
        <TopFlares color={BG} />

        {/* header — click to expand */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2.5 whitespace-nowrap font-bold leading-none"
          style={{ padding: "9px 22px 9px 14px", fontSize: 12 }}
        >
          <span className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15 text-[10px] font-bold">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                label.charAt(0).toUpperCase()
              )}
            </span>
            <span>{label}</span>
          </span>
          <span className="flex shrink-0 items-center" style={{ gap: 4 }}>
            {[0, 1].map((i) => (
              <Eye
                key={i}
                size={22}
                pupilSize={7}
                pupilColor="#000"
                eyeColor="#fff"
                rangePct={90}
                blink={false}
              />
            ))}
          </span>
        </button>

        {/* expanded body — the same shape simply grows to include this */}
        <motion.div
          initial={false}
          animate={{ height: open ? "auto" : 0 }}
          transition={SPRING}
          className="overflow-hidden"
        >
          <motion.div
            animate={{ opacity: open ? 1 : 0, y: open ? 0 : -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1], delay: open ? 0.06 : 0 }}
            className="flex flex-col gap-1.5 px-2 pb-2 pt-0.5"
          >
            {session.user.email && (
              <span className="truncate px-2 text-[10px] text-white/45">{session.user.email}</span>
            )}
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full rounded-[14px] bg-white/[0.08] px-3 py-2 text-[12px] font-semibold text-white/90 transition-colors duration-150 hover:bg-white/[0.16] hover:text-white active:scale-[0.98]"
            >
              Log out
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <EyeFollowButton attachTop onClick={() => signIn("google")}>
      <span className="flex items-center gap-1.5">
        <GoogleMark />
        Sign in
      </span>
    </EyeFollowButton>
  );
}
