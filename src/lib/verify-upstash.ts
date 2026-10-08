/** Verify requests delivered by Upstash QStash. */

import { Receiver } from "@upstash/qstash";
import { timingSafeEqual } from "node:crypto";
import { type NextRequest } from "next/server";

interface VerifyOptions {
  /** Accept the shared CRON_SECRET Bearer credential as a fallback. */
  acceptBearerToken?: boolean;
}

function hasValidBearerToken(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || !authorization) return false;

  const provided = Buffer.from(authorization);
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
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
  const { acceptBearerToken = true } = options;
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
      const isValid = await receiver.verify({
        signature,
        body: await request.clone().text(),
        url: request.url,
        upstashRegion: request.headers.get("upstash-region") ?? undefined,
      });

      if (isValid) return true;
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
