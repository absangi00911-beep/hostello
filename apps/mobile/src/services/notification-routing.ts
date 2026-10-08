export type NotificationDestination =
  | { kind: "conversation"; conversationId: string }
  | { kind: "messages" }
  | { kind: "bookings" }
  | { kind: "notifications" };

const SAFE_ID = /^[a-zA-Z0-9_-]{1,128}$/;

/** Resolve only known in-app destinations from backend notification data. */
export function getNotificationDestination(
  data: Record<string, unknown>,
): NotificationDestination {
  const type = typeof data.type === "string" ? data.type : "";

  if (type === "MESSAGE_RECEIVED") {
    const conversationId = data.conversationId;
    return typeof conversationId === "string" && SAFE_ID.test(conversationId)
      ? { kind: "conversation", conversationId }
      : { kind: "messages" };
  }

  if (type.startsWith("BOOKING_")) return { kind: "bookings" };

  return { kind: "notifications" };
}
