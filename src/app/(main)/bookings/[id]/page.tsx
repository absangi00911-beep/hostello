import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatPrice, getInitials } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import {
  CalendarDays, MapPin, CreditCard,
  CheckCircle2, Clock, XCircle,
} from "lucide-react";
import { CancelBookingButton }    from "@/components/features/booking/cancel-booking-button";
import { RetryPaymentButton }     from "@/components/features/booking/retry-payment-button";
import { OwnerBookingActions }    from "@/components/features/booking/owner-booking-actions";

export const metadata: Metadata = { title: "Booking" };

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_UI = {
  PENDING:   { label: "Pending owner confirmation", icon: Clock,         cls: "text-amber-700  bg-amber-50  border-amber-200"  },
  CONFIRMED: { label: "Confirmed",                  icon: CheckCircle2,  cls: "text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border-[var(--color-brand-100)]" },
  CANCELLED: { label: "Cancelled",                  icon: XCircle,       cls: "text-red-700    bg-red-50    border-red-200"    },
  COMPLETED: { label: "Completed",                  icon: CheckCircle2,  cls: "text-[var(--color-muted)] bg-[var(--color-ground)] border-[var(--color-border)]" },
};

export default async function BookingDetailPage({ params }: PageProps) {
  const { id }    = await params;
  const session   = await auth();
  if (!session)   redirect("/login");

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      hostel: {
        select: {
          id: true, name: true, slug: true,
          coverImage: true, city: true, area: true, address: true,
          ownerId: true,
          owner: { select: { name: true, phone: true, avatar: true } },
        },
      },
      user: {
        select: { id: true, name: true, email: true, phone: true, avatar: true },
      },
    },
  });

  if (!booking) notFound();

  const isStudent = booking.userId       === session.user.id;
  const isOwner   = booking.hostel.ownerId === session.user.id;
  const isAdmin   = session.user.role    === "ADMIN";

  if (!isStudent && !isOwner && !isAdmin) notFound();

  const status  = STATUS_UI[booking.status as keyof typeof STATUS_UI] ?? STATUS_UI.PENDING;
  const shortId = booking.id.slice(-8).toUpperCase();

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-lg px-4 sm:px-6">

        {/* Back link */}
        <div className="py-6">
          <Link
            href={isOwner && !isStudent ? "/dashboard" : "/bookings"}
            className="text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            ← {isOwner && !isStudent ? "Dashboard" : "My bookings"}
          </Link>
        </div>

        {/* Status header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${status.cls}`}>
            <status.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
              Booking #{shortId}
            </p>
            <p className="text-base font-extrabold text-[var(--color-ink)]" style={{ fontFamily: "var(--font-display)" }}>
              {status.label}
            </p>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">

          {/* Hostel image */}
          {booking.hostel.coverImage && (
            <div className="relative h-44">
              <Image
                src={booking.hostel.coverImage}
                alt={booking.hostel.name}
                fill sizes="560px"
                className="object-cover"
              />
            </div>
          )}

          <div className="p-6 space-y-5">

            {/* Hostel name */}
            <div>
              <Link
                href={`/hostels/${booking.hostel.slug}`}
                className="text-lg font-extrabold text-[var(--color-ink)] hover:text-[var(--color-brand-700)] transition-colors"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {booking.hostel.name}
              </Link>
              <div className="flex items-center gap-1.5 text-sm text-[var(--color-muted)] mt-1">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {booking.hostel.area ? `${booking.hostel.area}, ` : ""}
                {booking.hostel.city}
              </div>
            </div>

            <div className="border-t border-[var(--color-border)]" />

            {/* Dates */}
            <Row icon={CalendarDays}>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                {booking.months} month{booking.months !== 1 ? "s" : ""} ·{" "}
                {booking.guests} guest{booking.guests !== 1 ? "s" : ""}
              </p>
            </Row>

            {/* Payment */}
            <Row icon={CreditCard}>
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {formatPrice(booking.total)}
              </p>
              <p className="text-xs text-[var(--color-muted)] mt-0.5 capitalize">
                via {booking.paymentMethod ?? "—"} ·{" "}
                <span className={booking.paymentStatus === "PAID" ? "text-[var(--color-brand-700)]" : "text-amber-600"}>
                  {booking.paymentStatus === "PAID" ? "Paid" : "Pending payment"}
                </span>
              </p>
            </Row>

            {/* Student info — shown to owner */}
            {(isOwner || isAdmin) && (
              <>
                <div className="border-t border-[var(--color-border)]" />
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--color-ink)] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {booking.user.avatar
                      ? <Image src={booking.user.avatar} alt={booking.user.name} width={36} height={36} className="rounded-xl object-cover" />
                      : getInitials(booking.user.name)
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{booking.user.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">{booking.user.email}</p>
                    {booking.user.phone && (
                      <a
                        href={`tel:${booking.user.phone}`}
                        className="text-xs font-semibold text-[var(--color-brand-700)] hover:underline"
                      >
                        {booking.user.phone}
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Reference */}
            <div className="rounded-xl bg-[var(--color-ground)] border border-[var(--color-border)] px-4 py-3">
              <p className="text-xs text-[var(--color-muted)]">Reference</p>
              <p className="text-sm font-mono font-semibold text-[var(--color-ink)] mt-0.5 select-all">
                #{shortId}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-3">

          {/* Student — retry payment on PENDING payment */}
          {isStudent && booking.paymentStatus !== "PAID" && booking.status === "PENDING" && (
            <RetryPaymentButton bookingId={booking.id} amount={booking.total} variant="full" />
          )}

          {/* Owner — confirm/decline on PENDING */}
          {(isOwner || isAdmin) && booking.status === "PENDING" && (
            <OwnerBookingActions
              bookingId={booking.id}
              studentName={booking.user.name}
            />
          )}

          {/* Student — cancel on PENDING */}
          {isStudent && booking.status === "PENDING" && (
            <CancelBookingButton bookingId={booking.id} variant="full" />
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            <Link
              href={isOwner && !isStudent ? "/dashboard" : "/bookings"}
              className="flex-1 text-center py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-ground)] transition-colors"
            >
              {isOwner && !isStudent ? "Dashboard" : "All bookings"}
            </Link>
            <Link
              href="/hostels"
              className="flex-1 text-center py-2.5 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] transition-colors"
            >
              Browse hostels
            </Link>
          </div>
        </div>

        <p className="mt-5 text-xs text-center text-[var(--color-muted)]">
          Questions?{" "}
          <a href="mailto:support@hostello.pk" className="underline hover:text-[var(--color-ink)]">
            support@hostello.pk
          </a>
        </p>
      </div>
    </div>
  );
}

function Row({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-[var(--color-muted)] mt-0.5 flex-shrink-0" />
      <div>{children}</div>
    </div>
  );
}
