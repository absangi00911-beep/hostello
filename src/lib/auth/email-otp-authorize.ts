import { getSafeErrorSummary } from "@/lib/safe-error";
import { z } from "zod";
import { db } from "@/lib/db";
import { getIp, rateLimit } from "@/lib/rate-limit";
import { hashOneTimeToken } from "@/lib/one-time-token";
import {
  createOperationalLogContext,
  hashOperationalIdentifier,
  logOperationalEvent,
} from "@/lib/operational-logger";
import {
  emailLoginGrantIdentifier,
  hashEmailLoginIdentifier,
  normalizeLoginEmail,
} from "@/lib/auth/email-otp";

const emailOtpCredentialsSchema = z.object({
  email: z.string().email().max(254),
  grant: z.string().regex(/^[a-f0-9]{64}$/i),
  name: z.string().trim().min(2).max(80).optional(),
});

const EMAIL_OTP_WINDOW_MS = 15 * 60 * 1000;

export class EmailOtpRateLimitError extends Error {
  constructor() {
    super("Too many login attempts. Please wait a few minutes and try again.");
    this.name = "EmailOtpRateLimitError";
  }
}

function getLogIdentifiers(clientIp: string, email: string) {
  return {
    principal_hash: hashOperationalIdentifier(`login:${email}`),
    ip_hash: hashOperationalIdentifier(`ip:${clientIp}`),
  };
}

export async function authorizeEmailOtp(
  credentials: Partial<Record<string, unknown>>,
  request: Request,
) {
  const parsed = emailOtpCredentialsSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const email = normalizeLoginEmail(parsed.data.email);
  const clientIp = getIp(request);
  const logContext = createOperationalLogContext(request);
  const logIdentifiers = getLogIdentifiers(clientIp, email);

  const ipLimit = await rateLimit(`email-otp-login-ip:${clientIp}`, {
    limit: 10,
    windowMs: EMAIL_OTP_WINDOW_MS,
  });
  if (!ipLimit.ok) {
    logOperationalEvent("warn", "auth.login.throttled", {
      limit_scope: "ip",
      ...logIdentifiers,
    }, logContext);
    throw new EmailOtpRateLimitError();
  }

  const accountLimit = await rateLimit(
    `email-otp-login-account:${hashEmailLoginIdentifier(email)}`,
    { limit: 5, windowMs: EMAIL_OTP_WINDOW_MS },
  );
  if (!accountLimit.ok) {
    logOperationalEvent("warn", "auth.login.throttled", {
      limit_scope: "account",
      ...logIdentifiers,
    }, logContext);
    throw new EmailOtpRateLimitError();
  }

  try {
    const now = new Date();
    const user = await db.$transaction(async (tx) => {
      const claimed = await tx.verificationToken.deleteMany({
        where: {
          identifier: emailLoginGrantIdentifier(email),
          token: hashOneTimeToken(parsed.data.grant),
          expires: { gt: now },
        },
      });
      if (claimed.count !== 1) return null;

      const existing = await tx.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          emailVerified: true,
          tokenVersion: true,
          deletionRequestedAt: true,
        },
      });

      if (existing) {
        if (existing.deletionRequestedAt) return null;

        return tx.user.update({
          where: { id: existing.id },
          data: { emailVerified: existing.emailVerified ?? now },
        });
      }

      if (!parsed.data.name) return null;

      return tx.user.create({
        data: {
          email,
          name: parsed.data.name,
          role: "STUDENT",
          emailVerified: now,
        },
      });
    });

    if (!user || user.deletionRequestedAt) {
      logOperationalEvent("warn", "auth.login.rejected", {
        reason: "invalid_email_otp",
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
