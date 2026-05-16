// Path: src/types/next-auth.d.ts
//
// Extends NextAuth's built-in types with the custom fields stored in the JWT.
// Source of truth: SYSTEM.md §10 — JWT contains id, role, emailVerified, tokenVersion.
// Without this file every session.user.role access is a TypeScript error.

import type { DefaultSession } from "next-auth";

type UserRole = "STUDENT" | "OWNER" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id:             string;
      role:           UserRole;
      emailVerified:  Date | null;
      tokenVersion:   number;
    } & DefaultSession["user"]; // keeps name, email, image
  }

  interface User {
    id:            string;
    role:          UserRole;
    emailVerified: Date | null;
    tokenVersion:  number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:            string;
    role:          UserRole;
    emailVerified: Date | null;
    tokenVersion:  number;
  }
}
