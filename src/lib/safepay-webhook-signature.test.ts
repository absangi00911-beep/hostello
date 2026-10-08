import { createHmac } from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyWebhookSignature } from "./safepay";

const NOW = new Date("2026-10-06T12:00:00.000Z").getTime();

function signature(payload: string, secret: string) {
  return createHmac("sha512", secret).update(payload).digest("hex");
}

describe("Safepay webhook signature verification", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("accepts a signature from the current webhook secret", async () => {
    const payload = '{"type":"payment.succeeded"}';
    vi.stubEnv("SAFEPAY_WEBHOOK_SECRET", "current-secret");

    await expect(verifyWebhookSignature(payload, signature(payload, "current-secret"))).resolves.toBe(true);
  });

  it("accepts a queued event signed by the previous secret during the explicit grace window", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const payload = '{"type":"payment.succeeded", "data":{}}';
    vi.stubEnv("SAFEPAY_WEBHOOK_SECRET", "current-secret");
    vi.stubEnv("SAFEPAY_WEBHOOK_SECRET_PREVIOUS", "previous-secret");
    vi.stubEnv("SAFEPAY_WEBHOOK_SECRET_PREVIOUS_UNTIL", "2026-10-07T12:00:00.000Z");

    await expect(verifyWebhookSignature(payload, signature(payload, "previous-secret"))).resolves.toBe(true);
  });

  it("rejects previous-secret signatures after the configured expiry", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const payload = "{}";
    vi.stubEnv("SAFEPAY_WEBHOOK_SECRET", "current-secret");
    vi.stubEnv("SAFEPAY_WEBHOOK_SECRET_PREVIOUS", "previous-secret");
    vi.stubEnv("SAFEPAY_WEBHOOK_SECRET_PREVIOUS_UNTIL", "2026-10-06T11:59:59.999Z");

    await expect(verifyWebhookSignature(payload, signature(payload, "previous-secret"))).resolves.toBe(false);
  });

  it("ignores a previous-secret window configured more than 72 hours ahead", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const payload = "{}";
    vi.stubEnv("SAFEPAY_WEBHOOK_SECRET", "current-secret");
    vi.stubEnv("SAFEPAY_WEBHOOK_SECRET_PREVIOUS", "previous-secret");
    vi.stubEnv("SAFEPAY_WEBHOOK_SECRET_PREVIOUS_UNTIL", "2026-10-10T12:00:00.001Z");

    await expect(verifyWebhookSignature(payload, signature(payload, "previous-secret"))).resolves.toBe(false);
  });

  it("ignores a previous-secret window without a canonical UTC expiry", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const payload = "{}";
    vi.stubEnv("SAFEPAY_WEBHOOK_SECRET", "current-secret");
    vi.stubEnv("SAFEPAY_WEBHOOK_SECRET_PREVIOUS", "previous-secret");
    vi.stubEnv("SAFEPAY_WEBHOOK_SECRET_PREVIOUS_UNTIL", "10/7/2026");

    await expect(verifyWebhookSignature(payload, signature(payload, "previous-secret"))).resolves.toBe(false);
  });

  it.each(["", "not-hex", "a".repeat(127), "a".repeat(130)])("rejects malformed signatures (%s)", async (sig) => {
    vi.stubEnv("SAFEPAY_WEBHOOK_SECRET", "current-secret");

    await expect(verifyWebhookSignature("{}", sig)).resolves.toBe(false);
  });
});
