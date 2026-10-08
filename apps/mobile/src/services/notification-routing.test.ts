import { describe, expect, it } from "vitest";
import { getNotificationDestination } from "./notification-routing";

describe("getNotificationDestination", () => {
  it("opens the exact conversation for a message push", () => {
    expect(
      getNotificationDestination({
        type: "MESSAGE_RECEIVED",
        conversationId: "conv_123",
      }),
    ).toEqual({ kind: "conversation", conversationId: "conv_123" });
  });

  it("falls back to the messages list for older message pushes", () => {
    expect(getNotificationDestination({ type: "MESSAGE_RECEIVED" })).toEqual({
      kind: "messages",
    });
  });

  it("sends booking notifications to bookings", () => {
    expect(
      getNotificationDestination({ type: "BOOKING_CONFIRMED", bookingId: "b1" }),
    ).toEqual({ kind: "bookings" });
  });

  it("does not interpret arbitrary push values as routes", () => {
    expect(
      getNotificationDestination({ type: "UNKNOWN", url: "https://example.com" }),
    ).toEqual({ kind: "notifications" });
    expect(
      getNotificationDestination({
        type: "MESSAGE_RECEIVED",
        conversationId: "../../login",
      }),
    ).toEqual({ kind: "messages" });
  });
});
