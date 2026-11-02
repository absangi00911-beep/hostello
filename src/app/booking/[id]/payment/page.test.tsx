import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: (destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  },
}));

import BookingPaymentReturnRoute from "./page";

function run(id: string, payment?: string) {
  return BookingPaymentReturnRoute({
    params: Promise.resolve({ id }),
    searchParams: Promise.resolve(payment ? { payment } : {}),
  });
}

describe("BookingPaymentReturnRoute", () => {
  it("forwards the payment state to the booking page", async () => {
    await expect(run("b1", "failed")).rejects.toThrow(
      "NEXT_REDIRECT:/bookings/b1?payment=failed",
    );
  });

  it("drops unexpected payment values", async () => {
    await expect(run("b1", "<script>")).rejects.toThrow(
      "NEXT_REDIRECT:/bookings/b1",
    );
  });

  it("encodes the booking id", async () => {
    await expect(run("a/b")).rejects.toThrow("NEXT_REDIRECT:/bookings/a%2Fb");
  });
});
