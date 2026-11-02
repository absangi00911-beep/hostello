import { redirect } from "next/navigation";

// Payment providers return here (see /api/payment/callback). The booking
// detail page owns the actual payment-state messaging.
export default async function BookingPaymentReturnRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string | string[] }>;
}) {
  const { id } = await params;
  const { payment } = await searchParams;
  const query =
    typeof payment === "string" && /^[a-z-]{1,24}$/.test(payment)
      ? `?payment=${payment}`
      : "";

  redirect(`/bookings/${encodeURIComponent(id)}${query}`);
}
