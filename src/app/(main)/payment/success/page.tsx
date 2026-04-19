import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ bookingId?: string }>;
}

export default async function PaymentSuccessPage({ searchParams }: PageProps) {
  const { bookingId } = await searchParams;
  if (!bookingId) redirect("/");

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[var(--color-ground)] flex items-center justify-center">
      <div className="max-w-md w-full px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-[var(--color-brand-700)]" />
        </div>

        <h1
          className="text-3xl font-extrabold text-[var(--color-ink)] mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Payment successful
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-8">
          Your booking is confirmed. Check your email for the receipt and move-in details from the owner.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href={`/bookings/${bookingId}`}
            className="flex-1 py-3 rounded-xl bg-[var(--color-ink)] text-white text-sm font-bold hover:bg-[var(--color-ink-soft)] transition-colors text-center"
          >
            View booking
          </Link>
          <Link
            href="/hostels"
            className="flex-1 py-3 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors text-center"
          >
            Browse more
          </Link>
        </div>
      </div>
    </div>
  );
}
