// Path: src/app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  KeyRound,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { CITIES } from "@hostello/shared";
import { auth } from "@/lib/auth/config";
import { getAppUrl } from "@/lib/app-url";
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  CityGrid,
  SectionCtaLink,
  SectionFrame,
  SectionHeading,
} from "@/components/landing/MarketingSections";
import { Reveal } from "@/components/landing/Reveal";
import { HostelCard, type HostelCardData } from "@/components/hostel/HostelCard";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { RotatingCity } from "@/components/landing/RotatingCity";
import { PhotoImage } from "@/components/landing/PhotoImage";
import { formatPKR } from "@/components/ui/shared";

export const metadata: Metadata = {
  title: "HostelLo — Verified Student Hostels in Pakistan",
  description:
    "Search student hostel listings across Pakistan by city, rent, university, and amenities.",
};

const OWNER_CTA_IMAGE =
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1800&q=80";

const FEATURED_CITIES = CITIES.slice(0, CITIES.length);

const TRUST_CARDS = [
  {
    title: "Check for verified listings",
    body: "Our team reviews listings marked as verified. Check the room details and photos, and ask the owner about anything you’re unsure of.",
  },
  {
    title: "See monthly rent",
    body: "See the listed rent, location, photos, and amenities before you contact a hostel.",
  },
  {
    title: "Send a booking request",
    body: "Request a booking through HostelLo, then check its status from your account.",
  },
] as const;

const STUDENT_STEPS = [
  {
    icon: Search,
    title: "Search hostels",
    body: "Narrow the listings by city, university, rent, and amenities.",
  },
  {
    icon: MessageCircle,
    title: "Check the details",
    body: "Review rent, location, photos, and amenities. Message the hostel if you have questions.",
  },
  {
    icon: KeyRound,
    title: "Request a booking",
    body: "Send a request through HostelLo and check your account for updates.",
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
    const res = await fetch(`${baseUrl}/api/hostels?sort=newest&limit=7`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

/* ── Hero — search-first landing section for students and owners ── */
function Hero({
  userName,
  featuredHostel,
}: {
  userName?: string | null;
  featuredHostel?: HostelCardData;
}) {
  const firstName = userName?.trim().split(/\s+/)[0];
  const featuredImage = featuredHostel?.coverImage ?? featuredHostel?.images[0] ?? OWNER_CTA_IMAGE;
  const featuredLocation = [featuredHostel?.area, featuredHostel?.city].filter(Boolean).join(", ") || "Browse listings by city";

  return (
    <SectionFrame className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] py-10 md:py-14 lg:py-16">
      <div className="container-app grid gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12">
        <div className="min-w-0 max-w-[650px] py-1">
          <p className="hero-enter mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3 py-1.5 font-narrow text-[length:var(--text-caption)] font-[600] text-[color:var(--color-text-muted)]">
            <MapPin size={13} className="text-[color:var(--color-primary)]" aria-hidden="true" />
            Student hostels across Pakistan
          </p>

          <h1 className="hero-enter hero-enter-delay-1 max-w-[15ch] animate-[heroFadeUp_900ms_ease-out] font-display text-[2.9rem] font-[600] leading-[0.92] tracking-[-0.055em] text-[color:var(--color-text-heading)] sm:text-[3.9rem] md:text-[4.4rem]">
            Find student hostels in <RotatingCity />
          </h1>

          <p className="hero-enter hero-enter-delay-2 mt-5 max-w-[48ch] text-[length:var(--text-body-lg)] leading-relaxed text-[color:var(--color-text-muted)]">
            {firstName
              ? `Welcome back, ${firstName}. Browse hostels by location, rent, and amenities.`
              : "Browse hostel listings by location, rent, and amenities before contacting the owner."}
          </p>

          <div className="hero-enter hero-enter-delay-3 mt-7 max-w-[640px]">
            <HeroSearch />
          </div>

        </div>

        <div className="hero-enter hero-enter-delay-3 relative mx-auto w-full max-w-[620px] lg:ml-auto">
          <figure className="relative aspect-[1.08] overflow-hidden rounded-[24px] border border-[var(--color-border-default)] bg-[var(--color-bg-overlay)] shadow-[var(--shadow-md)] sm:aspect-[1.14]">
            <PhotoImage
              src={featuredImage}
              alt={`Room at ${featuredHostel?.name ?? "a student hostel"}`}
              fill
              preload
              sizes="(max-width: 1024px) 100vw, 46vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#191714]/85 via-[#191714]/10 to-transparent" aria-hidden="true" />

            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
              <span className="rounded-full bg-[var(--color-bg-card)]/95 px-3 py-1.5 text-[length:var(--text-caption)] font-[700] text-[color:var(--color-text-heading)] shadow-sm">
                Hostel listing
              </span>
              {featuredHostel?.verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-bg-card)]/95 px-3 py-1.5 text-[length:var(--text-caption)] font-[700] text-[color:var(--color-success-text)] shadow-sm">
                  <ShieldCheck size={14} aria-hidden="true" />
                  Verified
                </span>
              )}
            </div>

            <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5 text-[color:var(--color-text-inverse)] sm:p-6">
              <div className="min-w-0">
                <p className="mb-1 font-mono text-[11px] font-[600] uppercase tracking-[0.14em] text-white/75">
                  {featuredHostel ? "Featured hostel" : "Hostel listings"}
                </p>
                <h2 className="truncate font-heading text-[1.35rem] font-[700] tracking-[-0.025em] text-[color:var(--color-text-inverse)] sm:text-[1.6rem]">
                  {featuredHostel?.name ?? "Browse student hostels"}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-[length:var(--text-body-sm)] text-white/85">
                  <MapPin size={14} aria-hidden="true" />
                  <span className="truncate">{featuredLocation}</span>
                </p>
              </div>
              {featuredHostel?.pricePerMonth != null && (
                <p className="shrink-0 text-right">
                  <span className="block text-[length:var(--text-caption)] text-white/75">Monthly rent</span>
                  <span className="font-heading text-[1.1rem] font-[700]">
                    {formatPKR(featuredHostel.pricePerMonth)}
                  </span>
                </p>
              )}
            </figcaption>
          </figure>
        </div>
      </div>
    </SectionFrame>
  );
}

