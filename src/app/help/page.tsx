import Link from "next/link";
import { ArrowRight, CircleHelp } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";

const topics = [
  {
    title: "When is a booking confirmed?",
    body: "Your payment sends a request to the hostel owner. The stay is confirmed only after the owner accepts it. We email you when the owner responds.",
  },
  {
    title: "How long does the owner have to respond?",
    body: "The owner has 24 hours after your payment is received. We remind the owner before the deadline. If there is no response by then, the request is cancelled and HostelLo starts a full refund to your original payment method.",
  },
  {
    title: "What if the owner declines my request?",
    body: "The booking is cancelled and HostelLo starts a full refund to your original payment method. Banks and card issuers can take a few business days to show it.",
  },
  {
    title: "Can I cancel a request before the owner responds?",
    body: "Yes. Open My Bookings and cancel a request while it is still waiting for the owner. If you have paid, HostelLo starts a refund. If a refund needs manual review, your booking page will show that it is being checked.",
  },
  {
    title: "What if I cancel after the owner confirms?",
    body: "The booking keeps the cancellation policy shown before payment. Flexible refunds 100% at least 48 hours before check-in and 50% from 24 hours to under 48 hours; Standard refunds 100% at least 7 days before and 50% from 72 hours to under 7 days; Strict refunds 50% at least 14 days before. Each policy gives no refund inside its final deadline or after check-in. HostelLo initiates approved refunds within 1 business day; banks may take 3–10 business days to post them.",
  },
  {
    title: "Where can I check a refund?",
    body: "Open the booking from My Bookings to see its latest payment and refund status. If a payment or refund looks stuck, contact support with your booking reference.",
  },
  {
    title: "How do I report a listing or safety concern?",
    body: "Use Report an issue to send the listing link and a description. For a booking or payment question, use Contact support instead.",
  },
];

export const metadata = {
  title: "Help Centre",
  description: "Booking, payment, refund, and listing help for HostelLo students and hostel owners.",
};

export default function HelpPage() {
  return (
    <PublicLayout>
      <div className="container-app py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          <header className="mb-10 border-b border-[var(--color-border-subtle)] pb-8 md:mb-12 md:pb-10">
            <p className="mb-3 text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.12em] text-[color:var(--color-primary-deep)]">
              HOSTELLO / HELP DESK
            </p>
            <div className="flex items-start gap-4">
              <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[color:var(--color-primary-deep)]">
                <CircleHelp size={21} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <div>
                <h1 className="font-display text-[length:var(--text-h1)] leading-tight tracking-[-0.035em] text-[color:var(--color-text-heading)]">
                  A few clear answers.
                </h1>
                <p className="mt-3 max-w-[58ch] text-[length:var(--text-body)] leading-relaxed text-[color:var(--color-text-muted)]">
                  Find the next step for bookings, payments, refunds, and listing questions.
                </p>
              </div>
            </div>
          </header>

          <div className="divide-y divide-[var(--color-border-subtle)]">
            {topics.map((topic, index) => (
              <details key={topic.title} className="group py-5 first:pt-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-[length:var(--text-h5)] font-[600] text-[color:var(--color-text-heading)] marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-[length:var(--text-caption)] text-[color:var(--color-primary-deep)]">0{index + 1}</span>
                    {topic.title}
                  </span>
                  <span className="font-display text-2xl font-[400] text-[color:var(--color-primary)] transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="max-w-3xl pl-9 pr-8 pt-3 text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-muted)]">
                  {topic.body}
                </p>
              </details>
            ))}
          </div>

          <section className="mt-10 flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] p-5 md:mt-14 md:flex-row md:items-center md:justify-between md:p-7">
            <div>
              <p className="text-[length:var(--text-h5)] font-[600] text-[color:var(--color-text-heading)]">Still need a person?</p>
              <p className="mt-1 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">Send our support desk a note. We&apos;ll reply by email.</p>
            </div>
            <Link href="/contact" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-action)] px-4 py-2 text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-inverse)] transition-colors hover:bg-[var(--color-action-dark)]">
              Contact support <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
