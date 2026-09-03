import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const BACKEND = process.env.BACKEND_URL || (process.env.NODE_ENV === "development" ? "http://localhost:4000" : "https://backend-two-delta-twnhtuwv4g.vercel.app");

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || process.env.JWT_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist Google identity + profile bits on first sign-in
      if (account && profile) {
        token.googleId = profile.sub;
        token.email = profile.email;
        token.name = profile.name || token.name;
        token.picture = profile.picture || token.picture;
        if (account.id_token) {
          try {
            const response = await fetch(`${BACKEND}/api/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential: account.id_token }),
            });
            const data = await response.json();
            if (response.ok) {
              token.memberToken = data.token;
              token.member = data.member;
            }
          } catch {
            // Public browsing still works when the community backend is offline.
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.userId = token.sub || token.googleId || token.email;
      session.email = token.email;
      session.memberToken = token.memberToken || null;
      session.member = token.member || null;
      if (session.user) {
        session.user.name = session.user.name || token.name;
        session.user.image = session.user.image || token.picture;
      }
      return session;
    },
  },
});
