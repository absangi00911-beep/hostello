// Path: src/app/list-your-hostel/page.tsx

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Building2,
  Check,
  Eye,
  LayoutGrid,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { auth } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { PLANS } from "@/config/plans";
import { formatPKR } from "@/components/ui/shared";

export const metadata: Metadata = {
  title: "List Your Hostel",
  description:
    "List your hostel on HostelLo and reach students across Pakistan searching by city, university, and budget. Verified listings, simple tools, secure PKR payouts.",
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=2000&q=80&auto=format&fit=crop";

const NAV_ITEMS = [
  { label: "Benefits", href: "#benefits" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQs", href: "#faqs" },
] as const;

const BENEFITS = [
  {
    icon: Search,
    title: "Reach students across Pakistan",
    body: "Your listing shows up when students filter by city, university, price, and amenities. That's real demand, not cold outreach.",
  },
  {
    icon: LayoutGrid,
    title: "Simple listing tools",
    body: "Add rooms and photos with a guided wizard, block dates when you're full, and manage every message from one dashboard.",
  },
  {
    icon: Banknote,
    title: "Secure PKR payouts",
    body: "Bookings are paid through HostelLo's secure gateway, and every payout is tracked, so you're never chasing a student for cash.",
  },
] as const;

const STEPS = [
  {
    icon: Building2,
    title: "List your hostel",
    body: "Add your rooms, prices, and photos with the guided wizard. Most owners are live in under 15 minutes.",
  },
  {
    icon: Eye,
    title: "Get discovered",
    body: "Students searching your city and university see your listing next to real prices, not just a phone number.",
  },
  {
    icon: Banknote,
    title: "Approve and get paid",
    body: "Confirm booking requests, message students directly, and receive secure payouts to your account.",
  },
] as const;

const FAQS = [
  {
    q: "Is it free to list my hostel?",
    a: "Yes. The Free plan lets you list one room at no cost. Upgrade to Pro any time for unlimited listings and featured placement in search.",
  },
  {
    q: "Which cities does HostelLo support?",
    a: "HostelLo covers hostels across Pakistan, including Lahore, Karachi, Islamabad, and Peshawar, with more cities added regularly.",
  },
  {
    q: "Do you review listings before they go live?",
    a: "Yes. Every hostel is reviewed by our team before students can see or book it, so your listing sits alongside other verified hostels.",
  },
  {
    q: "How and when do I get paid?",
    a: "Bookings are paid securely through our payment gateway, and every payout is tracked in your owner dashboard so you always know what's pending.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. Upgrade to Pro or move back to the Free plan any time from your owner settings. There's no lock-in.",
  },
] as const;

/* ── Nav ─────────────────────────────────────────────────── */
function OwnerLandingNav({
  ctaHref,
  ctaLabel,
  isOwner,
}: {
  ctaHref: string;
  ctaLabel: string;
  isOwner: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 backdrop-blur-md">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Page sections" className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)] transition-colors duration-[var(--transition-fast)] hover:text-[var(--color-text-heading)]"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href={isOwner ? "/owner/dashboard" : "/login"}
            className="hidden text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)] transition-colors duration-[var(--transition-fast)] hover:text-[var(--color-text-heading)] sm:inline-block"
          >
            {isOwner ? "Dashboard" : "Login"}
          </Link>
          <Button asChild size="default">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* ── Hero ────────────────────────────────────────────────── */
function Hero({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--color-text-heading)]">
      <Image
        src={HERO_IMAGE}
        alt="A group of people sitting together around a wooden table, talking and working on laptops"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30"
        aria-hidden="true"
      />

      <div className="container-app relative flex min-h-[560px] flex-col justify-center py-16 sm:min-h-[600px] md:min-h-[640px] md:py-24">
        <div className="max-w-2xl">
          <p className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-white backdrop-blur-sm">
            For hostel owners
          </p>

          <h1 className="mt-5 font-heading text-[2.25rem] leading-[1.08] font-[600] tracking-[-0.01em] text-white sm:text-[2.75rem] md:text-[3.25rem] lg:text-[3.75rem]">
            Fill your rooms with students who are already searching
          </h1>

          <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-white/85 sm:text-[1.125rem]">
            List your hostel on HostelLo and get discovered by students comparing verified hostels near their university, in cities across Pakistan.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="shadow-[var(--shadow-lg)]">
              <Link href={ctaHref}>
                {ctaLabel}
                <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white focus-visible:outline-white"
            >
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>

          {/* Floating trust card — flows normally on mobile, overlaps the photo from md up */}
          <div className="relative mt-10 max-w-xs rounded-[var(--radius-brand)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 p-4 shadow-[var(--shadow-lg)] backdrop-blur-sm md:absolute md:right-0 md:bottom-12 md:mt-0 lg:right-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-faint)]">
                <ShieldCheck
                  size={20}
                  strokeWidth={1.5}
                  className="text-[var(--color-primary-deep)]"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-[var(--text-body-sm)] font-[700] text-[var(--color-text-heading)]">
                  Verified listings
                </p>
                <p className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
                  Every hostel is reviewed before students can book
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Section heading ─────────────────────────────────────── */
function SectionHeading({
  eyebrow,
  heading,
  sub,
}: {
  eyebrow: string;
  heading: string;
  sub: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-[var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[var(--color-primary-deep)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-heading text-[var(--text-h2)] font-[600] text-[var(--color-text-heading)]">
        {heading}
      </h2>
      <p className="mt-3 text-[var(--text-body)] text-[var(--color-text-muted)]">{sub}</p>
    </div>
  );
}

/* ── Benefits ────────────────────────────────────────────── */
function BenefitsSection() {
  return (
    <section id="benefits" className="scroll-mt-16 bg-[var(--color-bg-page)] py-16 md:py-24">
      <div className="container-app">
        <SectionHeading
          eyebrow="Why list with HostelLo"
          heading="Everything you need to fill your rooms"
          sub="You manage the hostel. We bring the students, the tools, and the payments."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-faint)]">
                <Icon
                  size={20}
                  strokeWidth={1.5}
                  className="text-[var(--color-primary-deep)]"
                  aria-hidden="true"
                />
              </div>
              <h3 className="mt-4 text-[var(--text-h5)] font-[600] text-[var(--color-text-heading)]">
                {title}
              </h3>
              <p className="mt-2 text-[var(--text-body-sm)] leading-relaxed text-[var(--color-text-muted)]">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How it works ────────────────────────────────────────── */
function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 border-y border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] py-16 md:py-24"
    >
      <div className="container-app">
        <SectionHeading
          eyebrow="How it works"
          heading="From empty room to booked guest in three steps"
          sub="No cold calls, no walk-ins to manage. Just a listing that does the work for you."
        />

        <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <div key={title} className="relative">
              <div className="flex items-center gap-3">
                <span className="font-heading text-[2rem] font-[600] text-[var(--color-primary)]/30">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg-card)] shadow-[var(--shadow-xs)]">
                  <Icon
                    size={16}
                    strokeWidth={1.5}
                    className="text-[var(--color-primary-deep)]"
                    aria-hidden="true"
                  />
                </div>
              </div>
              <h3 className="mt-3 text-[var(--text-h5)] font-[600] text-[var(--color-text-heading)]">
                {title}
              </h3>
              <p className="mt-2 max-w-[42ch] text-[var(--text-body-sm)] leading-relaxed text-[var(--color-text-muted)]">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ─────────────────────────────────────────────── */
function PricingSection({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  return (
    <section id="pricing" className="scroll-mt-16 bg-[var(--color-bg-page)] py-16 md:py-24">
      <div className="container-app">
        <SectionHeading
          eyebrow="Simple pricing"
          heading="Start free. Upgrade when you're ready."
          sub="No setup fees, no hidden charges. Switch plans any time from your owner settings."
        />

        <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
          {/* Free */}
          <div className="flex flex-col rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6">
            <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-muted)]">
              {PLANS.FREE.label}
            </p>
            <p className="mt-1 font-heading text-[2.25rem] font-[700] text-[var(--color-text-heading)]">
              Free
            </p>
            <ul className="mt-5 flex-1 space-y-2.5">
              {PLANS.FREE.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <Check
                    size={15}
                    strokeWidth={2.5}
                    className="mt-0.5 shrink-0 text-[var(--color-primary)]"
                    aria-hidden="true"
                  />
                  <span className="text-[var(--text-body-sm)] text-[var(--color-text-body)]">
                    {perk}
                  </span>
                </li>
              ))}
            </ul>
            <Button asChild variant="secondary" size="lg" className="mt-6">
              <Link href={ctaHref}>Get started free</Link>
            </Button>
          </div>

          {/* Pro */}
          <div className="relative flex flex-col rounded-[var(--radius-xl)] border border-[var(--color-primary)] bg-[var(--color-bg-card)] p-6 shadow-[0_0_0_3px_#ae2f3426]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-3 py-0.5 text-[11px] font-[700] uppercase tracking-wide text-white">
                <Zap size={10} strokeWidth={2.5} aria-hidden="true" />
                Recommended
              </span>
            </div>
            <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-muted)]">
              {PLANS.PRO.label}
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-heading text-[2.25rem] font-[700] text-[var(--color-text-heading)]">
                {formatPKR(PLANS.PRO.price)}
              </span>
              <span className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">/mo</span>
            </div>
            <ul className="mt-5 flex-1 space-y-2.5">
              {PLANS.PRO.perks.map((perk) => (
                <li key={perk} className="flex items-start gap-2">
                  <Check
                    size={15}
                    strokeWidth={2.5}
                    className="mt-0.5 shrink-0 text-[var(--color-primary)]"
                    aria-hidden="true"
                  />
                  <span className="text-[var(--text-body-sm)] text-[var(--color-text-body)]">
                    {perk}
                  </span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-6">
              <Link href={ctaHref}>Go Pro</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ─────────────────────────────────────────────────── */
function FaqSection() {
  return (
    <section
      id="faqs"
      className="scroll-mt-16 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] py-16 md:py-24"
    >
      <div className="container-app">
        <SectionHeading
          eyebrow="Questions"
          heading="Frequently asked questions"
          sub="Can't find what you're looking for? Reach out to our support team."
        />

        <div className="mx-auto mt-12 max-w-2xl divide-y divide-[var(--color-border-subtle)] rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]">
          {FAQS.map(({ q, a }) => (
            <div key={q} className="p-5 sm:p-6">
              <h3 className="text-[var(--text-body)] font-[600] text-[var(--color-text-heading)]">
                {q}
              </h3>
              <p className="mt-2 text-[var(--text-body-sm)] leading-relaxed text-[var(--color-text-muted)]">
                {a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Final CTA ───────────────────────────────────────────── */
function FinalCta({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  return (
    <section className="bg-[var(--color-primary)] py-16 md:py-20">
      <div className="container-app flex flex-col items-center gap-6 text-center">
        <h2 className="max-w-xl font-heading text-[var(--text-h2)] font-[600] text-white">
          Ready to fill your rooms?
        </h2>
        <p className="max-w-md text-[var(--text-body)] text-white/90">
          Join hostel owners across Pakistan who are already listing on HostelLo.
        </p>
        <Button asChild size="lg" className="shadow-[var(--shadow-md)]">
          <Link href={ctaHref}>
            {ctaLabel}
            <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default async function ListYourHostelPage() {
  const session = await auth();
  const isOwner = session?.user.role === "OWNER";
  const ctaHref = isOwner ? "/owner/dashboard" : "/register?role=OWNER";
  const ctaLabel = isOwner ? "Go to dashboard" : "List Your Hostel";

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-bg-page)]">
      <OwnerLandingNav ctaHref={ctaHref} ctaLabel={ctaLabel} isOwner={isOwner} />

      <main id="main-content">
        <Hero ctaHref={ctaHref} ctaLabel={ctaLabel} />
        <BenefitsSection />
        <HowItWorksSection />
        <PricingSection ctaHref={ctaHref} ctaLabel={ctaLabel} />
        <FaqSection />
        <FinalCta ctaHref={ctaHref} ctaLabel={ctaLabel} />
      </main>

      <Footer />
    </div>
  );
}
