import { describe, expect, it, vi } from "vitest";
import type { NextAuthConfig } from "next-auth";
import { createJwtCallback } from "./auth-callbacks";

type JwtCallback = NonNullable<NonNullable<NextAuthConfig["callbacks"]>["jwt"]>;

function runJwtCallback(
  callback: JwtCallback,
  token: Parameters<JwtCallback>[0]["token"],
  user?: Parameters<JwtCallback>[0]["user"],
) {
  return callback({ token, user } as Parameters<JwtCallback>[0]);
}

describe("NextAuth JWT callback", () => {
  it("drops a revoked admin token instead of returning its stale role claim", async () => {
    const validateTokenVersion = vi.fn().mockResolvedValue(false);
    const callback = createJwtCallback(validateTokenVersion);
    const token = {
      id: "admin-1",
      role: "ADMIN",
      tokenVersion: 2,
    } as Parameters<JwtCallback>[0]["token"];

    await expect(runJwtCallback(callback, token)).resolves.toBeNull();
    expect(validateTokenVersion).toHaveBeenCalledWith("admin-1", 2);
  });

  it("keeps a current token after checking its database version", async () => {
    const validateTokenVersion = vi.fn().mockResolvedValue(true);
    const callback = createJwtCallback(validateTokenVersion);
    const token = {
      id: "owner-1",
      role: "OWNER",
      tokenVersion: 4,
    } as Parameters<JwtCallback>[0]["token"];

    await expect(runJwtCallback(callback, token)).resolves.toBe(token);
    expect(validateTokenVersion).toHaveBeenCalledWith("owner-1", 4);
  });

  it("rejects tokens missing a valid identity, version, or role", async () => {
    const validateTokenVersion = vi.fn().mockResolvedValue(true);
    const callback = createJwtCallback(validateTokenVersion);
    const malformedTokens = [
      { id: "", role: "ADMIN", tokenVersion: 1 },
      { id: "user-1", role: "ADMIN", tokenVersion: undefined },
      { id: "user-1", role: "UNKNOWN", tokenVersion: 1 },
    ] as Parameters<JwtCallback>[0]["token"][];

    for (const token of malformedTokens) {
      await expect(runJwtCallback(callback, token)).resolves.toBeNull();
    }
    expect(validateTokenVersion).not.toHaveBeenCalled();
  });

  it("initializes the JWT from the authenticated user on sign-in", async () => {
    const validateTokenVersion = vi.fn().mockResolvedValue(false);
    const callback = createJwtCallback(validateTokenVersion);
    const token = {} as Parameters<JwtCallback>[0]["token"];
    const user = {
      id: "student-1",
      role: "STUDENT",
      emailVerified: null,
      tokenVersion: 3,
    } as Parameters<JwtCallback>[0]["user"];

    const result = await runJwtCallback(callback, token, user);

    expect(result).toMatchObject({
      id: "student-1",
      role: "STUDENT",
      emailVerified: null,
      tokenVersion: 3,
    });
    expect(validateTokenVersion).not.toHaveBeenCalled();
  });
});
