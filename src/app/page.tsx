// Path: src/app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  KeyRound,
  MessageCircle,
  Plus,
  Search,
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
import { FieldGuideArtwork } from "@/components/landing/FieldGuideArtwork";

export const metadata: Metadata = {
  title: "HostelLo — Verified Student Hostels in Pakistan",
  description:
    "Compare verified student hostels across Pakistan by city, university, monthly price, and amenities — all in one place.",
};

const OWNER_CTA_IMAGE =
  "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1800&q=80";

const FEATURED_CITIES = CITIES.slice(0, CITIES.length);

const TRUST_CARDS = [
  {
    title: "Verified hostel listings",
    body: "Every hostel is reviewed by our team before students can see or book it, so what you find is real.",
  },
  {
    title: "Real prices before you call",
    body: "See PKR pricing, room photos, and amenities upfront — no need to call five numbers just to compare costs.",
  },
  {
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

/* ── Hero — search-first landing section for students and owners ── */
function Hero({
  isAnonymous,
  userName,
  featuredHostel,
}: {
  isAnonymous: boolean;
  userName?: string | null;
  featuredHostel?: HostelCardData;
}) {
  const firstName = userName?.trim().split(/\s+/)[0];
  const featuredImage = featuredHostel?.coverImage ?? featuredHostel?.images[0] ?? OWNER_CTA_IMAGE;
  const featuredLocation = [featuredHostel?.area, featuredHostel?.city].filter(Boolean).join(", ") || "Find your next city";

  return (
    <SectionFrame className="relative isolate overflow-hidden border-b border-[var(--color-border-default)] bg-[var(--color-bg-sidebar)] py-9 md:py-14">
      <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-[0.16]" aria-hidden="true">
        <defs>
          <pattern id="hostello-paper-grain" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="2" r="0.55" fill="currentColor" />
            <circle cx="8" cy="9" r="0.45" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hostello-paper-grain)" className="text-[color:var(--color-text-heading)]" />
      </svg>

      <div className="container-app grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:gap-16">
        <div className="relative z-10 max-w-[660px] py-2">
          <p className="hero-enter mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] font-[600] uppercase tracking-[0.16em] text-[color:var(--color-text-muted)]">
            <span className="text-[color:var(--color-primary-deep)]">HostelLo field guide</span>
            <span aria-hidden="true">/</span>
            <span>Pakistan · no. 01</span>
          </p>

          <h1 className="hero-enter hero-enter-delay-1 max-w-[16ch] font-display text-[3.4rem] leading-[0.92] tracking-[-0.055em] text-[color:var(--color-text-heading)] sm:text-[4.1rem] md:text-[4.7rem]">
            Find a room
            <span className="block">you <em className="font-[400] text-[color:var(--color-primary-deep)]">actually</em></span>
            <span className="block">want to live in.</span>
          </h1>

          <p className="hero-enter hero-enter-delay-2 mt-5 max-w-[45ch] text-[1.02rem] leading-[1.75] text-[color:var(--color-text-muted)] sm:text-[1.1rem]">
            {firstName
              ? "Pick up where you left off. Compare verified hostels by budget, location, and the details that make a place feel right."
              : "A little less searching in circles. Find a place with a clear price, a real address, and room to make it your own."}
          </p>

          <div className="hero-enter hero-enter-delay-3 mt-7 max-w-[620px]">
            <HeroSearch />
          </div>

          {isAnonymous && (
            <p className="hero-enter hero-enter-delay-3 mt-4 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
              Have a place for students?{" "}
              <Link href="/list-your-hostel" className="font-[600] text-[color:var(--color-text-link)] underline decoration-[var(--color-primary-light)] underline-offset-4 hover:decoration-[var(--color-primary)]">
                List your hostel
              </Link>
            </p>
          )}

          <div className="hero-enter hero-enter-delay-4 mt-7 flex max-w-xl items-start gap-3 border-t border-[var(--color-border-default)] pt-4">
            <span className="pt-0.5 font-mono text-[10px] font-[600] tracking-[0.12em] text-[color:var(--color-primary-deep)]">01—03</span>
            <p className="max-w-[38ch] text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-muted)]">
              Real listings. Monthly rent up front. A calmer way to find your next address.
            </p>
          </div>
        </div>

        <div className="hero-enter hero-enter-delay-3 relative mx-auto w-full max-w-[650px] lg:-mr-3">
          <FieldGuideArtwork
            src={featuredImage}
            name={featuredHostel?.name ?? "A good place to land"}
            location={featuredLocation}
            price={featuredHostel?.pricePerMonth}
            verified={featuredHostel?.verified}
          />
        </div>
      </div>
    </SectionFrame>
  );
}

/* ── Trust / promise section ────────────────────────────────*/
function TrustSection() {
  return (
    <SectionFrame className="bg-[var(--color-bg-card)] py-16 md:py-20">
      <div className="container-app grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div>
          <p className="font-mono text-[10px] font-[600] uppercase tracking-[0.16em] text-[color:var(--color-primary-deep)]">The HostelLo promise / 03</p>
          <h2 className="mt-4 max-w-[11ch] font-display text-[2.6rem] leading-[0.98] tracking-[-0.04em] text-[color:var(--color-text-heading)] sm:text-[3.3rem]">
            Good decisions need good details.
          </h2>
          <p className="mt-4 max-w-[36ch] text-[length:var(--text-body)] leading-relaxed text-[color:var(--color-text-muted)]">
            Before you visit or message, know the things that are usually left out of the first conversation.
          </p>
        </div>

        <div className="border-t border-[var(--color-border-default)]">
          {TRUST_CARDS.map(({ title, body }, index) => (
            <Reveal key={title} delay={index * 0.07}>
              <article className="grid gap-3 border-b border-[var(--color-border-default)] py-5 sm:grid-cols-[4rem_1fr] sm:gap-5">
                <span className="pt-1 font-mono text-[10px] font-[600] tracking-[0.12em] text-[color:var(--color-primary-deep)]">
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
          <p className="font-mono text-[10px] font-[600] uppercase tracking-[0.16em] text-[color:var(--color-primary-deep)]">The city index / 02</p>
          <h2 className="mt-4 max-w-[10ch] font-display text-[2.7rem] leading-[0.98] tracking-[-0.04em] text-[color:var(--color-text-heading)] sm:text-[3.4rem]">
            Where does next take you?
          </h2>
          <p className="mt-4 max-w-[36ch] text-[length:var(--text-body)] leading-relaxed text-[color:var(--color-text-muted)]">
            Start with the city. We’ll help you find the room, the route, and a little more breathing room in your budget.
          </p>
          <Link href="/hostels" className="mt-6 inline-flex items-center gap-2 border-b border-[var(--color-primary)] pb-1 text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-link)] transition-[gap] hover:gap-3">
            Explore every stay <ArrowRight size={14} aria-hidden="true" />
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
      <div className="container-app">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-primary-deep)]">
              Notes from the directory
            </p>
            <h2 className="mt-2 font-display text-[length:var(--text-h2)] font-[500] leading-tight tracking-[-0.025em] text-[color:var(--color-text-heading)]">
              Recently found, ready to compare
            </h2>
          </div>
          <SectionCtaLink href="/hostels">See all hostels</SectionCtaLink>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hostels.slice(1, 6).map((hostel, index) => (
            <Reveal key={hostel.id} delay={index * 0.06} className="h-full">
              <HostelCard hostel={hostel} priority={index < 3} />
            </Reveal>
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}

/* ── How it works (student journey) ─────────────────────────*/
function HowItWorksSection() {
  return (
    <SectionFrame
      id="how-it-works"
      className="scroll-mt-16 border-t border-[var(--color-border-subtle)] bg-[linear-gradient(180deg,var(--color-bg-card)_0%,var(--color-bg-page)_100%)] py-16 pb-24 md:py-20 md:pb-20"
    >
      <div className="container-app">
        <SectionHeading
          eyebrow="A clear path to move-in"
          heading="Search once. Move in with confidence."
          sub="Shortlist a place that fits your campus life, then take the next step when you are ready."
        />

        <div className="mt-12 grid gap-8 border-t border-[var(--color-border-default)] md:grid-cols-3 md:gap-8">
          {STUDENT_STEPS.map(({ icon: Icon, title, body }, index) => (
            <Reveal key={title} delay={index * 0.09}>
              <article className="border-b border-[var(--color-border-default)] pb-6 pt-5 md:border-b-0 md:pb-0">
                <div className="flex items-center justify-between text-[color:var(--color-primary-deep)]">
                  <span className="font-mono text-[10px] font-[600] tracking-[0.15em]">0{index + 1} / 03</span>
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
    <SectionFrame className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(173,75,57,0.22),_transparent_32%),linear-gradient(135deg,#211d19_0%,#322820_100%)]">
      <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(ellipse_at_center,_rgba(233,192,178,0.12),_transparent_68%)]" aria-hidden="true" />

      <div className="container-app relative grid gap-10 py-16 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.62fr)] md:items-center md:py-20">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] font-[600] uppercase tracking-[0.16em] text-[color:var(--color-primary-light)]">
            A note for hostel owners / 04
          </p>
          <h2 className="mt-3 max-w-xl font-display text-[length:var(--text-h2)] font-[500] leading-tight tracking-[-0.025em] text-white">
            Put your rooms in front of students who are ready to compare.
          </h2>
          <p className="mt-4 max-w-xl text-[length:var(--text-body)] leading-relaxed text-white/80">
            Add your hostel, rooms, prices, and photos once. Students can discover the details and contact you from one trusted listing.
          </p>
        </div>

        <div className="border-y border-white/20 py-6 md:border-y-0 md:border-l md:py-2 md:pl-8">
          <p className="font-mono text-[9px] font-[600] uppercase tracking-[0.15em] text-white/60">The short version</p>
          <h3 className="mt-4 max-w-[16ch] font-display text-[1.8rem] leading-[1.08] tracking-[-0.025em] text-white">
            A good place shouldn’t be hard to find.
          </h3>
          <p className="mt-3 max-w-[36ch] text-[length:var(--text-body-sm)] leading-relaxed text-white/70">
            Put the useful details in one place, then let the right student find you.
          </p>
          <Link href="/list-your-hostel" className="group mt-6 inline-flex items-center gap-3 rounded-full bg-[var(--color-primary-light)] px-4 py-3 text-[length:var(--text-body-sm)] font-[700] text-[#261d19] transition-colors hover:bg-[#f0d4c8]">
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
          <h1 className="mt-2 font-heading text-[length:var(--text-h2)] font-[600] text-[color:var(--color-text-heading)]">
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
      <Hero isAnonymous={isAnonymous} userName={session?.user.name} featuredHostel={hostels[0]} />
      <TrustSection />
      {hostels.length > 1 && <RecentHostelsSection hostels={hostels} />}
      <BrowseCitiesSection />
      <HowItWorksSection />
      {isAnonymous && <OwnerCtaBanner />}
    </PublicLayout>
  );
}
