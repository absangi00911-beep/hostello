// Path: src/lib/auth/session.ts

/**
 * Session utilities for Hostello API routes.
 *
 * These helpers sit on top of NextAuth's auth() function and solve three
 * repeated problems in route handlers:
 *
 *   1. Role checking  — isAdmin / isOwner / isStudent / hasRole
 *   2. Auth gating    — requireRole() returns a ready-made NextResponse on failure
 *   3. Full user data — getSessionUser() fetches fields the JWT doesn't carry
 *                       (name, email, phone, avatar, bio, city)
 *
 * Import auth() from this module's sibling config.ts; this file never calls
 * auth() itself so it stays testable without mocking NextAuth.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Session } from "next-auth";
import type { UserRole } from "@/types";

// ── Role predicates ────────────────────────────────────────────────────────

/** True when the session user has the ADMIN role. */
export function isAdmin(session: Session): boolean {
  return session.user.role === "ADMIN";
}

/** True when the session user has the OWNER role. */
export function isOwner(session: Session): boolean {
  return session.user.role === "OWNER";
}

/** True when the session user has the STUDENT role. */
export function isStudent(session: Session): boolean {
  return session.user.role === "STUDENT";
}

/**
 * True when the session user has ANY of the specified roles.
 *
 * @example
 * if (!hasRole(session, "OWNER", "ADMIN")) return forbidden();
 */
export function hasRole(session: Session, ...roles: UserRole[]): boolean {
  return roles.includes(session.user.role as UserRole);
}

// ── API route guards ───────────────────────────────────────────────────────

/**
 * Returns a 401 NextResponse if there is no session, or a 403 if the
 * session user does not have one of the required roles.
 * Returns null when the check passes — use this as an early-return guard.
 *
 * @example
 * const session = await auth();
 * const deny = requireRole(session, "OWNER", "ADMIN");
 * if (deny) return deny;
 * // session is guaranteed non-null and correctly-roled from here
 *
 * @example — admin-only route
 * const deny = requireRole(session, "ADMIN");
 * if (deny) return deny;
 */
export function requireRole(
  session: Session | null,
  ...roles: UserRole[]
): NextResponse | null {
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (roles.length > 0 && !hasRole(session, ...roles)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

/**
 * Returns a 401 NextResponse if there is no session, null otherwise.
 * Use when any authenticated user is allowed but unauthenticated ones are not.
 *
 * @example
 * const session = await auth();
 * const deny = requireAuth(session);
 * if (deny) return deny;
 */
export function requireAuth(session: Session | null): NextResponse | null {
  return requireRole(session);
}

// ── Full user fetch ────────────────────────────────────────────────────────

/**
 * Fetches the authenticated user's full record from the database.
 *
 * The NextAuth JWT only carries: id, role, emailVerified.
 * Use this whenever a route needs fields the token doesn't include —
 * name, email, phone, avatar, bio, city, etc.
 *
 * Returns null if the user has been deleted mid-session.
 *
 * @example
 * const session = await auth();
 * if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *
 * const user = await getSessionUser(session);
 * if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
 */
export async function getSessionUser(session: Session) {
  return db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id:            true,
      name:          true,
      email:         true,
      emailVerified: true,
      phone:         true,
      phoneVerified: true,
      avatar:        true,
      role:          true,
      bio:           true,
      city:          true,
      createdAt:     true,
      // Deliberately excluded: password, tokenVersion (internal fields)
    },
  });
}

// ── Convenience re-export ──────────────────────────────────────────────────
// Import auth() from here so route files only need one auth import.
export { auth } from "@/lib/auth/config";