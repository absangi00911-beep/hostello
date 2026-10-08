import { hashOneTimeToken } from "@/lib/one-time-token";

/** Hash a high-entropy password reset token before persisting or looking it up. */
export function hashPasswordResetToken(token: string): string {
  return hashOneTimeToken(token);
}
