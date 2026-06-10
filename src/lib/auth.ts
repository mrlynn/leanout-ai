import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "./mongodb";
import User from "@/models/User";
import { authConfig } from "./auth.config";
import { checkRateLimit } from "./rateLimit";

const googleEnabled = !!(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase();
        const rate = await checkRateLimit(`login:email:${email}`, 10, 15 * 60 * 1000);
        if (!rate.allowed) return null;

        await connectDB();
        const user = await User.findOne({ email });
        if (!user) return null;

        if (!user.password) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.password);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          onboardingComplete: user.onboardingComplete,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await connectDB();
        const email = user.email.toLowerCase();
        let existing = await User.findOne({ email });
        if (!existing) {
          existing = await User.create({
            name: user.name ?? email.split("@")[0],
            email,
            oauthProvider: "google",
            onboardingComplete: false,
          });
        } else if (!existing.oauthProvider) {
          existing.oauthProvider = "google";
          await existing.save();
        }
        user.id = existing._id.toString();
        (user as { onboardingComplete?: boolean }).onboardingComplete =
          existing.onboardingComplete ?? false;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.onboardingComplete = (user as { onboardingComplete?: boolean }).onboardingComplete;
      }
      if (account?.provider === "google" && user?.id) {
        token.id = user.id;
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
});
