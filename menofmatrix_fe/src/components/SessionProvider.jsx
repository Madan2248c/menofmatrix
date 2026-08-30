"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearMemberToken,
  getMemberToken,
  memberFetch,
  setMemberToken,
} from "@/lib/session";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

const SessionContext = createContext({
  member: null,
  loading: true,
  signOut: () => {},
  refresh: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getMemberToken()) {
      setMember(null);
      setLoading(false);
      return;
    }
    try {
      const res = await memberFetch("/api/community/me");
      if (res.ok) {
        setMember((await res.json()).data);
      } else {
        clearMemberToken();
        setMember(null);
      }
    } catch {
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Exchange a Google ID token for our own session, then load the member.
  const handleCredential = useCallback(
    async (response) => {
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: response.credential }),
        });
        const data = await res.json();
        if (res.ok && data.token) {
          setMemberToken(data.token);
          setMember(data.member);
          await refresh();
        }
      } catch {
        /* swallow — button stays available for retry */
      }
    },
    [refresh]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Load Google Identity Services once and initialise it.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || typeof window === "undefined") return;
    function init() {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
      });
      window.__mmGsiReady = true;
      window.dispatchEvent(new Event("mm-gsi-ready"));
    }
    if (window.google?.accounts?.id) {
      init();
      return;
    }
    let script = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", init);
    return () => script.removeEventListener("load", init);
  }, [handleCredential]);

  const signOut = useCallback(() => {
    clearMemberToken();
    setMember(null);
    window.google?.accounts?.id?.disableAutoSelect?.();
  }, []);

  const value = useMemo(
    () => ({ member, loading, signOut, refresh }),
    [member, loading, signOut, refresh]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
