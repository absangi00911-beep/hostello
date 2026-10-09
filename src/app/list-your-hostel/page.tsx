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
} from "lucide-react";
import { auth } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { PLANS } from "@/config/plans";

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
  { label: "Listing limit", href: "#pricing" },
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
    a: "Yes. Each owner can publish one hostel listing at no cost.",
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
    q: "How many hostels can I list?",
    a: "Each owner can publish one hostel listing. You can update its rooms, photos, pricing, and availability from your dashboard.",
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
    <header className="owner-landing-nav sticky top-0 z-40 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/90 backdrop-blur-md">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Page sections" className="hidden items-center gap-7 md:flex">
          {NAV_ITEMS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="text-[length:var(--text-body-sm)] font-[500] text-[color:var(--color-text-body)] transition-colors duration-[var(--transition-fast)] hover:text-[color:var(--color-text-heading)]"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href={isOwner ? "/owner/dashboard" : "/login"}
            className="hidden text-[length:var(--text-body-sm)] font-[500] text-[color:var(--color-text-body)] transition-colors duration-[var(--transition-fast)] hover:text-[color:var(--color-text-heading)] sm:inline-block"
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
    <section className="owner-field-hero relative isolate overflow-hidden bg-[var(--color-text-heading)]">
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

      <div className="container-app relative flex min-h-[560px] flex-col justify-center py-20 sm:min-h-[600px] md:min-h-[640px] md:py-24">
        <div className="owner-field-masthead" aria-hidden="true">
          <span>HOSTELLO / OWNER FIELD GUIDE</span>
          <span>PAKISTAN · STAYS</span>
        </div>
        <div className="max-w-2xl">
          <p className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-white backdrop-blur-sm">
            For hostel owners
          </p>

          <h1 className="owner-field-title mt-5 text-white">
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
          <div className="owner-field-trust-note relative mt-10 max-w-xs rounded-[var(--radius-brand)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/95 p-4 shadow-[var(--shadow-lg)] backdrop-blur-sm md:absolute md:right-0 md:bottom-12 md:mt-0 lg:right-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-faint)]">
                <ShieldCheck
                  size={20}
                  strokeWidth={1.5}
                  className="text-[color:var(--color-primary-deep)]"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-[length:var(--text-body-sm)] font-[700] text-[color:var(--color-text-heading)]">
                  Verified listings
                </p>
                <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
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
    <div className="owner-section-heading mx-auto max-w-2xl text-center">
      <p className="owner-section-kicker text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-primary-deep)]">
        {eyebrow}
      </p>
      <h2 className="owner-section-title mt-2 text-[length:var(--text-h2)] text-[color:var(--color-text-heading)]">
        {heading}
      </h2>
      <p className="mt-3 text-[length:var(--text-body)] text-[color:var(--color-text-muted)]">{sub}</p>
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
            <Card key={title} className="owner-benefit-card border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6">
              <CardContent className="p-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-faint)]">
                  <Icon
                    size={20}
                    strokeWidth={1.5}
                    className="text-[color:var(--color-primary-deep)]"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-4 text-[length:var(--text-h5)] font-[600] text-[color:var(--color-text-heading)]">
                  {title}
                </h3>
                <p className="mt-2 text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-muted)]">
                  {body}
                </p>
              </CardContent>
            </Card>
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
            <Card key={title} className="owner-step-card relative border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5">
              <CardContent className="p-0">
                <div className="flex items-center gap-3">
                  <span className="font-heading text-[2rem] font-[600] text-[color:var(--color-primary)]/30">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-bg-card)] shadow-[var(--shadow-xs)]">
                    <Icon
                      size={16}
                      strokeWidth={1.5}
                      className="text-[color:var(--color-primary-deep)]"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <h3 className="mt-3 text-[length:var(--text-h5)] font-[600] text-[color:var(--color-text-heading)]">
                  {title}
                </h3>
                <p className="mt-2 max-w-[42ch] text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-muted)]">
                  {body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Pricing ─────────────────────────────────────────────── */
function PricingSection({ ctaHref }: { ctaHref: string }) {
  return (
    <section id="pricing" className="scroll-mt-16 bg-[var(--color-bg-page)] py-16 md:py-24">
      <div className="container-app">
        <SectionHeading
          eyebrow="One simple limit"
          heading="Start with one free listing."
          sub="List your hostel at no cost, then manage rooms, booking requests, and availability from one dashboard."
        />

        <div className="mx-auto mt-12 grid max-w-md gap-6">
          {/* Free */}
          <Card className="owner-pricing-card flex flex-col border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6">
            <CardContent className="flex flex-1 flex-col p-0">
              <p className="text-[length:var(--text-body-sm)] font-[500] text-[color:var(--color-text-muted)]">
                {PLANS.FREE.label}
              </p>
              <p className="mt-1 font-heading text-[2.25rem] font-[700] text-[color:var(--color-text-heading)]">
                Free
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {PLANS.FREE.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2">
                    <Check
                      size={15}
                      strokeWidth={2.5}
                      className="mt-0.5 shrink-0 text-[color:var(--color-primary)]"
                      aria-hidden="true"
                    />
                    <span className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-body)]">
                      {perk}
                    </span>
                  </li>
                ))}
              </ul>
              <Button asChild variant="secondary" size="lg" className="mt-6">
                <Link href={ctaHref}>Get started free</Link>
              </Button>
            </CardContent>
          </Card>

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
            <Card key={q} className="border-0 bg-transparent shadow-none">
              <CardContent className="p-5 sm:p-6">
                <h3 className="text-[length:var(--text-body)] font-[600] text-[color:var(--color-text-heading)]">
                  {q}
                </h3>
                <p className="mt-2 text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-muted)]">
                  {a}
                </p>
              </CardContent>
            </Card>
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
        <h2 className="max-w-xl font-heading text-[length:var(--text-h2)] font-[600] text-[color:var(--color-text-inverse)]">
          Ready to fill your rooms?
        </h2>
        <p className="max-w-md text-[length:var(--text-body)] text-[color:var(--color-text-inverse)]">
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
    <div className="owner-field-landing flex min-h-dvh flex-col bg-[var(--color-bg-page)]">
      <OwnerLandingNav ctaHref={ctaHref} ctaLabel={ctaLabel} isOwner={isOwner} />

      <main id="main-content">
        <Hero ctaHref={ctaHref} ctaLabel={ctaLabel} />
        <BenefitsSection />
        <HowItWorksSection />
        <PricingSection ctaHref={ctaHref} />
        <FaqSection />
        <FinalCta ctaHref={ctaHref} ctaLabel={ctaLabel} />
      </main>

      <Footer />
    </div>
  );
}
