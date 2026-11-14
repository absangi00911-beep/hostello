import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ verifySignature: vi.fn(), verifyUpstash: vi.fn() }));
vi.mock("@/lib/safepay", () => ({ verifyWebhookSignature: mocks.verifySignature }));
vi.mock("@/lib/verify-upstash", () => ({ verifyUpstashRequest: mocks.verifyUpstash }));

import {
  MAX_EVENT_ID_LENGTH,
  MAX_ORDER_ID_LENGTH,
  MAX_QUEUED_BODY_BYTES,
  MAX_TRACKER_LENGTH,
  MAX_WEBHOOK_BODY_BYTES,
  authenticateQueuedSafepayRequest,
  authenticateSafepayWebhook,
} from "@/lib/safepay-webhook-auth";

const MERCHANT_KEY = "merchant-key-123";

const incoming = (body: string, headers: Record<string, string> = { "x-sfpy-signature": "sig" }) =>
  new NextRequest("https://hostello.test/api/payment/webhook", { method: "POST", body, headers });
const queued = (body: string | null) =>
  new NextRequest("https://hostello.test/api/payment/webhook", {
    method: "POST",
    ...(body === null ? {} : { body }),
    headers: { "upstash-signature": "jwt" },
  });

const event = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    type: "payment.succeeded",
    merchant_api_key: MERCHANT_KEY,
    data: { tracker: "track_1", metadata: { order_id: "order_1" } },
    ...overrides,
  });

async function failure(promise: Promise<{ ok: boolean; response?: Response }>) {
  const result = await promise;
  expect(result.ok).toBe(false);
  return { status: result.response!.status, body: await result.response!.json() };
}

beforeEach(() => {
  vi.stubEnv("SAFEPAY_API_KEY", MERCHANT_KEY);
  mocks.verifySignature.mockReset().mockResolvedValue(true);
  mocks.verifyUpstash.mockReset().mockResolvedValue(true);
});
afterEach(() => vi.unstubAllEnvs());

describe("authenticateSafepayWebhook", () => {
  it("accepts a signed event with the right merchant key and returns the exact raw body", async () => {
    const body = event();
    const result = await authenticateSafepayWebhook(incoming(body));

    expect(result).toMatchObject({ ok: true, rawBody: body });
    expect(result.ok && result.event.type).toBe("payment.succeeded");
    expect(mocks.verifySignature).toHaveBeenCalledWith(body, "sig");
  });

  it("verifies the signature over the raw bytes, with an empty signature when the header is missing", async () => {
    mocks.verifySignature.mockResolvedValue(false);
    const body = event();

    expect(await failure(authenticateSafepayWebhook(incoming(body, {})))).toEqual({
      status: 401,
      body: { error: "Invalid signature." },
    });
    expect(mocks.verifySignature).toHaveBeenCalledWith(body, "");
  });

  it("rejects before anything else is looked at when the signature is wrong", async () => {
    mocks.verifySignature.mockResolvedValue(false);
    // Not JSON and the wrong merchant key: the signature must still be the first failure.
    expect((await failure(authenticateSafepayWebhook(incoming("not json")))).body.error).toBe("Invalid signature.");
    expect(
      (await failure(authenticateSafepayWebhook(incoming(event({ merchant_api_key: "wrong" }))))).body.error,
    ).toBe("Invalid signature.");
  });

  it("rejects oversized bodies without verifying anything, and does not hang on a streamed one", async () => {
    // No Content-Length is declared, so the size is only discovered while reading. Reading
    // a clone of the request used to hang here: cancelling one branch of a tee'd stream
    // never completes while the other is unread.
    const huge = "x".repeat(MAX_WEBHOOK_BODY_BYTES + 1);
    const { status } = await failure(authenticateSafepayWebhook(incoming(huge)));

    expect(status).toBe(413);
    expect(mocks.verifySignature).not.toHaveBeenCalled();
  }, 2000);

  it("rejects a declared oversized body immediately from its Content-Length", async () => {
    const { status } = await failure(
      authenticateSafepayWebhook(
        incoming("{}", { "x-sfpy-signature": "sig", "content-length": String(MAX_WEBHOOK_BODY_BYTES + 1) }),
      ),
    );
    expect(status).toBe(413);
    expect(mocks.verifySignature).not.toHaveBeenCalled();
  }, 2000);

  it("rejects a signed body that is not a JSON object", async () => {
    for (const body of ["not json", "[]", "null", '"text"', "42", ""]) {
      expect(await failure(authenticateSafepayWebhook(incoming(body)))).toEqual({
        status: 400,
        body: { error: "Invalid webhook event." },
      });
    }
  });

  it("rejects a wrong, missing or non-string merchant key, and fails closed when none is configured", async () => {
    for (const merchant_api_key of ["wrong", "", undefined, 123, null]) {
      expect(await failure(authenticateSafepayWebhook(incoming(event({ merchant_api_key }))))).toEqual({
        status: 401,
        body: { error: "Merchant key mismatch." },
      });
    }
    vi.stubEnv("SAFEPAY_API_KEY", "");
    expect((await failure(authenticateSafepayWebhook(incoming(event({ merchant_api_key: "" }))))).status).toBe(401);
  });

  it("rejects over-long order IDs and trackers", async () => {
    const longOrder = event({ data: { metadata: { order_id: "o".repeat(MAX_ORDER_ID_LENGTH + 1) } } });
    const longTracker = event({ data: { tracker: "t".repeat(MAX_TRACKER_LENGTH + 1) } });

    for (const body of [longOrder, longTracker]) {
      expect(await failure(authenticateSafepayWebhook(incoming(body)))).toEqual({
        status: 400,
        body: { error: "Invalid webhook event." },
      });
    }
  });

  it("accepts values exactly at the length limits", async () => {
    const body = event({
      data: { tracker: "t".repeat(MAX_TRACKER_LENGTH), metadata: { order_id: "o".repeat(MAX_ORDER_ID_LENGTH) } },
    });
    expect((await authenticateSafepayWebhook(incoming(body))).ok).toBe(true);
  });
});

