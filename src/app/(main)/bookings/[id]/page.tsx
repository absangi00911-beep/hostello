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
  CONFIRMED: { label: "Confirmed",                  icon: CheckCircle2,  cls: "text-[var(--color-brand-600)] bg-[var(--color-brand-50)] border-[var(--color-brand-200)]" },
  CANCELLED: { label: "Cancelled",                  icon: XCircle,       cls: "text-red-700    bg-red-50    border-red-200"    },
  COMPLETED: { label: "Completed",                  icon: CheckCircle2,  cls: "text-[var(--color-ink-muted)] bg-[var(--color-ground)] border-[var(--color-border)]" },
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
    <div className="min-h-screen pt-20 pb-20 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-lg px-4 sm:px-6">

        {/* Back link */}
        <div className="py-8">
          <Link
            href={isOwner && !isStudent ? "/dashboard" : "/bookings"}
            className="text-base font-semibold text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors"
          >
            ← {isOwner && !isStudent ? "Dashboard" : "My bookings"}
          </Link>
        </div>

        {/* Status header */}
        <div className="flex items-center gap-4 mb-8">
          <div className={`w-12 h-12 rounded-lg border flex items-center justify-center shrink-0 ${status.cls}`}>
            <status.icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--color-ink-muted)] uppercase tracking-wide">
              Booking #{shortId}
            </p>
            <p className="text-2xl font-extrabold text-[var(--color-ink)] mt-1" style={{ fontFamily: "var(--font-display)" }}>
              {status.label}
            </p>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden shadow-card">

          {/* Hostel image */}
          {booking.hostel.coverImage && (
            <div className="relative h-48">
              <Image
                src={booking.hostel.coverImage}
                alt={booking.hostel.name}
                fill sizes="560px"
                className="object-cover"
              />
            </div>
          )}

          <div className="p-7 space-y-6">

            {/* Hostel name */}
            <div>
              <Link
                href={`/hostels/${booking.hostel.slug}`}
                className="text-xl font-extrabold text-[var(--color-ink)] hover:text-[var(--color-brand-700)] transition-colors block"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {booking.hostel.name}
              </Link>
              <div className="flex items-center gap-2 text-base text-[var(--color-ink-muted)] mt-2">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="font-medium">{booking.hostel.area ? `${booking.hostel.area}, ` : ""}{booking.hostel.city}</span>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)]" />

            {/* Dates */}
            <Row icon={CalendarDays}>
              <p className="text-base font-semibold text-[var(--color-ink)]">
                {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
              </p>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                <span className="font-medium">{booking.months} month{booking.months !== 1 ? "s" : ""}</span> · {booking.guests} guest{booking.guests !== 1 ? "s" : ""}
              </p>
            </Row>

            {/* Payment */}
            <Row icon={CreditCard}>
              <p className="text-base font-semibold text-[var(--color-ink)]">
                {formatPrice(booking.total)}
              </p>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1 capitalize">
                via {booking.paymentMethod ?? "—"} · {" "}
                <span className={booking.paymentStatus === "PAID" ? "text-[var(--color-brand-600)] font-semibold" : "text-amber-600 font-semibold"}>
                  {booking.paymentStatus === "PAID" ? "Paid" : "Pending"}
                </span>
              </p>
            </Row>

            {/* Student info — shown to owner */}
            {(isOwner || isAdmin) && (
              <>
                <div className="border-t border-[var(--color-border)]" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--color-brand-600)] text-white flex items-center justify-center text-base font-bold shrink-0">
                    {booking.user.avatar
                      ? <Image src={booking.user.avatar} alt={booking.user.name} width={48} height={48} className="rounded-lg object-cover" />
                      : getInitials(booking.user.name)
                    }
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[var(--color-ink)]">{booking.user.name}</p>
                    <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">{booking.user.email}</p>
                    {booking.user.phone && (
                      <a
                        href={`tel:${booking.user.phone}`}
                        className="text-sm font-semibold text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors"
                      >
                        {booking.user.phone}
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Reference */}
            <div className="rounded-lg bg-[var(--color-ground)] border border-[var(--color-border)] px-4 py-3">
              <p className="text-xs text-[var(--color-ink-muted)] font-bold uppercase tracking-wide">Reference</p>
              <p className="text-base font-mono font-semibold text-[var(--color-ink)] mt-2 select-all">
                #{shortId}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-7 space-y-4">

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
          <div className="flex gap-3 pt-3">
            <Link
              href={isOwner && !isStudent ? "/dashboard" : "/bookings"}
              className="flex-1 text-center py-3 rounded-lg border border-[var(--color-border)] text-base font-semibold text-[var(--color-ink)] hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] transition-colors"
            >
              {isOwner && !isStudent ? "Dashboard" : "All bookings"}
            </Link>
            <Link
              href="/hostels"
              className="flex-1 text-center py-3 rounded-lg bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white text-base font-bold transition-colors"
            >
              Browse hostels
            </Link>
          </div>
        </div>

        <p className="mt-6 text-sm text-center text-[var(--color-ink-muted)]">
          Questions?{" "}
          <a href="mailto:support@hostello.pk" className="font-semibold text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors">
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
      <Icon className="w-5 h-5 text-[var(--color-brand-600)] mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
