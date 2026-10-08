import { createHash, createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { verifyUpstashRequest } from "./verify-upstash";

const currentKey = "current-test-signing-key";
const nextKey = "next-test-signing-key";
const url = "https://hostello.pk/api/cron/cleanup-tokens";

function makeSignature(body: string, signingKey: string, targetUrl = url): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(JSON.stringify({
    iss: "Upstash",
    sub: targetUrl,
    exp: now + 60,
    nbf: now - 1,
    iat: now,
    jti: "jwt_test_signature",
    body: createHash("sha256").update(body).digest("base64url"),
  })).toString("base64url");
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", signingKey).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

function request(body = "") {
  return new NextRequest(url, {
    method: "POST",
    headers: { "upstash-signature": makeSignature(body, currentKey) },
    body,
  });
}

afterEach(() => {
  delete process.env.CRON_SECRET;
  delete process.env.QSTASH_CURRENT_SIGNING_KEY;
  delete process.env.QSTASH_NEXT_SIGNING_KEY;
});

describe("verifyUpstashRequest", () => {
  it("validates QStash JWT, endpoint URL, and raw body", async () => {
    process.env.QSTASH_CURRENT_SIGNING_KEY = currentKey;
    process.env.QSTASH_NEXT_SIGNING_KEY = nextKey;
    await expect(verifyUpstashRequest(request("{}"))).resolves.toBe(true);
  });

  it("rejects a signed request whose URL or raw body was changed", async () => {
    process.env.QSTASH_CURRENT_SIGNING_KEY = currentKey;
    process.env.QSTASH_NEXT_SIGNING_KEY = nextKey;
    const wrongUrlRequest = new NextRequest(url, {
      method: "POST",
      headers: { "upstash-signature": makeSignature("{}", currentKey, "https://attacker.example/api/cron/cleanup-tokens") },
      body: "{}",
    });
    const wrongBodyRequest = new NextRequest(url, {
      method: "POST",
      headers: { "upstash-signature": makeSignature("signed-body", currentKey) },
      body: "changed-body",
    });

    await expect(verifyUpstashRequest(wrongUrlRequest)).rejects.toThrow("Request verification failed");
    await expect(verifyUpstashRequest(wrongBodyRequest)).rejects.toThrow("Request verification failed");
  });

  it("accepts the next signing key during key rotation", async () => {
    process.env.QSTASH_CURRENT_SIGNING_KEY = "old-current-key";
    process.env.QSTASH_NEXT_SIGNING_KEY = nextKey;
    const rotatedRequest = new NextRequest(url, {
      method: "POST",
      headers: { "upstash-signature": makeSignature("{}", nextKey) },
      body: "{}",
    });

    await expect(verifyUpstashRequest(rotatedRequest)).resolves.toBe(true);
  });

  it("rejects invalid signatures and raw-body HMACs", async () => {
    process.env.QSTASH_CURRENT_SIGNING_KEY = currentKey;
    process.env.QSTASH_NEXT_SIGNING_KEY = nextKey;
    const body = "{}";
    const rawBodyHmac = createHmac("sha256", currentKey).update(body).digest("base64");
    const invalidRequest = new NextRequest(url, {
      method: "POST",
      headers: { "upstash-signature": rawBodyHmac },
      body,
    });

    await expect(verifyUpstashRequest(invalidRequest)).rejects.toThrow("Request verification failed");
  });

  it("accepts the configured Bearer secret as a fallback", async () => {
    process.env.CRON_SECRET = "test-cron-secret";
    const bearerRequest = new NextRequest(url, {
      method: "POST",
      headers: { authorization: "Bearer test-cron-secret" },
    });

    await expect(verifyUpstashRequest(bearerRequest)).resolves.toBe(true);
  });

  it("does not accept a bad Bearer token without a valid QStash signature", async () => {
    process.env.CRON_SECRET = "test-cron-secret";
    const bearerRequest = new NextRequest(url, {
      method: "POST",
      headers: { authorization: "Bearer wrong-secret" },
    });

    await expect(verifyUpstashRequest(bearerRequest)).rejects.toThrow("Request verification failed");
  });

  it("does not let a valid Bearer token bypass an invalid QStash signature", async () => {
    process.env.CRON_SECRET = "test-cron-secret";
    process.env.QSTASH_CURRENT_SIGNING_KEY = currentKey;
    process.env.QSTASH_NEXT_SIGNING_KEY = nextKey;
    const invalidSignedRequest = new NextRequest(url, {
      method: "POST",
      headers: {
        authorization: "Bearer test-cron-secret",
        "upstash-signature": "not-a-jwt",
      },
      body: "{}",
    });

    await expect(verifyUpstashRequest(invalidSignedRequest)).rejects.toThrow("Request verification failed");
  });
});
