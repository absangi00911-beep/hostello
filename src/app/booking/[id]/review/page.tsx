// Path: src/app/booking/[id]/review/page.tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { isBoundedRouteParam } from "@/lib/route-params";
import { BookingStepLayout } from "@/components/booking/BookingStepLayout";
import { BookingSummaryCard } from "@/components/booking/BookingSummaryCard";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_BOOKING_ID_LENGTH = 64;

export default async function ReviewBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  if (!isBoundedRouteParam(id, MAX_BOOKING_ID_LENGTH)) notFound();

  const booking = await db.booking.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
      months: true,
      guests: true,
      total: true,
      status: true,
      paymentStatus: true,
      hostel: {
        select: {
          name: true,
          slug: true,
          city: true,
          area: true,
          coverImage: true,
        },
      },
    },
  });

  if (!booking) notFound();
  const bookingSummary = {
    ...booking,
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
  };

  // If already paid, skip to confirmation
  if (booking.paymentStatus === "PAID" || booking.status === "CONFIRMED") {
    redirect(`/booking/${id}/confirmation`);
  }

  // If cancelled, show error and link back
  if (booking.status === "CANCELLED") {
    return (
      <BookingStepLayout step={1} backHref={`/hostels/${booking.hostel.slug}`}>
        <div className="text-center py-12 space-y-4">
          <p className="text-[length:var(--text-h5)] font-[600] text-[color:var(--color-error)]">
            This booking was cancelled
          </p>
          <Button asChild>
            <Link href={`/hostels/${booking.hostel.slug}`}>Back to hostel</Link>
          </Button>
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
      <div className="booking-review-heading mb-6">
        <div className="student-page-overline"><span>RESERVATION NOTES</span><span>01 / 03</span></div>
        <h1
          className="font-heading text-[length:var(--text-h3)] font-[700] text-[color:var(--color-text-heading)] mb-1"

        >
          Review your booking
        </h1>
        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
          Confirm your dates, room, guests, and total before moving to secure payment.
        </p>
      </div>

      {/* Booking summary card */}
      <BookingSummaryCard booking={bookingSummary} showPaymentHint />

      {/* Cancellation policy */}
      <div className="mt-5 rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)] border border-[var(--color-border-subtle)] px-4 py-3 space-y-1">
        <p className="text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)]">
          Cancellation policy
        </p>
        <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)] leading-relaxed">
          You can cancel this booking before the owner confirms it. After
          confirmation, cancellations are subject to the hostel's terms.
        </p>
      </div>

      {/* Trust indicators */}
      <div className="mt-4 flex items-start gap-2.5">
        <ShieldCheck
          size={16}
          strokeWidth={1.5}
          className="text-[color:var(--color-action)] mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
          Payment is processed securely via Safepay. HostelLo never stores
          your card details.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-8">
        <Button asChild className="w-full h-12 text-[length:var(--text-body)]">
          <Link href={`/booking/${id}/payment`}>
            Confirm and pay
            <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </BookingStepLayout>
  );
}