describe("authenticateQueuedSafepayRequest", () => {
  it("accepts a signed delivery naming a stored event", async () => {
    const result = await authenticateQueuedSafepayRequest(queued(JSON.stringify({ eventId: "evt_1" })));

    expect(result).toEqual({ ok: true, eventId: "evt_1" });
    expect(mocks.verifyUpstash).toHaveBeenCalledWith(expect.anything(), {
      acceptBearerToken: false,
      body: JSON.stringify({ eventId: "evt_1" }),
    });
  });

  it("never accepts the shared cron secret in place of a QStash signature", async () => {
    await authenticateQueuedSafepayRequest(queued(JSON.stringify({ eventId: "evt_1" })));
    expect(mocks.verifyUpstash.mock.calls[0][1].acceptBearerToken).toBe(false);
  });

  it("rejects an unverifiable delivery before reading its contents", async () => {
    mocks.verifyUpstash.mockRejectedValue(new Error("bad signature"));

    expect(await failure(authenticateQueuedSafepayRequest(queued(JSON.stringify({ eventId: "evt_1" }))))).toEqual({
      status: 401,
      body: { error: "Unauthorized" },
    });
  });

  it("rejects oversized bodies before verifying", async () => {
    const { status } = await failure(
      authenticateQueuedSafepayRequest(queued("x".repeat(MAX_QUEUED_BODY_BYTES + 1))),
    );
    expect(status).toBe(413);
    expect(mocks.verifyUpstash).not.toHaveBeenCalled();
  });

  it("rejects a signed body that does not name a valid event ID", async () => {
    const bodies = [
      "",
      "not json",
      "[]",
      "null",
      JSON.stringify({}),
      JSON.stringify({ eventId: "" }),
      JSON.stringify({ eventId: 7 }),
      JSON.stringify({ eventId: "e".repeat(MAX_EVENT_ID_LENGTH + 1) }),
      JSON.stringify([{ eventId: "evt_1" }]),
    ];
    for (const body of bodies) {
      expect(await failure(authenticateQueuedSafepayRequest(queued(body)))).toEqual({
        status: 400,
        body: { error: "Invalid queued event." },
      });
    }
  });

  it("treats a delivery with no body as an empty body", async () => {
    expect((await failure(authenticateQueuedSafepayRequest(queued(null)))).body.error).toBe("Invalid queued event.");
    expect(mocks.verifyUpstash).toHaveBeenCalledWith(expect.anything(), { acceptBearerToken: false, body: "" });
  });

  it("accepts an event ID exactly at the limit", async () => {
    const eventId = "e".repeat(MAX_EVENT_ID_LENGTH);
    expect(await authenticateQueuedSafepayRequest(queued(JSON.stringify({ eventId })))).toEqual({ ok: true, eventId });
  });
});
