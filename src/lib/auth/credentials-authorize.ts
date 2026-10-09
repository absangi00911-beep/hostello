import { createHmac } from "node:crypto";
import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { getSafeErrorSummary } from "@/lib/safe-error";
import {
  createOperationalLogContext,
  hashOperationalIdentifier,
  logOperationalEvent,
} from "@/lib/operational-logger";
import {
  LOGIN_ACCOUNT_LIMIT,
  LOGIN_IP_LIMIT,
  LOGIN_WINDOW_MS,
  loginIpLimitKey,
} from "@/lib/auth/login-limits";

export const credentialLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export class CredentialLoginRateLimitError extends Error {
  constructor() {
    super("Too many login attempts. Please wait a few minutes and try again.");
    this.name = "CredentialLoginRateLimitError";
  }
}

function hashLoginEmail(email: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Authentication service unavailable.");

  return createHmac("sha256", secret)
    .update(email.trim().toLowerCase())
    .digest("hex");
}

function getLogIdentifiers(clientIp: string, email?: string) {
  const principalHash = email
    ? hashOperationalIdentifier(`login:${email.trim().toLowerCase()}`)
    : null;
  const ipHash = hashOperationalIdentifier(`ip:${clientIp}`);
  return {
    ...(principalHash ? { principal_hash: principalHash } : {}),
    ...(ipHash ? { ip_hash: ipHash } : {}),
  };
}

/** Consume the shared source-IP bucket before reading a mobile request body. */
export async function checkCredentialLoginIpLimit(
  request: Request,
  email?: string,
): Promise<boolean> {
  const clientIp = getIp(request);
  const result = await rateLimit(loginIpLimitKey(clientIp), {
    limit: LOGIN_IP_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
  });

  if (!result.ok) {
    logOperationalEvent("warn", "auth.login.throttled", {
      limit_scope: "ip",
      ...getLogIdentifiers(clientIp, email),
    }, createOperationalLogContext(request));
  }

  return result.ok;
}

/** Consume a separate, pseudonymous account bucket for every sign-in client. */
export async function checkCredentialLoginAccountLimit(
  email: string,
  request: Request,
): Promise<boolean> {
  const result = await rateLimit(`login-account:${hashLoginEmail(email)}`, {
    limit: LOGIN_ACCOUNT_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
  });

  if (!result.ok) {
    logOperationalEvent("warn", "auth.login.throttled", {
      limit_scope: "account",
      ...getLogIdentifiers(getIp(request), email),
    }, createOperationalLogContext(request));
  }

  return result.ok;
}

export async function authorizeCredentials(
  credentials: Partial<Record<string, unknown>>,
  request: Request,
  options: { ipLimitAlreadyChecked?: boolean } = {},
) {
  const parsed = credentialLoginSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const { email, password } = parsed.data;
  if (!options.ipLimitAlreadyChecked && !(await checkCredentialLoginIpLimit(request, email))) {
    throw new CredentialLoginRateLimitError();
  }
  if (!(await checkCredentialLoginAccountLimit(email, request))) {
    throw new CredentialLoginRateLimitError();
  }

  const clientIp = getIp(request);
  const logContext = createOperationalLogContext(request);
  const logIdentifiers = getLogIdentifiers(clientIp, email);

  try {
    const user = await db.user.findUnique({ where: { email } });
    if (!user?.password || user.deletionRequestedAt) {
      logOperationalEvent("warn", "auth.login.rejected", {
        reason: "invalid_credentials",
        ...logIdentifiers,
      }, logContext);
      return null;
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      logOperationalEvent("warn", "auth.login.rejected", {
        reason: "invalid_credentials",
        ...logIdentifiers,
      }, logContext);
      return null;
    }

    logOperationalEvent("info", "auth.login.succeeded", {
      role: user.role,
      ...logIdentifiers,
    }, logContext);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.avatar,
      role: user.role,
      emailVerified: user.emailVerified,
      tokenVersion: user.tokenVersion,
    };
  } catch (error) {
    const summary = getSafeErrorSummary(error);
    logOperationalEvent("error", "auth.login.processing_failed", {
      error_name: summary.name,
      ...(summary.code ? { error_code: summary.code } : {}),
      ...(summary.status ? { error_status: summary.status } : {}),
      ...logIdentifiers,
    }, logContext);
    throw new Error("Authentication service unavailable. Try again shortly.");
  }
}
