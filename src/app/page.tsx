// Path: src/app/page.tsx

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Eye,
  KeyRound,
  Lock,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { CITIES } from "@hostello/shared";
import { auth } from "@/lib/auth/config";
import { getAppUrl } from "@/lib/app-url";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { HostelCard, type HostelCardData } from "@/components/hostel/HostelCard";

export const metadata: Metadata = {
  title: "HostelLo — Verified Student Hostels in Pakistan",
  description:
    "Search verified student hostels across Pakistan by city, university, and budget — real PKR pricing, no phone calls. Own a hostel near a university? List it on HostelLo.",
};

const STUDENT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=2000&q=80&auto=format&fit=crop";

const FEATURED_CITIES = CITIES.slice(0, 6);

const TRUST_CARDS = [
  {
    icon: ShieldCheck,
    title: "Verified hostel listings",
    body: "Every hostel is reviewed by our team before students can see or book it, so what you find is real.",
  },
  {
    icon: Eye,
    title: "Real prices before you call",
    body: "See PKR pricing, room photos, and amenities upfront — no need to call five numbers just to compare costs.",
  },
  {
    icon: Lock,
    title: "Secure booking handoff",
    body: "Confirm your booking and pay through HostelLo's secure gateway, tracked end to end, not just a promise over the phone.",
  },
] as const;

const STUDENT_STEPS = [
  {
    icon: Search,
    title: "Search & compare",
    body: "Filter by city, university, budget, and amenities to shortlist real, verified hostels.",
  },
  {
    icon: MessageCircle,
    title: "Message & book",
    body: "Chat with the hostel directly, confirm details, and request your booking.",
  },
  {
    icon: KeyRound,
    title: "Move in with confidence",
    body: "Pay securely through HostelLo and move in knowing the listing was verified before you booked.",
  },
] as const;

const OWNER_QUICK_LINKS = [
  {
    icon: Building2,
    label: "My listings",
    body: "Edit rooms, prices, and photos",
    href: "/owner/listings",
  },
  {
    icon: Plus,
    label: "Add listing",
    body: "List a new hostel or room",
    href: "/owner/listings/new",
  },
  {
    icon: CalendarDays,
    label: "Bookings",
    body: "Review and confirm requests",
    href: "/owner/bookings",
  },
  {
    icon: MessageCircle,
    label: "Messages",
    body: "Reply to students",
    href: "/owner/messages",
  },
] as const;

