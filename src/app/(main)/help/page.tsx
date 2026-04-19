import type { Metadata } from "next";
import Link from "next/link";
import { Search, BookOpen, Building2, CreditCard, ShieldCheck, MessageCircle } from "lucide-react";

export const revalidate = false; // static — built once, never re-rendered

export const metadata: Metadata = {
  title: "Help Centre",
  description: "Answers to common questions about HostelLo.",
};

const TOPICS = [
  {
    icon: Search,
    title: "Finding a hostel",
    links: [
      { label: "How do I search for hostels?", href: "/how-it-works" },
      { label: "What does 'Verified' mean?", href: "/how-it-works#verified" },
      { label: "How do I compare hostels?", href: "/how-it-works" },
    ],
  },
  {
    icon: BookOpen,
    title: "Bookings",
    links: [
      { label: "How do I make a booking?", href: "/how-it-works" },
      { label: "Can I cancel a booking?", href: "/how-it-works" },
      { label: "What happens if the owner declines?", href: "/how-it-works" },
    ],
  },
  {
    icon: CreditCard,
    title: "Payments",
    links: [
      { label: "Which payment methods are accepted?", href: "/how-it-works" },
      { label: "When is payment collected?", href: "/pricing" },
      { label: "How do refunds work?", href: "/how-it-works" },
    ],
  },
  {
    icon: Building2,
    title: "For hostel owners",
    links: [
      { label: "How do I list my hostel?", href: "/how-it-works#owners" },
      { label: "What is the commission fee?", href: "/pricing" },
      { label: "How do I get verified?", href: "/how-it-works#owners" },
    ],
  },
  {
    icon: ShieldCheck,
    title: "Safety & trust",
    links: [
      { label: "How are hostels verified?", href: "/how-it-works" },
      { label: "Are reviews real?", href: "/how-it-works" },
      { label: "How do I report a problem?", href: "/report" },
    ],
  },
  {
    icon: MessageCircle,
    title: "Contact & support",
    links: [
      { label: "How do I contact support?", href: "/contact" },
      { label: "Report a listing issue", href: "/report" },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1
            className="text-4xl font-bold text-[var(--color-text)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Help Centre
          </h1>
          <p className="mt-3 text-base text-[var(--color-muted)]">
            Find answers, or reach us directly at{" "}
            <a href="mailto:support@hostello.pk" className="font-medium text-[var(--color-primary-700)] hover:underline">
              support@hostello.pk
            </a>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {TOPICS.map(({ icon: Icon, title, links }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-[var(--color-border)] p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-50)] flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[var(--color-primary-700)]" />
                </div>
                <h2 className="text-sm font-semibold text-[var(--color-text)]">{title}</h2>
              </div>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-[var(--color-primary-700)] hover:underline"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 rounded-2xl bg-[var(--color-sand-50)] border border-[var(--color-border)] text-center">
          <p className="text-sm font-medium text-[var(--color-text)] mb-1">
            Didn't find what you're looking for?
          </p>
          <p className="text-sm text-[var(--color-muted)] mb-4">
            Our support team replies within 24 hours.
          </p>
          <Link
            href="/contact"
            className="inline-block px-5 py-2.5 rounded-xl bg-[var(--color-primary-900)] text-white text-sm font-semibold hover:bg-[var(--color-primary-800)] transition-colors"
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
