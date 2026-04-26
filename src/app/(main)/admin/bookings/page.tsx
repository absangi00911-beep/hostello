import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/utils";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin — Bookings" };

const STATUS_CLS: Record<string, string> = {
  PENDING:   "text-amber-700 bg-amber-50 border-amber-200",
  CONFIRMED: "text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border-[var(--color-brand-100)]",
  CANCELLED: "text-red-700 bg-red-50 border-red-200",
  COMPLETED: "text-[var(--color-muted)] bg-[var(--color-ground)] border-[var(--color-border)]",
};

const PAGE_SIZE = 50;

export default async function AdminBookingsPage(props: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const { cursor } = await props.searchParams;

  // Fetch PAGE_SIZE + 1 to know if there's a next page
  const bookings = await db.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    include: {
      hostel: { select: { name: true, city: true } },
      user:   { select: { name: true, email: true } },
    },
  });

  const hasNextPage = bookings.length > PAGE_SIZE;
  const displayedBookings = bookings.slice(0, PAGE_SIZE);
  const nextCursor = hasNextPage ? displayedBookings[displayedBookings.length - 1]?.id : null;

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[var(--color-ground)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="py-10">
          <Link href="/admin" className="text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)]">← Admin</Link>
          <h1 className="text-3xl font-extrabold text-[var(--color-ink)] mt-2" style={{ fontFamily: "var(--font-display)" }}>
            Bookings
          </h1>
        </div>

        {/* Info and pagination */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-[var(--color-muted)]">
            Showing {displayedBookings.length} bookings (latest first)
          </p>
          {(cursor || hasNextPage) && (
            <div className="flex gap-2">
              {cursor && (
                <Link
                  href="/admin/bookings"
                  className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm font-semibold text-[var(--color-muted)] hover:bg-[var(--color-ground)] transition-colors"
                >
                  ← Previous
                </Link>
              )}
              {hasNextPage && (
                <Link
                  href={`/admin/bookings?cursor=${nextCursor}`}
                  className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm font-semibold text-[var(--color-muted)] hover:bg-[var(--color-ground)] transition-colors"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
          <div className="divide-y divide-[var(--color-border)]">
            {displayedBookings.map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{b.hostel.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {b.user.name} · {formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {formatPrice(b.total)}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex-shrink-0 ${STATUS_CLS[b.status]}`}>
                  {b.status.toLowerCase()}
                </span>
                <Link href={`/bookings/${b.id}`} className="text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)]">
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
