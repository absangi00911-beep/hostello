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

export const metadata: Metadata = { title: "My Bookings" };

const STATUS = {
  PENDING:   { label: "Pending",   cls: "text-amber-700 bg-amber-50 border-amber-200" },
  CONFIRMED: { label: "Confirmed", cls: "text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border-[var(--color-brand-100)]" },
  CANCELLED: { label: "Cancelled", cls: "text-red-700 bg-red-50 border-red-200" },
  COMPLETED: { label: "Completed", cls: "text-[var(--color-muted)] bg-[var(--color-ground)] border-[var(--color-border)]" },
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
        <div className="py-10">
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            My bookings
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {bookings.length} total
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-[var(--color-border)]">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-6 h-6 text-[var(--color-muted)]" />
            </div>
            <p className="text-base font-bold text-[var(--color-ink)] mb-1">No bookings yet</p>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              Find a hostel and send your first booking request.
            </p>
            <Link
              href="/hostels"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] transition-colors"
            >
              Browse hostels
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const status = STATUS[booking.status as keyof typeof STATUS];
              const img = booking.hostel.coverImage;
              const isPending   = booking.status === "PENDING";
              const isConfirmed = booking.status === "CONFIRMED";
              const shortId     = booking.id.slice(-8).toUpperCase();

              return (
                <div
                  key={booking.id}
                  className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden hover:border-[var(--color-ink)] transition-colors"
                >
                  <div className="flex gap-4 p-4">
                    {/* Hostel image */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[var(--color-ground)] relative">
                      {img && (
                        <Image src={img} alt={booking.hostel.name} fill sizes="80px" className="object-cover" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p
                            className="font-bold text-[var(--color-ink)] truncate"
                            style={{ fontFamily: "var(--font-display)" }}
                          >
                            {booking.hostel.name}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-[var(--color-muted)] mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {booking.hostel.area ? `${booking.hostel.area}, ` : ""}
                            {booking.hostel.city}
                          </div>
                        </div>
                        {status && (
                          <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0", status.cls)}>
                            {status.label}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-muted)]">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-ground)]">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-[var(--color-muted)]">Total</p>
                        <p className="text-sm font-extrabold text-[var(--color-ink)]" style={{ fontFamily: "var(--font-display)" }}>
                          {formatPrice(booking.total)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--color-muted)]">Ref</p>
                        <p className="text-xs font-mono text-[var(--color-ink-soft)]">#{shortId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <CancelBookingButton bookingId={booking.id} />
                      )}
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="flex items-center gap-1 text-xs font-semibold text-[var(--color-ink)] hover:text-[var(--color-brand-700)] transition-colors"
                      >
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
