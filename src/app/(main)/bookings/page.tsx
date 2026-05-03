import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, MapPin, CalendarDays, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CancelBookingButton } from "@/components/features/booking/cancel-booking-button";
import { PageSection } from "@/components/ui/page-section";

export const metadata: Metadata = { title: "My Bookings" };

const STATUS = {
  PENDING:   { label: "Pending",   cls: "text-amber-700 bg-amber-50 border-amber-200" },
  CONFIRMED: { label: "Confirmed", cls: "text-[var(--color-brand-600)] bg-[var(--color-brand-50)] border-[var(--color-brand-200)]" },
  CANCELLED: { label: "Cancelled", cls: "text-red-700 bg-red-50 border-red-200" },
  COMPLETED: { label: "Completed", cls: "text-[var(--color-ink-muted)] bg-[var(--color-ground)] border-[var(--color-border)]" },
};

export default async function BookingsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const bookings = await db.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      hostel: {
        select: { id: true, name: true, slug: true, coverImage: true, city: true, area: true },
      },
    },
  });

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="py-12">
          <h1
            className="text-4xl sm:text-5xl font-extrabold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            My bookings
          </h1>
          <p className="text-base text-[var(--color-ink-muted)] mt-2 font-medium">
            {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
          </p>
        </div>

        <PageSection>
          {bookings.length === 0 ? (
          <div className="py-24 text-center rounded-xl border border-dashed border-[var(--color-border)]">
            <div className="w-16 h-16 rounded-lg bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-7 h-7 text-[var(--color-brand-600)]" />
            </div>
            <p className="text-lg font-bold text-[var(--color-ink)] mb-2">No bookings yet</p>
            <p className="text-base text-[var(--color-ink-muted)] mb-8">
              Find a hostel and send your first booking request.
            </p>
            <Link
              href="/hostels"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white text-base font-bold transition-colors"
            >
              Browse hostels
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {bookings.map((booking) => {
              const status = STATUS[booking.status as keyof typeof STATUS];
              const img = booking.hostel.coverImage;
              const isPending   = booking.status === "PENDING";
              const shortId     = booking.id.slice(-8).toUpperCase();

              return (
                <div
                  key={booking.id}
                  className="bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] overflow-hidden hover:border-[var(--color-brand-500)] hover:shadow-card transition-all"
                >
                  <div className="flex gap-5 p-5">
                    {/* Hostel image */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-[var(--color-ground)] relative">
                      {img && (
                        <Image src={img} alt={booking.hostel.name} fill sizes="96px" className="object-cover" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p
                            className="font-bold text-[var(--color-ink)] truncate text-lg"
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            {booking.hostel.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] mt-1 font-medium">
                            <MapPin className="w-4 h-4" />
                            {booking.hostel.area ? `${booking.hostel.area}, ` : ""}{booking.hostel.city}
                          </div>
                        </div>
                        {status && (
                          <span className={cn("text-sm font-bold px-3 py-1.5 rounded-lg border shrink-0", status.cls)}>
                            {status.label}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-[var(--color-ink-muted)]">
                        <div className="flex items-center gap-1.5 font-medium">
                          <CalendarDays className="w-4 h-4" />
                          {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-ground)]">
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-xs text-[var(--color-ink-muted)] font-bold uppercase tracking-wide">Total</p>
                        <p className="text-lg font-extrabold text-[var(--color-brand-600)] mt-1" style={{ fontFamily: "var(--font-display)" }}>
                          {formatPrice(booking.total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-ink-muted)] font-bold uppercase tracking-wide">Ref</p>
                        <p className="text-sm font-mono font-bold text-[var(--color-ink)] mt-1">#{shortId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isPending && (
                        <CancelBookingButton bookingId={booking.id} />
                      )}
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="flex items-center gap-1.5 text-base font-semibold text-[var(--color-brand-600)] hover:text-[var(--color-brand-700)] transition-colors"
                      >
                        Details <ChevronRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </PageSection>
      </div>
    </div>
  );
}
