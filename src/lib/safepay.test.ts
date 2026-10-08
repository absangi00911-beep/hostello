import { afterEach, describe, expect, it, vi } from "vitest";
import { createCheckoutSession, toSafepayMinorUnits } from "./safepay";

describe("Safepay currency boundary", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("converts whole PKR amounts to paisas and rejects invalid money values", () => {
    expect(toSafepayMinorUnits(12000)).toBe(1_200_000);
    expect(() => toSafepayMinorUnits(1.5)).toThrow("positive whole-PKR");
    expect(() => toSafepayMinorUnits(0)).toThrow("positive whole-PKR");
  });

  it("creates a v3 session in paisas and constructs the documented hosted checkout URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SAFEPAY_ENV", "sandbox");
    vi.stubEnv("SAFEPAY_SECRET", "test-secret");
    vi.stubEnv("SAFEPAY_API_KEY", "sec_test-public-key");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { tracker: { token: "track_test" } } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: "short-lived-auth" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createCheckoutSession({
      bookingId: "booking-1",
      amount: 12000,
      orderId: "booking-1",
      customerEmail: "ali@example.com",
      customerName: "Ali Khan",
      appUrl: "https://hostello.test",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://sandbox.api.getsafepay.com/order/payments/v3/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          merchant_api_key: "sec_test-public-key",
          intent: "CYBERSOURCE",
          mode: "payment",
          entry_mode: "raw",
          currency: "PKR",
          amount: 1_200_000,
          metadata: { order_id: "booking-1" },
          include_fees: false,
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://sandbox.api.getsafepay.com/client/passport/v1/token",
      expect.objectContaining({ method: "POST" }),
    );

    const checkout = new URL(result.redirectUrl);
    expect(checkout.origin + checkout.pathname).toBe("https://sandbox.api.getsafepay.com/embedded/");
    expect(checkout.searchParams.get("tracker")).toBe("track_test");
    expect(checkout.searchParams.get("tbt")).toBe("short-lived-auth");
    expect(checkout.searchParams.get("environment")).toBe("sandbox");
    expect(checkout.searchParams.get("order_id")).toBe("booking-1");
    expect(checkout.searchParams.get("redirect_url")).toBe(
      "https://hostello.test/booking/booking-1/confirmation?payment=return",
    );
    expect(result.token).toBe("track_test");
  });
});
