import { afterEach, describe, expect, it, vi } from "vitest";
import { refundPayment } from "./safepay";

describe("refundPayment", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends the documented payload and accepts only a full refund state", async () => {
    vi.stubEnv("NEXT_PUBLIC_SAFEPAY_ENV", "sandbox");
    vi.stubEnv("SAFEPAY_SECRET", "test-secret");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { tracker: { state: "TRACKER_REFUNDED" } } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await refundPayment({ transactionId: "track_123", amount: 45000 });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://sandbox.api.getsafepay.com/order/payments/v3/track_123/refund",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ amount: 4500000, currency: "PKR" }),
      }),
    );
    expect(result).toMatchObject({ success: true, state: "TRACKER_REFUNDED" });
  });

  it("does not accept partial, pending, or undocumented 2xx responses as completed", async () => {
    vi.stubEnv("NEXT_PUBLIC_SAFEPAY_ENV", "sandbox");
    vi.stubEnv("SAFEPAY_SECRET", "test-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { tracker: { state: "TRACKER_PARTIAL_REFUND" } } }),
      }),
    );

    await expect(refundPayment({ transactionId: "track_123", amount: 45000 })).rejects.toThrow(
      "did not confirm a full refund",
    );
  });

  it("rejects a successful HTTP response with no recognizable tracker state", async () => {
    vi.stubEnv("NEXT_PUBLIC_SAFEPAY_ENV", "sandbox");
    vi.stubEnv("SAFEPAY_SECRET", "test-secret");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "success" }) }));

    await expect(refundPayment({ transactionId: "track_123", amount: 45000 })).rejects.toThrow(
      "tracker state: unknown",
    );
  });
});
