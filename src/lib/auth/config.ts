import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ── Token-version cache ────────────────────────────────────────────────────
// Purpose: reduces DB round-trips on every auth() call while still detecting
// password resets within the TTL window (~30 s). On multi-instance deployments
// the window is per-instance; replace with Redis if sub-second revocation is
// required across instances.

const TV_TTL_MS = 30_000;

interface CacheEntry {
  version: number;
  expiresAt: number;
}

const tvCache = new Map<string, CacheEntry>();

// Called by the password-reset handler to immediately invalidate the local
// cache for this instance (best-effort; remote instances drain naturally).
export function invalidateLocalSessionCache(userId: string): void {
  tvCache.delete(userId);
}

async function validateTokenVersion(
  userId: string,
  claimed: number,
): Promise<boolean> {
  const now = Date.now();
  const cached = tvCache.get(userId);

  if (cached && cached.expiresAt > now) {
    return cached.version === claimed;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tokenVersion: true },
  });

  if (!user) return false;

  tvCache.set(userId, { version: user.tokenVersion, expiresAt: now + TV_TTL_MS });
  return user.tokenVersion === claimed;
}

// ── NextAuth config ────────────────────────────────────────────────────────

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
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
            emailVerified: !!user.emailVerified,
            // Pass tokenVersion to the JWT callback via the user object
            // (non-standard field; picked up in jwt callback below)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tokenVersion: user.tokenVersion,
          } as any;
        } catch {
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
        token.emailVerified =
          (user as { emailVerified?: boolean }).emailVerified ?? false;
        // Embed tokenVersion so the session callback can detect revocation
        token.tokenVersion =
          (user as { tokenVersion?: number }).tokenVersion ?? 0;
      }
      return token;
    },

    async session({ session, token }) {
      const userId = token.id as string | undefined;
      const claimed = token.tokenVersion as number | undefined;

      if (userId && claimed !== undefined) {
        const valid = await validateTokenVersion(userId, claimed);
        if (!valid) {
          // Throwing here causes auth() to return null, effectively signing
          // the user out without touching the cookie (next request will redirect).
          throw new Error("Session revoked — credentials were changed.");
        }
      }

      session.user.id = token.id as string;
      session.user.role = token.role as "STUDENT" | "OWNER" | "ADMIN";
      (session.user as unknown as { emailVerified: boolean }).emailVerified =
        token.emailVerified as boolean;
      return session;
    },
  },
});