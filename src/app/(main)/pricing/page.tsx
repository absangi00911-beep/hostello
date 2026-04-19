import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";

export const metadata: Metadata = {
export const revalidate = false; // static — built once, never re-rendered
  title: "Pricing",
  description: "HostelLo pricing — free for students, simple commission for owners.",
};

const OWNER_FEATURES = [
  { included: true,  text: "Unlimited listing views" },
  { included: true,  text: "Direct student messaging" },
  { included: true,  text: "Booking management dashboard" },
  { included: true,  text: "Analytics — views, enquiries, occupancy" },
  { included: true,  text: "Priority placement in search after verification" },
  { included: true,  text: "Email + SMS booking notifications" },
  { included: false, text: "Paid advertising placements" },
  { included: false, text: "Setup or subscription fees" },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
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
              {["Search & filter hostels", "View all listings and photos", "Compare side by side", "Message owners", "Book and pay securely"].map((f) => (
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
            <ul className="space-y-2.5 mb-8">
              {OWNER_FEATURES.map(({ included, text }) => (
                <li key={text} className="flex items-center gap-2.5 text-sm">
                  {included
                    ? <Check className="w-4 h-4 text-[var(--color-accent-400)] flex-shrink-0" />
                    : <X className="w-4 h-4 text-white/25 flex-shrink-0" />
                  }
                  <span className={included ? "text-white/90" : "text-white/35"}>{text}</span>
                </li>
              ))}
            </ul>
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
            Payments are processed via Safepay (cards), JazzCash, or EasyPaisa. Standard payment gateway
            fees (typically 1.5–2.5%) are separate from the HostelLo commission and deducted by the
            payment provider.
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
