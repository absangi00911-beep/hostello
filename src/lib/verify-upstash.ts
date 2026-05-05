/**
 * Utility to verify Upstash QStash requests
 * 
 * Upstash signs all webhook requests with a signature. This helps verify
 * that requests actually came from Upstash (defense in depth).
 * 
 * We also accept Bearer token auth as a fallback.
 */

import { type NextRequest } from "next/server";
import crypto from "crypto";

interface VerifyOptions {
  /**
   * If true, will accept Authorization Bearer token as fallback
   * Set via: CRON_SECRET environment variable
   */
  acceptBearerToken?: boolean;
}

/**
 * Verify Upstash QStash request signature or Bearer token
 * @throws Error if verification fails
 */
export async function verifyUpstashRequest(
  request: NextRequest,
  options: VerifyOptions = {}
) {
  const { acceptBearerToken = true } = options;

  // Method 1: Try Bearer token verification (simpler, works with custom schedules)
  if (acceptBearerToken) {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader) {
      const { timingSafeEqual } = await import("crypto");
      const a = Buffer.from(authHeader);
      const b = Buffer.from(`Bearer ${cronSecret}`);
      if (a.length === b.length && timingSafeEqual(a, b)) {
        return true;
      }
    }
  }

  // Method 2: Try Upstash signature verification (more secure)
  const signature = request.headers.get("upstash-signature");
  const signingKey = process.env.QSTASH_CURRENT_SIGNING_KEY;

  if (!signature || !signingKey) {
    // If we couldn't verify with bearer token and don't have signature keys,
    // we need at least one method to succeed
    if (!acceptBearerToken) {
      throw new Error("Request verification failed: No valid signature provided");
    }
    // Bearer token method already failed above, so we fail here
    throw new Error(
      "Request verification failed: Invalid or missing authorization"
    );
  }

  // Verify Upstash signature
  try {
    const body = await request.clone().text();
    const hash = crypto
      .createHmac("sha256", signingKey)
      .update(body)
      .digest("base64");

    const { timingSafeEqual } = await import("crypto");
    const hashBuf = Buffer.from(hash, "base64");
    const sigBuf = Buffer.from(signature, "base64");
    if (hashBuf.length !== sigBuf.length || !timingSafeEqual(hashBuf, sigBuf)) {
      throw new Error("Invalid Upstash signature");
    }

    return true;
  } catch (error) {
    throw new Error(
      `Upstash signature verification failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get request metadata for logging
 */
export function getUpstashMetadata(request: NextRequest) {
  return {
    signature: request.headers.get("upstash-signature") ? "✓ Present" : "✗ Missing",
    authorization: request.headers.get("authorization") ? "✓ Present" : "✗ Missing",
    id: request.headers.get("upstash-request-id") || "N/A",
    deliveryAttempt: request.headers.get("upstash-delivery-attempt") || "1",
  };
}
