// Path: src/app/booking/[id]/review/page.tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { BookingStepLayout } from "@/components/booking/BookingStepLayout";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

async function getBooking(id: string, userId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/bookings/${id}`, {
      cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = await res.json();
    // Guard: only the booking owner can view this
    if (json.data?.userId !== userId) return null;
    return json.data;
  } catch {
    return null;
  }
}

export default async function ReviewBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const booking = await getBooking(id, session.user.id);

  if (!booking) notFound();

  // If already paid, skip to confirmation
  if (booking.paymentStatus === "PAID" || booking.status === "CONFIRMED") {
    redirect(`/booking/${id}/confirmation`);
  }

  // If cancelled, show error and link back
  if (booking.status === "CANCELLED") {
    return (
      <BookingStepLayout step={1} backHref={`/hostels/${booking.hostel.slug}`}>
        <div className="text-center py-12 space-y-4">
          <p className="text-[var(--text-h5)] font-[600] text-[var(--color-error)]">
            This booking was cancelled
          </p>
          <Link
            href={`/hostels/${booking.hostel.slug}`}
            className="inline-flex h-10 items-center px-5 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)] hover:bg-[var(--color-action-dark)] transition-colors duration-[var(--transition-base)]"
          >
            Back to hostel
          </Link>
        </div>
      </BookingStepLayout>
    );
  }

  return (
    <BookingStepLayout
      step={1}
      backHref={`/hostels/${booking.hostel.slug}`}
    >
      {/* Heading */}
      <div className="mb-6">
        <h1
          className="text-[var(--text-h3)] font-[700] text-[var(--color-text-heading)] mb-1"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Review your booking
        </h1>
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
          Check the details before proceeding to payment.
        </p>
      </div>

      {/* Booking summary card */}
      <BookingSummaryCard booking={booking} />

      {/* Cancellation policy */}
      <div className="mt-5 rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)] border border-[var(--color-border-subtle)] px-4 py-3 space-y-1">
        <p className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]">
          Cancellation policy
        </p>
        <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] leading-relaxed">
          You can cancel this booking before the owner confirms it. After
          confirmation, cancellations are subject to the hostel's terms.
        </p>
      </div>

      {/* Trust indicators */}
      <div className="mt-4 flex items-start gap-2.5">
        <ShieldCheck
          size={16}
          strokeWidth={1.5}
          className="text-[var(--color-action)] mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
          Payment is processed securely via Safepay. HostelLo never stores
          your card details.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-8">
        <Link
          href={`/booking/${id}/payment`}
          className="inline-flex w-full items-center justify-center gap-2 h-12 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body)] font-[600] text-[var(--color-text-inverse)] transition-all duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)] active:bg-[var(--color-action-pressed)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[var(--color-action-light)] focus-visible:outline-offset-2"
        >
          Confirm and pay
          <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>
    </BookingStepLayout>
  );
}