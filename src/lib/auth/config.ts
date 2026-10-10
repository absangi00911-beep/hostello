import { createJwtCallback } from "@/lib/auth/auth-callbacks";
import { authorizeCredentials } from "@/lib/auth/credentials-authorize";
// Path: src/lib/auth/config.ts

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import {
  getTokenVersion,
  setTokenVersion,
  invalidateTokenVersion,
} from "@/lib/auth/token-version-cache";

// -- Token-version cache ----------------------------------------------------
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
    select: { tokenVersion: true, deletionRequestedAt: true },
  });

  if (!user || user.deletionRequestedAt) return false;

  // Populate cache for subsequent requests
  await setTokenVersion(userId, user.tokenVersion);

  return user.tokenVersion === claimed;
}

// -- Provider list ----------------------------------------------------------
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
  authorize: (credentials, request) => authorizeCredentials(credentials, request),
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

// -- NextAuth config --------------------------------------------------------

if (!process.env.AUTH_SECRET) {
  throw new Error(
    "CRITICAL: AUTH_SECRET environment variable is not set. " +
    "NextAuth v5 requires this for JWT signing and CSRF protection."
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // PrismaAdapter persists OAuth accounts and links them to users in the DB.
  // It does NOT change the session strategy — we stay on JWT.
  // The adapter is only consulted during OAuth sign-in flows; Credentials
  // sign-ins bypass it (the authorize callback handles those directly).
  adapter: PrismaAdapter(db),

  secret: process.env.AUTH_SECRET,
  basePath: "/api/auth",
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
    // -- signIn -------------------------------------------------------------
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

      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { deletionRequestedAt: true },
      });
      if (!dbUser || dbUser.deletionRequestedAt) return false;

      return true;
    },

    // -- jwt ----------------------------------------------------------------
    // A stale tokenVersion returns null, so Auth.js removes the session cookie
    // before any route can use an old role claim.
    jwt: createJwtCallback(validateTokenVersion),

    // -- session ------------------------------------------------------------
    // Runs after the JWT callback accepts the token.
    session({ session, token }) {
      session.user.id   = token.id as string;
      session.user.role = token.role as "STUDENT" | "OWNER" | "ADMIN";
      session.user.emailVerified = token.emailVerified;
      session.user.tokenVersion = token.tokenVersion;
      return session;
    },
  },
});
