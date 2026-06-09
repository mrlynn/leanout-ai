import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "./mongodb";
import User from "@/models/User";
import { authConfig } from "./auth.config";
import { checkRateLimit } from "./rateLimit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
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
});
