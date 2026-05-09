import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
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
// password resets across all instances via Redis. TTL is 5 minutes.
//
// When a password is reset, invalidateTokenVersion() clears the Redis key,
// causing the user's next request to fetch from DB and get the new tokenVersion.
// If tokenVersion was incremented, the JWT no longer matches and session is revoked.
//
// This mechanism works for both Credentials AND OAuth users — tokenVersion
// is a DB field and defaults to 0 for all users regardless of sign-in method.

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
  const cachedVersion = await getTokenVersion(userId);

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

// ── Provider list ──────────────────────────────────────────────────────────
//
// Credentials: always included.
//
// Google: only included when AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET are set.
//   - New Google users are created by PrismaAdapter with role STUDENT (schema default).
//   - Google-verified emails set emailVerified automatically via the adapter.
//   - An existing Credentials user trying to sign in with Google will get an
//     OAuthAccountNotLinked error — this is intentional to prevent account takeover.
//     To link the accounts, the user must first sign in with credentials and then
//     connect Google from their profile settings (future feature).

const credentialsProvider = Credentials({
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
});

const googleProvider =
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        // Do NOT set allowDangerousEmailAccountLinking here.
        // If a Credentials user tries to sign in with Google using the same email,
        // NextAuth will show OAuthAccountNotLinked rather than silently taking over
        // the account. This is the safer default.
      })
    : null;

// ── NextAuth config ────────────────────────────────────────────────────────

export const { handlers, signIn, signOut, auth } = NextAuth({
  // PrismaAdapter persists OAuth accounts and links them to users in the DB.
  // It does NOT change the session strategy — we stay on JWT.
  // The adapter is only consulted during OAuth sign-in flows; Credentials
  // sign-ins bypass it (the authorize callback handles those directly).
  adapter: PrismaAdapter(db),

  session: { strategy: "jwt" },
  trustHost: true,

  pages: {
    signIn: "/login",
    // Send OAuth errors (e.g., OAuthAccountNotLinked) back to the login page
    // with an ?error= query param the UI can read and display.
    error: "/login",
  },

  providers: [
    credentialsProvider,
    ...(googleProvider ? [googleProvider] : []),
  ],

  callbacks: {
    // ── signIn ─────────────────────────────────────────────────────────────
    // Called before a session is created. Return false or a URL string to
    // block the sign-in; return true to allow it.
    async signIn({ user, account }) {
      // Credentials sign-ins bypass the adapter, so account is populated
      // but the user object comes from our authorize() callback directly.
      // No extra checks needed here for credentials.
      if (account?.provider === "credentials") return true;

      // For OAuth providers: make sure the returned user has an id (i.e. the
      // adapter successfully created or retrieved the DB record). If the DB
      // is down or the adapter threw, user.id will be undefined.
      if (!user?.id) {
        console.error("[auth] OAuth sign-in: adapter returned no user id", {
          provider: account?.provider,
        });
        return false;
      }

      return true;
    },

    // ── jwt ────────────────────────────────────────────────────────────────
    // Runs whenever a JWT is created (sign-in) or accessed (request).
    // The `user` object is only populated on initial sign-in.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // `user.emailVerified` is:
        //   - boolean  — from Credentials (we coerce it in authorize())
        //   - Date|null — from PrismaAdapter for OAuth users
        // Both are handled correctly by the truthiness check.
        token.emailVerified = user.emailVerified ? true : false;
        // tokenVersion defaults to 0 for all new users (Credentials or OAuth).
        // It is only incremented on password change / reset.
        token.tokenVersion = user.tokenVersion ?? 0;
      }
      return token;
    },

    // ── session ────────────────────────────────────────────────────────────
    // Runs on every auth() or useSession() call.
    // Validates tokenVersion to detect password resets across all instances.
    async session({ session, token }) {
      if (token.id && token.tokenVersion !== undefined) {
        const isValid = await validateTokenVersion(
          token.id as string,
          token.tokenVersion as number,
        );
        if (!isValid) {
          // Returning an empty id forces NextAuth to treat the session as invalid.
          // The client receives a session with no user id, which should redirect to login.
          return { ...session, user: { ...session.user, id: "" } };
        }
      }
      session.user.id   = token.id as string;
      session.user.role = token.role as "STUDENT" | "OWNER" | "ADMIN";
      return session;
    },
  },
});