/* ── Listing details and verification ──────────────────────*/
function TrustSection() {
  return (
    <SectionFrame className="bg-[var(--color-bg-card)] py-16 md:py-20">
      <div className="container-app grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div>
          <h2 className="max-w-[11ch] font-display text-[2.6rem] leading-[0.98] tracking-[-0.04em] text-[color:var(--color-text-heading)] sm:text-[3.3rem]">
            Check the details that matter.
          </h2>
          <p className="mt-4 max-w-[36ch] text-[length:var(--text-body)] leading-relaxed text-[color:var(--color-text-muted)]">
            Review rent, location, photos, and amenities before contacting a hostel.
          </p>
        </div>

        <div className="border-t border-[var(--color-border-default)]">
          {TRUST_CARDS.map(({ title, body }, index) => (
            <Reveal key={title} delay={index * 0.07}>
              <article className="grid gap-3 border-b border-[var(--color-border-default)] py-5 sm:grid-cols-[4rem_1fr] sm:gap-5">
                <span className="pt-1 font-mono text-[11px] font-[600] tracking-[0.12em] text-[color:var(--color-primary-deep)]">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-display text-[1.4rem] leading-tight tracking-[-0.02em] text-[color:var(--color-text-heading)]">
                    {title}
                  </h3>
                  <p className="mt-2 max-w-[56ch] text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-muted)]">
                    {body}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}

/* ── Browse by city ──────────────────────────────────────── */
function BrowseCitiesSection() {
  return (
    <SectionFrame className="border-y border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] py-16 md:py-20">
      <div className="container-app grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="max-w-[10ch] font-display text-[2.7rem] leading-[0.98] tracking-[-0.04em] text-[color:var(--color-text-heading)] sm:text-[3.4rem]">
            Search hostels by city.
          </h2>
          <p className="mt-4 max-w-[36ch] text-[length:var(--text-body)] leading-relaxed text-[color:var(--color-text-muted)]">
            Choose a city to see its hostel listings and prices.
          </p>
          <Link href="/hostels" className="mt-6 inline-flex items-center gap-2 border-b border-[var(--color-primary)] pb-1 text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-link)] transition-[gap] hover:gap-3">
            Browse all hostels <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>

        <CityGrid cities={FEATURED_CITIES} />
      </div>
    </SectionFrame>
  );
}

/* ── Recently added hostels ──────────────────────────────── */
function RecentHostelsSection({ hostels }: { hostels: HostelCardData[] }) {
  return (
    <SectionFrame className="bg-[var(--color-bg-page)] py-16 md:py-20">
      <div className="container-app max-w-[1720px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-[length:var(--text-h2)] font-[500] leading-tight tracking-[-0.025em] text-[color:var(--color-text-heading)]">
              Recently added hostels
            </h2>
          </div>
          <SectionCtaLink href="/hostels">See all hostels</SectionCtaLink>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 min-[1920px]:grid-cols-6">
          {hostels.slice(1, 7).map((hostel, index) => (
            <Reveal key={hostel.id} delay={index * 0.06} className="h-full">
              <HostelCard hostel={hostel} />
            </Reveal>
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}

/* ── How it works ──────────────────────────────────────────*/
function HowItWorksSection() {
  return (
    <SectionFrame
      id="how-it-works"
      className="scroll-mt-16 border-t border-[var(--color-border-subtle)] bg-[linear-gradient(180deg,var(--color-bg-card)_0%,var(--color-bg-page)_100%)] py-16 pb-24 md:py-20 md:pb-20"
    >
      <div className="container-app">
        <SectionHeading
          heading="Find a hostel in three steps."
          sub="Review a listing, ask the hostel questions, and send a booking request online."
        />

        <div className="mt-12 grid gap-8 border-t border-[var(--color-border-default)] md:grid-cols-3 md:gap-8">
          {STUDENT_STEPS.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 0.09}>
              <article className="border-b border-[var(--color-border-default)] pb-6 pt-5 md:border-b-0 md:pb-0">
                <div className="flex items-center justify-between text-[color:var(--color-primary-deep)]">
                  <span className="font-mono text-[11px] font-[600] tracking-[0.15em]">0{index + 1} / 03</span>
                  <Icon size={16} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <h3 className="mt-7 font-display text-[1.6rem] leading-tight tracking-[-0.02em] text-[color:var(--color-text-heading)]">
                  {title}
                </h3>
                <p className="mt-3 max-w-[34ch] text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-muted)]">
                  {body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/hostels"
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-action)] px-5 py-3 text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-inverse)] shadow-[var(--shadow-md)] transition-transform duration-[var(--transition-base)] hover:-translate-y-0.5 hover:bg-[var(--color-action-dark)]"
          >
            Start searching
            <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </SectionFrame>
  );
}

/* ── Closing owner CTA — anonymous visitors only ─────────────*/
function OwnerCtaBanner() {
  return (
    <SectionFrame className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,_color-mix(in_oklab,var(--color-primary)_22%,transparent),_transparent_32%),linear-gradient(135deg,#211d19_0%,#322820_100%)]">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_center,_color-mix(in_oklab,var(--color-primary-light)_32%,transparent),_transparent_68%)]" aria-hidden="true" />

      <div className="container-app relative grid gap-10 py-16 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.62fr)] md:items-center md:py-20">
        <div className="max-w-2xl">
          <h2 className="max-w-xl font-display text-[length:var(--text-h2)] font-[500] leading-tight tracking-[-0.025em] text-white">
            List your hostel on HostelLo.
          </h2>
          <p className="mt-4 max-w-xl text-[length:var(--text-body)] leading-relaxed text-white/80">
            Add your rooms, prices, photos, and amenities. Students searching in your city can view the listing and contact you.
          </p>
        </div>

        <div className="border-y border-white/20 py-6 md:border-y-0 md:border-l md:py-2 md:pl-8">
          <h3 className="max-w-[16ch] font-display text-[1.8rem] leading-[1.08] tracking-[-0.025em] text-white">
            Add your hostel details.
          </h3>
          <p className="mt-3 max-w-[36ch] text-[length:var(--text-body-sm)] leading-relaxed text-white/70">
            Create a listing with your prices, photos, and room information.
          </p>
          <Link href="/list-your-hostel" className="group mt-6 inline-flex items-center gap-3 rounded-full bg-[var(--color-primary-light)] px-4 py-3 text-[length:var(--text-body-sm)] font-[700] text-[#261d19] transition-colors hover:bg-digital-blue-200">
            List your hostel
            <ArrowRight size={15} strokeWidth={2} className="transition-transform duration-[var(--transition-fast)] group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </SectionFrame>
  );
}

/* ── Owner home — signed-in owners get a workspace, not marketing ── */
function OwnerHomeView() {
  return (
    <PublicLayout>
      <section className="bg-[var(--color-bg-page)] py-16 md:py-20">
        <div className="container-app max-w-3xl">
          <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-primary-deep)]">
            Owner workspace
          </p>
          <h1 className="mt-2 text-[length:var(--text-h2)] text-[color:var(--color-text-heading)]">
            Manage your hostel business
          </h1>
          <p className="mt-3 max-w-lg text-[length:var(--text-body)] text-[color:var(--color-text-muted)]">
            Jump back into your listings, bookings, and messages.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {OWNER_QUICK_LINKS.map(({ icon: Icon, label, body, href }) => (
              <Link key={href} href={href} className="block">
                <Card className="group h-full border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5 transition-colors duration-[var(--transition-fast)] hover:border-[var(--color-primary)]">
                  <CardContent className="flex items-start gap-4 p-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-faint)]">
                      <Icon
                        size={20}
                        strokeWidth={1.5}
                        className="text-[color:var(--color-primary-deep)]"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className="text-[length:var(--text-body)] font-[600] text-[color:var(--color-text-heading)] group-hover:text-[color:var(--color-primary)]">
                        {label}
                      </p>
                      <p className="mt-0.5 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">{body}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Link
            href="/owner/dashboard"
            className="mt-8 inline-flex items-center gap-1.5 text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-link)] hover:underline"
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
      <Hero userName={session?.user.name} featuredHostel={hostels[0]} />
      <TrustSection />
      {hostels.length > 1 && <RecentHostelsSection hostels={hostels} />}
      <BrowseCitiesSection />
      <HowItWorksSection />
      {isAnonymous && <OwnerCtaBanner />}
    </PublicLayout>
  );
}
