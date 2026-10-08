export type PaymentOutcome =
  | "checking"
  | "paid"
  | "paid_cancelled"
  | "refunded"
  | "cancelled"
  | "failed";

const MAX_PAYMENT_RETURN_URL_LENGTH = 2_048;
const MAX_BOOKING_ID_LENGTH = 64;

export function parsePaymentReturnBookingId(url: string): string | null {
  if (url.length > MAX_PAYMENT_RETURN_URL_LENGTH) return null;

  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "hostello:" ||
      parsed.hostname !== "payment" ||
      parsed.pathname !== "/return"
    ) {
      return null;
    }

    const bookingIds = parsed.searchParams.getAll("bookingId");
    if (bookingIds.length !== 1) return null;

    const bookingId = bookingIds[0];
    return bookingId.length > 0 && bookingId.length <= MAX_BOOKING_ID_LENGTH
      ? bookingId
      : null;
  } catch {
    return null;
  }
}

export function resolvePaymentOutcome(snapshot: {
  paymentStatus: string;
  bookingStatus: string;
}): PaymentOutcome {
  if (snapshot.paymentStatus === "PAID") {
    return snapshot.bookingStatus === "CANCELLED" ? "paid_cancelled" : "paid";
  }
  if (snapshot.paymentStatus === "REFUNDED") return "refunded";
  if (snapshot.bookingStatus === "CANCELLED") return "cancelled";
  if (snapshot.paymentStatus === "FAILED") return "failed";
  return "checking";
}
