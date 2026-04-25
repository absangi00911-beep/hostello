import type { Metadata } from "next";
import Link from "next/link";
import { Search, GitCompareArrows, MessageCircle, CreditCard, Building2, Star, ShieldCheck, Clock } from "lucide-react";

export const revalidate = false; // static — built once, never re-rendered

export const metadata: Metadata = {
  title: "How It Works",
  description: "Learn how HostelLo connects students with verified hostel owners across Pakistan.",
};

const STUDENT_STEPS = [
  {
    icon: Search,
    step: "01",
    title: "Search by city or university",
    body: "Enter your city, nearby university, or area. Filter by price range, gender preference, and amenities. Results update instantly.",
  },
  {
    icon: GitCompareArrows,
    step: "02",
    title: "Compare your options",
    body: "Add up to three hostels to compare side by side. See amenities, pricing, ratings, and location in one table — no spreadsheet needed.",
  },
  {
    icon: MessageCircle,
    step: "03",
    title: "Contact the owner",
    body: "Message the hostel owner directly to ask questions, verify availability, or arrange a visit before committing.",
  },
  {
    icon: CreditCard,
    step: "04",
    title: "Book and pay securely",
    body: "Pay securely by card through Safepay. You get a booking reference immediately and a receipt by email. JazzCash and EasyPaisa support launching soon.",
  },
];

const OWNER_STEPS = [
  {
    icon: Building2,
    step: "01",
    title: "List your hostel",
    body: "Fill in the details — description, location, pricing, amenities, house rules. Add photos. Submit for verification.",
  },
  {
    icon: ShieldCheck,
    step: "02",
    title: "Get verified",
    body: "Our team reviews your listing and may visit in person. Verified hostels appear with a badge and rank higher in search.",
  },
  {
    icon: Star,
    step: "03",
    title: "Receive booking requests",
    body: "Students send requests with their move-in dates. You confirm or decline from your dashboard. No phone calls required.",
  },
  {
    icon: Clock,
    step: "04",
    title: "Get paid",
    body: "Payment is collected at booking and transferred to you once the student moves in. No chasing rent, no middleman delays.",
  },
];

function StepCard({
  icon: Icon,
  step,
  title,
  body,
}: {
  icon: React.ElementType;
  step: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-50)] border border-[var(--color-primary-100)] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[var(--color-primary-700)]" />
        </div>
        <div className="flex-1 w-px bg-[var(--color-border)] mt-3 mb-1 hidden sm:block" />
      </div>
      <div className="pb-8 sm:pb-10">
        <p className="text-xs font-semibold text-[var(--color-accent-600)] mb-1">Step {step}</p>
        <h3 className="text-base font-semibold text-[var(--color-text)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-widest text-[var(--color-accent-600)] uppercase mb-3">
            Simple by design
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold text-[var(--color-text)] leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            How HostelLo works
          </h1>
          <p className="mt-4 text-base text-[var(--color-muted)] max-w-xl mx-auto leading-relaxed">
            Whether you're looking for a hostel or listing one, the process is
            straightforward and transparent on both sides.
          </p>
        </div>

        {/* Students */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-sm font-semibold text-[var(--color-text)] px-3 py-1 rounded-full border border-[var(--color-border)] bg-white">
              For students
            </span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>
          <div>
            {STUDENT_STEPS.map((s) => (
              <StepCard key={s.step} {...s} />
            ))}
          </div>
          <Link
            href="/hostels"
            className="inline-block mt-2 px-6 py-2.5 rounded-xl bg-[var(--color-primary-900)] text-white text-sm font-semibold hover:bg-[var(--color-primary-800)] transition-colors"
          >
            Find a hostel
          </Link>
        </div>

        {/* Owners */}
        <div id="owners">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-sm font-semibold text-[var(--color-text)] px-3 py-1 rounded-full border border-[var(--color-border)] bg-white">
              For hostel owners
            </span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>
          <div>
            {OWNER_STEPS.map((s) => (
              <StepCard key={s.step} {...s} />
            ))}
          </div>
          <Link
            href="/signup?role=owner"
            className="inline-block mt-2 px-6 py-2.5 rounded-xl bg-[var(--color-accent-500)] text-white text-sm font-semibold hover:bg-[var(--color-accent-600)] transition-colors"
          >
            List your hostel
          </Link>
        </div>

        {/* FAQ strip */}
        <div className="mt-20 p-8 rounded-2xl bg-[var(--color-sand-50)] border border-[var(--color-border)]">
          <h2
            className="text-xl font-bold text-[var(--color-text)] mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Common questions
          </h2>
          <dl className="space-y-5">
            {[
              {
                q: "Is HostelLo free for students?",
                a: "Yes. Searching, comparing, and contacting owners costs nothing. You only pay the hostel's rent.",
              },
              {
                q: "How do I know a hostel is trustworthy?",
                a: "Verified listings have been reviewed by our team. Reviews come only from residents who booked through us — not from anonymous users.",
                id: "verified",
              },
              {
                q: "What if something goes wrong after booking?",
                a: "Contact our support team at support@hostello.pk. We mediate disputes and can issue refunds for cancellations within our policy window.",
              },
              {
                q: "Can I visit before booking?",
                a: "Yes. Message the owner to arrange a visit. We encourage it — especially for longer stays.",
              },
            ].map(({ q, a, id }: { q: string; a: string; id?: string }) => (
              <div key={q} id={id}>
                <dt className="text-sm font-semibold text-[var(--color-text)] mb-1">{q}</dt>
                <dd className="text-sm text-[var(--color-muted)] leading-relaxed">{a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-[var(--color-muted)]">
            More questions?{" "}
            <Link href="/help" className="font-medium text-[var(--color-primary-700)] hover:underline">
              Visit the Help Centre
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
