import { createHmac, randomInt } from "node:crypto";
import { z } from "zod";

const loginEmailSchema = z.string().email().max(254);

export function normalizeLoginEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidLoginEmail(email: string): boolean {
  return loginEmailSchema.safeParse(email).success;
}

export function generateEmailOtp(): string {
  return randomInt(100_000, 1_000_000).toString();
}

export function emailOtpIdentifier(email: string): string {
  return `email-otp:${email}`;
}

export function emailLoginGrantIdentifier(email: string): string {
  return `email-login-grant:${email}`;
}

export function hashEmailOtp(email: string, code: string): string {
  return createHmac("sha256", getAuthSecret())
    .update(`${emailOtpIdentifier(email)}:${code}`)
    .digest("hex");
}

export function hashEmailLoginIdentifier(email: string): string {
  return createHmac("sha256", getAuthSecret())
    .update(`email-login:${email}`)
    .digest("hex");
}

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Authentication service unavailable.");
  return secret;
}
