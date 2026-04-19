import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  // PrismaAdapter removed: not needed with JWT strategy + Credentials-only auth.
  // Re-add it only when adding OAuth providers (Google, GitHub, etc.) that need
  // to persist access tokens and linked accounts to the database.
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    // Do NOT redirect auth errors to /login — that creates a loop where
    // SessionProvider's fetch to /api/auth/session gets an HTML redirect
    // instead of JSON, causing the ClientFetchError shown in the console.
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        try {
          const user = await db.user.findUnique({ where: { email } });
          if (!user?.password) return null;

          const valid = await compare(password, user.password);
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
            role: user.role,
          };
        } catch {
          // Database unreachable — return null so NextAuth responds with JSON,
          // not an HTML crash page.
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as "STUDENT" | "OWNER" | "ADMIN";
      return session;
    },
  },
});
