import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

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
      }
      return token;
    },
    async session({ session, token }) {
      session.userId = token.sub || token.googleId || token.email;
      session.email = token.email;
      if (session.user) {
        session.user.name = session.user.name || token.name;
        session.user.image = session.user.image || token.picture;
      }
      return session;
    },
  },
});
