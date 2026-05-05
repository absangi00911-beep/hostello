import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  getTokenVersion,
  setTokenVersion,
  invalidateTokenVersion,
} from "@/lib/auth/token-version-cache";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ── Token-version cache ────────────────────────────────────────────────────
// Purpose: Reduces DB round-trips on every auth() call while detecting
// password resets across all instances via Redis. TTL is ~30 seconds.
// 
// When a password is reset, invalidateTokenVersion() clears the Redis key,
// causing the user's next request to fetch from DB and get the new tokenVersion.
// If tokenVersion was incremented, the JWT no longer matches and session is revoked.

/**
 * Revoke all sessions for a user (e.g., after password reset).
 * Invalidates the Redis cache so the next auth() call fetches the new tokenVersion.
 */
export async function invalidateLocalSessionCache(userId: string): Promise<void> {
  await invalidateTokenVersion(userId);
}

async function validateTokenVersion(
  userId: string,
  claimed: number,
): Promise<boolean> {
  // Try Redis cache first (fast path on warm cache)
  let cachedVersion = await getTokenVersion(userId);

  if (cachedVersion !== null) {
    return cachedVersion === claimed;
  }

  // Cache miss or Redis unavailable — fetch from DB
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tokenVersion: true },
  });

  if (!user) return false;

  // Populate cache for subsequent requests
  await setTokenVersion(userId, user.tokenVersion);

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
            // Pass tokenVersion to the JWT callback via the user object.
            // NextAuth type augmentation in types/index.ts makes this field valid.
            tokenVersion: user.tokenVersion,
          };
        } catch (err) {
          // Distinguish between auth failures and infrastructure failures.
          // DB timeout / connection error should not look like "wrong password".
          console.error("[auth] Database error during authorization:", err);
          throw new Error(
            "Authentication service unavailable. Try again shortly."
          );
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // Convert emailVerified from Date | null (AdapterUser) to boolean
        token.emailVerified = user.emailVerified ? true : false;
        // tokenVersion is our custom field passed via the user object.
        // Augmented in types/index.ts for type safety.
        token.tokenVersion = user.tokenVersion ?? 0;
      }
      return token;
    },

    async session({ session, token }) {
      // Validate tokenVersion to detect password resets across instances.
      // This invalidates sessions when a user's password changes.
      if (token.id && token.tokenVersion !== undefined) {
        const isValid = await validateTokenVersion(
          token.id as string,
          token.tokenVersion as number,
        );
        if (!isValid) {
          // Returning empty user forces NextAuth to treat session as invalid
          return { ...session, user: { ...session.user, id: "" } };
        }
      }
      session.user.id = token.id as string;
      session.user.role = token.role as "STUDENT" | "OWNER" | "ADMIN";
      return session;
    },
  },
});