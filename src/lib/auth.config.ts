import type { NextAuthConfig } from "next-auth";

// Edge-compatible config — no Node.js-only imports (no mongoose here)
export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const publicPaths = [
        "/login",
        "/native-bridge",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/privacy",
        "/license",
        "/cookies",
        "/api/user/register",
        "/api/auth",
        "/api/billing/webhook",
        "/api/share",
        "/api/cron",
        "/api/health",
        "/share",
      ];
      const isPublic = publicPaths.some((p) => nextUrl.pathname.startsWith(p));
      if (isPublic) return true;
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.onboardingComplete = (user as { onboardingComplete?: boolean }).onboardingComplete;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as { onboardingComplete?: boolean }).onboardingComplete =
          token.onboardingComplete as boolean;
      }
      return session;
    },
  },
  providers: [], // filled in by auth.ts at runtime
  session: { strategy: "jwt" },
};
