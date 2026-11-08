/** Verify requests delivered by Upstash QStash. */

import { Receiver } from "@upstash/qstash";
import { type NextRequest } from "next/server";
import { safeSecretEqual } from "@/lib/secret-compare";

interface VerifyOptions {
  /**
   * Accept the shared CRON_SECRET Bearer credential as a fallback.
   * Off by default: each caller must opt in explicitly.
   */
  acceptBearerToken?: boolean;
  /** Raw body text already read under a caller-specific byte limit. */
  body?: string;
}

function hasValidBearerToken(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || !authorization) return false;

  // Hash-then-compare, so neither a length mismatch nor timing reveals the secret.
  return safeSecretEqual(authorization, `Bearer ${cronSecret}`);
}

/**
 * Verify a QStash-signed JWT, including its endpoint URL, validity window, and
 * raw-body hash. A static Bearer secret remains available for manual/legacy
 * schedulers when explicitly enabled by the caller.
 */
export async function verifyUpstashRequest(
  request: NextRequest,
  options: VerifyOptions = {},
): Promise<true> {
  const { acceptBearerToken = false } = options;
  const signature = request.headers.get("upstash-signature");
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

  if (signature && currentSigningKey && nextSigningKey) {
    try {
      const receiver = new Receiver({
        currentSigningKey,
        nextSigningKey,
        devMode: false,
      });
      const body = options.body ?? await request.clone().text();
      const isValid = await receiver.verify({
        signature,
        body,
        url: request.url,
        upstashRegion: request.headers.get("upstash-region") ?? undefined,
      });

      // `verify` throws on failure today; treat a false result the same way so
      // a library change can never turn a bad signature into the Bearer path.
      if (!isValid) throw new Error("Request verification failed");
      return true;
    } catch {
      // A present but invalid QStash signature must not fall back to a static token.
      throw new Error("Request verification failed");
    }
  }

  if (acceptBearerToken && hasValidBearerToken(request)) return true;
  throw new Error("Request verification failed");
}

/** Get non-secret request metadata for diagnostics. */
export function getUpstashMetadata(request: NextRequest) {
  return {
    signature: request.headers.get("upstash-signature") ? "✓ Present" : "✗ Missing",
    authorization: request.headers.get("authorization") ? "✓ Present" : "✗ Missing",
    id: request.headers.get("upstash-request-id") || "N/A",
    deliveryAttempt: request.headers.get("upstash-delivery-attempt") || "1",
  };
}
