// Path: src/app/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
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
    "Compare verified student hostels across Pakistan by city, university, monthly price, and amenities — all in one place.",
};

const STUDENT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=2000&q=80&auto=format&fit=crop";
const OWNER_CTA_IMAGE =
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1800&q=80&auto=format&fit=crop";

const FEATURED_CITIES = CITIES.slice(0, CITIES.length);

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

function HeroTrustProof() {
  const items = [
    {
      icon: ShieldCheck,
      label: "Verified hostel listings",
      description: "Reviewed before students book.",
    },
    {
      icon: Eye,
      label: "Real prices before you call",
      description: "Monthly rent is visible upfront.",
    },
    {
      icon: Lock,
      label: "Secure booking handoff",
      description: "Your booking stays tracked end to end.",
    },
  ];

  return (
    <div className="grid gap-2 border-t border-white/15 pt-4 sm:grid-cols-3" aria-label="HostelLo trust proof">
      {items.map(({ icon: Icon, label, description }) => (
        <div key={label} className="flex gap-2.5 sm:block">
          <Icon size={17} strokeWidth={1.6} className="mt-0.5 shrink-0 text-white/80" aria-hidden="true" />
          <div>
            <p className="text-[var(--text-body-sm)] font-[700] text-white">{label}</p>
            <p className="mt-0.5 text-[var(--text-caption)] leading-relaxed text-white/70">{description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Hero — search-first for students, with a quiet owner path ── */
function Hero({ isAnonymous, userName }: { isAnonymous: boolean; userName?: string | null }) {
  const firstName = userName?.trim().split(/\s+/)[0];

  return (
    <section className="relative isolate overflow-hidden bg-[var(--color-text-heading)]">
      <Image
        src={STUDENT_HERO_IMAGE}
        alt="Students studying and relaxing together in a hostel common room"
        fill
        priority
        sizes="100vw"
        className="hero-image-drift object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/35" aria-hidden="true" />

      <div className="container-app relative flex min-h-[620px] items-center py-16 md:min-h-[680px] md:py-20">
        <div className="max-w-3xl">
          <p className="hero-enter inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-white backdrop-blur-sm">
            {firstName ? `Welcome back, ${firstName}` : "Verified student living, made simple"}
          </p>

          <h1 className="hero-enter hero-enter-delay-1 mt-5 max-w-2xl font-heading text-[2.5rem] leading-[1.05] font-[600] tracking-[-0.01em] text-white sm:text-[3.5rem] md:text-[4.25rem]">
            {firstName ? "Keep looking for a room that fits your life." : "Find your room. Not a phone number."}
          </h1>

          <p className="hero-enter hero-enter-delay-2 mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-white/85 sm:text-[1.125rem]">
            {firstName
              ? "Pick up where you left off, compare new options, and find a verified hostel near your university."
              : "Compare verified hostels near your university with real PKR prices, photos, and amenities before you make a call."}
          </p>

          <div className="hero-enter hero-enter-delay-3 mt-8 max-w-3xl rounded-[var(--radius-brand)] bg-white/95 p-3 shadow-[var(--shadow-lg)] backdrop-blur-sm sm:p-4">
            <HeroSearch />
          </div>

          <div className="hero-enter hero-enter-delay-4 mt-7 max-w-3xl">
            <HeroTrustProof />
          </div>

          {isAnonymous && (
            <p className="hero-enter hero-enter-delay-5 mt-7 text-[var(--text-body-sm)] text-white/75">
              Own a hostel?{" "}
              <Link href="/list-your-hostel" className="font-[700] text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">
                List it on HostelLo <ArrowRight className="ml-1 inline" size={14} aria-hidden="true" />
              </Link>
            </p>
          )}
        </div>
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
          heading="Choose your next room with confidence"
          sub="The details you need to compare a hostel are visible before you message or visit."
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
          heading="Start with your campus city"
          sub="Explore student hostels in the places where your next semester could begin."
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
              New on HostelLo
            </p>
            <h2 className="mt-2 font-heading text-[var(--text-h2)] font-[600] text-[var(--color-text-heading)]">
              Rooms worth a closer look
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
      className="scroll-mt-16 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] py-16 pb-24 md:py-20 md:pb-20"
    >
      <div className="container-app">
        <SectionHeading
          eyebrow="A clear path to move-in"
          heading="Search once. Move in with confidence."
          sub="Shortlist a place that fits your campus life, then take the next step when you are ready."
        />

        <div className="relative mt-12">
          <div className="absolute left-[11%] right-[11%] top-6 hidden border-t border-dashed border-[var(--color-primary)]/30 md:block" aria-hidden="true" />
          <div className="absolute bottom-6 left-6 top-6 border-l border-dashed border-[var(--color-primary)]/30 md:hidden" aria-hidden="true" />
          <div className="grid gap-8 md:grid-cols-3 md:gap-10">
            {STUDENT_STEPS.map(({ icon: Icon, title, body }, index) => (
              <div key={title} className="relative flex gap-4 md:block">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-primary)]/25 bg-[var(--color-bg-page)] text-[var(--color-primary-deep)] md:h-13 md:w-13">
                  <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-[700] text-white">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <h3 className="mt-0.5 text-[var(--text-h5)] font-[600] text-[var(--color-text-heading)] md:mt-5">
                    {title}
                  </h3>
                  <p className="mt-2 max-w-[34ch] text-[var(--text-body-sm)] leading-relaxed text-[var(--color-text-muted)]">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/hostels"
            className="inline-flex items-center gap-1.5 text-[var(--text-body-sm)] font-[600] text-[var(--color-text-link)] hover:underline"
          >
            Start searching
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Closing owner CTA — anonymous visitors only ─────────────*/
function OwnerCtaBanner() {
  return (
    <section className="relative isolate overflow-hidden bg-[var(--color-text-heading)]">
      <Image
        src={OWNER_CTA_IMAGE}
        alt="A bright shared hostel lounge with comfortable seating"
        fill
        sizes="100vw"
        className="hero-image-drift object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/35" aria-hidden="true" />

      <div className="container-app relative grid gap-8 py-16 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:py-20">
        <div className="max-w-2xl">
          <p className="text-[var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-white/75">
            For hostel owners
          </p>
          <h2 className="mt-3 max-w-xl font-heading text-[var(--text-h2)] font-[600] text-white">
            Put your rooms in front of students who are ready to compare.
          </h2>
          <p className="mt-4 max-w-xl text-[var(--text-body)] leading-relaxed text-white/80">
            Add your hostel, rooms, prices, and photos once. Students can discover the details and contact you from one trusted listing.
          </p>
          <p className="mt-5 text-[var(--text-body-sm)] text-white/60">
            Built for independent hostels across Pakistan.
          </p>
        </div>

        <Button asChild size="lg" className="group w-fit shadow-[var(--shadow-lg)]">
          <Link href="/list-your-hostel">
            List your hostel
            <ArrowRight size={16} strokeWidth={2} className="transition-transform duration-[var(--transition-fast)] group-hover:translate-x-0.5" aria-hidden="true" />
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

  if (session?.user.role === "ADMIN") {
    redirect("/admin");
    return null;
  }

  if (session?.user.role === "OWNER") {
    return <OwnerHomeView />;
  }

  if (session?.user.role === "STUDENT") {
    redirect("/hostels");
  }

  const isAnonymous = !session;
  const hostels = await getRecentHostels();

  return (
    <PublicLayout>
      <Hero isAnonymous={isAnonymous} userName={session?.user.name} />
      <TrustSection />
      {hostels.length > 0 && <RecentHostelsSection hostels={hostels} />}
      <BrowseCitiesSection />
      <HowItWorksSection />
      {isAnonymous && <OwnerCtaBanner />}
    </PublicLayout>
  );
}
