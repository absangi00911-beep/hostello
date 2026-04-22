import type { Metadata } from "next";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Pricing",
  description: "HostelLo pricing — free for students, simple commission for owners.",
};

const STUDENT_FEATURES = [
  "Search & filter hostels",
  "View all listings and photos",
  "Compare hostels side by side",
  "Message owners directly",
  "Book and pay securely",
];

const OWNER_INCLUDED = [
  "Unlimited listing views",
  "Direct student messaging",
  "Booking management dashboard",
  "Analytics — views, enquiries, occupancy",
  "Priority placement in search after verification",
  "Email + SMS booking notifications",
];

// These are things we deliberately DON'T charge — kept separate from the
// feature list so a check/cross visual doesn't make them look like missing
// features.
const OWNER_NEVER = [
  "Advertising or promoted placement fees",
  "Setup fees or subscription charges",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest text-[var(--color-accent-600)] uppercase mb-3">
            No surprises
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold text-[var(--color-text)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Simple, honest pricing
          </h1>
          <p className="mt-4 text-base text-[var(--color-muted)] max-w-lg mx-auto">
            Free for students. A small commission for owners, charged only when a booking is confirmed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">

          {/* Students */}
          <div className="bg-white rounded-2xl border border-[var(--color-border)] p-7">
            <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">Students</p>
            <p
              className="text-5xl font-bold text-[var(--color-text)] mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Free
            </p>
            <p className="text-sm text-[var(--color-muted)] mb-6">Always. No hidden fees.</p>
            <ul className="space-y-2.5 mb-8">
              {STUDENT_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-[var(--color-text)]">
                  <Check className="w-4 h-4 text-[var(--color-primary-700)] flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block w-full text-center py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-sand-50)] transition-colors"
            >
              Create student account
            </Link>
          </div>

          {/* Owners */}
          <div className="bg-[var(--color-primary-950)] rounded-2xl p-7 text-white">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">Hostel Owners</p>
            <p
              className="text-5xl font-bold mb-1"
              style={{ fontFamily: "var(--font-display)" }}
            >
              5%
            </p>
            <p className="text-sm text-white/60 mb-6">Per confirmed booking. Nothing until then.</p>

            {/* What you get */}
            <ul className="space-y-2.5 mb-5">
              {OWNER_INCLUDED.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-[var(--color-accent-400)] flex-shrink-0" />
                  <span className="text-white/90">{f}</span>
                </li>
              ))}
            </ul>

            {/* What we never charge — distinct section so it reads as a promise, not a missing feature */}
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 mb-8">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2.5">
                We never charge
              </p>
              <ul className="space-y-2">
                {OWNER_NEVER.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                    <span className="text-white/55">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/signup?role=owner"
              className="block w-full text-center py-2.5 rounded-xl bg-[var(--color-accent-500)] text-white text-sm font-semibold hover:bg-[var(--color-accent-600)] transition-colors"
            >
              List your hostel
            </Link>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4 text-sm text-[var(--color-muted)] border-t border-[var(--color-border)] pt-8">
          <p>
            <strong className="text-[var(--color-text)]">How the commission works:</strong>{" "}
            When a student books and pays, 5% of the total booking value is deducted before the remaining
            amount is transferred to the owner. There are no monthly fees, no listing fees, and no charges
            for browsing or enquiries.
          </p>
          <p>
            <strong className="text-[var(--color-text)]">Payment processing:</strong>{" "}
            Payments are processed via Safepay (cards). JazzCash and EasyPaisa support is coming soon.
            Standard payment gateway fees (typically 1.5–2.5%) are separate from the HostelLo commission
            and are deducted by the payment provider.
          </p>
          <p>
            Questions about billing?{" "}
            <Link href="/contact" className="font-medium text-[var(--color-primary-700)] hover:underline">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}