/* ── Data ────────────────────────────────────────────────── */
async function getRecentHostels(): Promise<HostelCardData[]> {
  try {
    const baseUrl = getAppUrl();
    const res = await fetch(`${baseUrl}/api/hostels?sort=newest&limit=6`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
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

/* ── Hero — split for anonymous visitors, search-first for students ── */
function Hero({ isAnonymous }: { isAnonymous: boolean }) {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--color-text-heading)]">
      <div className={isAnonymous ? "grid md:grid-cols-2" : ""}>
        {/* Student column — always shown */}
        <div className="relative isolate overflow-hidden">
          <Image
            src={STUDENT_HERO_IMAGE}
            alt="Students studying and relaxing together in a hostel common room"
            fill
            priority
            sizes={isAnonymous ? "(min-width: 768px) 50vw, 100vw" : "100vw"}
            className="object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30"
            aria-hidden="true"
          />

          <div
            className={
              isAnonymous
                ? "relative flex min-h-[520px] flex-col justify-center px-6 py-16 sm:px-10 md:min-h-[600px] md:py-20 lg:px-14"
                : "container-app relative flex min-h-[520px] flex-col justify-center py-16 md:min-h-[600px] md:py-20"
            }
          >
            <p className="inline-flex w-fit items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-white backdrop-blur-sm">
              For students
            </p>

            <h1 className="mt-5 max-w-lg font-heading text-[2rem] leading-[1.1] font-[600] tracking-[-0.01em] text-white sm:text-[2.5rem] md:text-[2.75rem]">
              Find your room. Not a phone number.
            </h1>

            <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-white/85">
              Search verified hostels near your university by city, price, and amenities — real PKR pricing, up front.
            </p>

            <div className="mt-7 max-w-md rounded-[var(--radius-brand)] bg-white/95 p-3 shadow-[var(--shadow-lg)] backdrop-blur-sm sm:p-4">
              <HeroSearch />
            </div>
          </div>
        </div>

        {/* Owner column — anonymous visitors only */}
        {isAnonymous && (
          <div className="relative flex flex-col justify-center bg-[var(--color-secondary-brand)] px-6 py-16 sm:px-10 md:py-20 lg:px-14">
            <p className="inline-flex w-fit items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-white backdrop-blur-sm">
              For hostel owners
            </p>

            <h2 className="mt-5 max-w-md font-heading text-[2rem] leading-[1.1] font-[600] tracking-[-0.01em] text-white sm:text-[2.5rem] md:text-[2.75rem]">
              Fill your rooms with students who are already searching
            </h2>

            <p className="mt-4 max-w-md text-[1.0625rem] leading-relaxed text-white/85">
              List your hostel on HostelLo and get discovered by students comparing verified hostels near their university, in cities across Pakistan.
            </p>

            <div className="mt-7">
              <Button asChild size="lg" className="shadow-[var(--shadow-lg)]">
                <Link href="/list-your-hostel">
                  List Your Hostel
                  <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
                </Link>
              </Button>
            </div>

            <div className="mt-8 flex max-w-md items-center gap-3 rounded-[var(--radius-lg)] bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                <ShieldCheck size={20} strokeWidth={1.5} className="text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[var(--text-body-sm)] font-[700] text-white">Verified listings</p>
                <p className="text-[var(--text-caption)] text-white/75">
                  Every hostel is reviewed before students can book
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Trust / promise section ────────────────────────────────*/
function TrustSection() {
  return (
    <section className="bg-[var(--color-bg-page)] py-16 md:py-20">
      <div className="container-app">
        <SectionHeading
          eyebrow="The HostelLo promise"
          heading="Built so you don't have to guess"
          sub="Every listing, price, and booking on HostelLo goes through the same standard."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {TRUST_CARDS.map(({ icon: Icon, title, body }) => (
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

/* ── Browse by city ──────────────────────────────────────── */
function BrowseCitiesSection() {
  return (
    <section className="border-y border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] py-16 md:py-20">
      <div className="container-app">
        <SectionHeading
          eyebrow="Browse by city"
          heading="Hostels in cities across Pakistan"
          sub="Start with the city your university is in."
        />

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {FEATURED_CITIES.map((city) => (
            <Link
              key={city}
              href={`/hostels?city=${encodeURIComponent(city)}`}
              className="group flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-4 py-5 text-center transition-colors duration-[var(--transition-fast)] hover:border-[var(--color-primary)]"
            >
              <MapPin
                size={18}
                strokeWidth={1.5}
                className="text-[var(--color-primary-deep)]"
                aria-hidden="true"
              />
              <span className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)] group-hover:text-[var(--color-primary)]">
                {city}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Recently added hostels ──────────────────────────────── */
function RecentHostelsSection({ hostels }: { hostels: HostelCardData[] }) {
  return (
    <section className="bg-[var(--color-bg-page)] py-16 md:py-20">
      <div className="container-app">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[var(--color-primary-deep)]">
              Fresh listings
            </p>
            <h2 className="mt-2 font-heading text-[var(--text-h2)] font-[600] text-[var(--color-text-heading)]">
              Recently added hostels
            </h2>
          </div>
          <Link
            href="/hostels"
            className="inline-flex items-center gap-1.5 text-[var(--text-body-sm)] font-[600] text-[var(--color-text-link)] hover:underline"
          >
            See all hostels
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hostels.slice(0, 6).map((hostel, index) => (
            <HostelCard key={hostel.id} hostel={hostel} priority={index < 3} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How it works (student journey) ─────────────────────────*/
function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-16 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] py-16 md:py-20"
    >
      <div className="container-app">
        <SectionHeading
          eyebrow="How it works"
          heading="From search to move-in, in three steps"
          sub="No cold calls, no walk-ins to manage. Just a listing that shows you the real room."
        />

        <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
          {STUDENT_STEPS.map(({ icon: Icon, title, body }, index) => (
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

/* ── Closing owner CTA — anonymous visitors only ─────────────*/
function OwnerCtaBanner() {
  return (
    <section className="bg-[var(--color-primary)] py-14 md:py-16">
      <div className="container-app flex flex-col items-center gap-5 text-center">
        <h2 className="max-w-lg font-heading text-[var(--text-h2)] font-[600] text-white">
          Own a hostel near a university?
        </h2>
        <p className="max-w-md text-[var(--text-body)] text-white/90">
          List it on HostelLo and reach students who are already comparing verified hostels in your city.
        </p>
        <Button asChild size="lg" variant="secondary" className="shadow-[var(--shadow-md)]">
          <Link href="/list-your-hostel">
            List Your Hostel
            <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

/* ── Owner home — signed-in owners get a workspace, not marketing ── */
function OwnerHomeView() {
  return (
    <PublicLayout>
      <section className="bg-[var(--color-bg-page)] py-16 md:py-20">
        <div className="container-app max-w-3xl">
          <p className="text-[var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[var(--color-primary-deep)]">
            Owner workspace
          </p>
          <h1 className="mt-2 font-heading text-[var(--text-h2)] font-[600] text-[var(--color-text-heading)]">
            Manage your hostel business
          </h1>
          <p className="mt-3 max-w-lg text-[var(--text-body)] text-[var(--color-text-muted)]">
            Jump back into your listings, bookings, and messages.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {OWNER_QUICK_LINKS.map(({ icon: Icon, label, body, href }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5 transition-colors duration-[var(--transition-fast)] hover:border-[var(--color-primary)]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-faint)]">
                  <Icon
                    size={20}
                    strokeWidth={1.5}
                    className="text-[var(--color-primary-deep)]"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="text-[var(--text-body)] font-[600] text-[var(--color-text-heading)] group-hover:text-[var(--color-primary)]">
                    {label}
                  </p>
                  <p className="mt-0.5 text-[var(--text-body-sm)] text-[var(--color-text-muted)]">{body}</p>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/owner/dashboard"
            className="mt-8 inline-flex items-center gap-1.5 text-[var(--text-body-sm)] font-[600] text-[var(--color-text-link)] hover:underline"
          >
            Go to full dashboard
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default async function HomePage() {
  const session = await auth();

  if (session?.user.role === "OWNER") {
    return <OwnerHomeView />;
  }

  const isAnonymous = !session;
  const hostels = await getRecentHostels();

  return (
    <PublicLayout>
      <Hero isAnonymous={isAnonymous} />
      <TrustSection />
      <BrowseCitiesSection />
      {hostels.length > 0 && <RecentHostelsSection hostels={hostels} />}
      <HowItWorksSection />
      {isAnonymous && <OwnerCtaBanner />}
    </PublicLayout>
  );
}
