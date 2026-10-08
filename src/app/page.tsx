// Path: src/app/page.tsx
import type { Metadata } from "next";
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
import { Card, CardContent } from "@/components/ui/card";
import { PublicLayout } from "@/components/layout/PublicLayout";
import {
  CityGrid,
  SectionCtaLink,
  SectionFrame,
  SectionHeading,
  TrustProof,
} from "@/components/landing/MarketingSections";
import { HostelCard, type HostelCardData } from "@/components/hostel/HostelCard";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { PhotoImage } from "@/components/landing/PhotoImage";

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

const EXPERIENCE_FEATURES = [
  {
    title: "Live in the right part of the city",
    body: "Compare nearby hostels by campus distance, transit access, and daily routine fit.",
    icon: MapPin,
  },
  {
    title: "Know the real monthly cost",
    body: "See all-in pricing, Wi‑Fi, laundry, meals, and room details before you contact anyone.",
    icon: Eye,
  },
  {
    title: "Book with more confidence",
    body: "Messaging, payment handoff, and verification are streamlined inside one trusted flow.",
    icon: ShieldCheck,
  },
] as const;

const PRODUCT_PILLARS = [
  {
    eyebrow: "01 · Discover",
    title: "Compare hostels with real context",
    body: "Filter by city, budget, room type, and campus distance so the shortlist is based on your actual life, not generic listings.",
  },
  {
    eyebrow: "02 · Decide",
    title: "See the details that matter before you book",
    body: "From included utilities to room photos and verified management, every key decision point is visible before the first phone call.",
  },
  {
    eyebrow: "03 · Move in",
    title: "Book and manage the next step confidently",
    body: "Message owners, confirm dates, and complete the handoff in one place without the usual scattered follow-up and uncertainty.",
  },
] as const;

const LUXURY_CATEGORIES = [
  {
    title: "Budget-friendly private rooms",
    body: "Cleaner, more secure spaces with rent clarity and practical amenities.",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Premium shared stays",
    body: "Bright, social, well-located rooms optimized for student routines and campus life.",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Managed hostels near campus",
    body: "Handpicked rooms with verified management, better safety, and easier move-in support.",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "The listing details were so clear that I booked within a day. No vague pricing, no confusing calls.",
    name: "Mahnoor S.",
    meta: "BA Economics, Lahore",
  },
  {
    quote:
      "It feels much more premium than the usual hostel apps. I could compare rooms, safety, and distance in minutes.",
    name: "Ali R.",
    meta: "Computer Science, Islamabad",
  },
  {
    quote:
      "Our hostel listings look polished and it gives students the confidence to reach out without the usual back-and-forth.",
    name: "Ayesha K.",
    meta: "Property owner, Multan",
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
function Hero({ isAnonymous, userName }: { isAnonymous: boolean; userName?: string | null }) {
  const firstName = userName?.trim().split(/\s+/)[0];

  return (
    <SectionFrame className="bg-[var(--color-bg-page)] py-14 md:py-20">
      <div className="container-app">
        <div className="mx-auto max-w-2xl text-center">
          <p className="hero-enter inline-flex items-center rounded-[var(--radius-full)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-3 py-1 text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-primary-deep)]">
            {firstName ? `Welcome back, ${firstName}` : "Student living, refined"}
          </p>

          <h1 className="hero-enter hero-enter-delay-1 mt-5 font-heading text-[2.5rem] leading-[0.98] font-[600] tracking-[-0.02em] text-[color:var(--color-text-heading)] sm:text-[3.2rem] md:text-[3.8rem]">
            Find a room you actually want to live in.
          </h1>

          <p className="hero-enter hero-enter-delay-2 mx-auto mt-5 max-w-xl text-[1.04rem] leading-relaxed text-[color:var(--color-text-muted)] sm:text-[1.125rem]">
            {firstName
              ? "Pick up where you left off and compare verified hostels that match your routine, budget, and campus life."
              : "Compare verified student hostels near your university with clearer pricing, better details, and a booking experience designed around real student life."}
          </p>
        </div>

        <div className="hero-enter hero-enter-delay-3 mx-auto mt-8 max-w-3xl">
          <HeroSearch />
        </div>

        {isAnonymous && (
          <p className="hero-enter hero-enter-delay-3 mt-4 text-center text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
            Own a hostel?{" "}
            <Link href="/list-your-hostel" className="font-[600] text-[color:var(--color-text-link)] hover:underline">
              List your hostel
            </Link>
          </p>
        )}

        <div className="hero-enter hero-enter-delay-4 mx-auto mt-10 max-w-2xl">
          <TrustProof />
        </div>
      </div>
    </SectionFrame>
  );
}

/* ── Experience / feature section ─────────────────────────── */
function ProductNarrativeSection() {
  return (
    <SectionFrame className="bg-[linear-gradient(180deg,#f7f7f7_0%,#ffffff_100%)] py-16 md:py-20">
      <div className="container-app">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-primary-deep)]">
            One platform for every student move
          </p>
          <h2 className="mt-3 font-heading text-[length:var(--text-h2)] font-[600] text-[color:var(--color-text-heading)]">
            More clarity, less friction, better room decisions
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="space-y-4">
            {PRODUCT_PILLARS.map(({ eyebrow, title, body }) => (
              <Card key={title} className="border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.04)]">
                <CardContent className="p-0">
                  <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-primary-deep)]">
                    {eyebrow}
                  </p>
                  <h3 className="mt-3 text-[length:var(--text-h5)] font-[600] text-[color:var(--color-text-heading)]">{title}</h3>
                  <p className="mt-2 text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-muted)]">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-8 h-40 w-40 rounded-full bg-[var(--color-primary-light)]/40 blur-3xl" aria-hidden="true" />
            <div className="absolute bottom-2 right-0 h-48 w-48 rounded-full bg-[var(--color-bg-raised)]/60 blur-3xl" aria-hidden="true" />

            <Card className="relative overflow-hidden border-white/60 bg-white/80 p-3 shadow-[0_18px_52px_rgba(0,0,0,0.08)] backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="rounded-[24px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-page)] p-3">
                  <div className="flex items-center justify-between gap-3 rounded-[18px] bg-[var(--color-bg-card)] px-4 py-3 shadow-sm">
                    <div>
                      <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                        Campus search
                      </p>
                      <p className="mt-1 text-[length:var(--text-body)] font-[600] text-[color:var(--color-text-heading)]">Lahore • GCU • PKR 24k+</p>
                    </div>
                    <div className="rounded-full bg-[var(--color-success-bg)] px-2.5 py-1 text-[10px] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-success-text)]">
                      Verified
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[1.05fr_0.95fr]">
                    <div className="relative min-h-[260px] overflow-hidden rounded-[20px] bg-[var(--color-bg-overlay)]">
                      <PhotoImage
                        src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"
                        alt="A premium hostel room lifestyle image"
                        width={900}
                        height={700}
                        className="h-[260px] w-full object-cover contrast-[1.08] saturate-[1.08]"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-[18px] bg-[var(--color-bg-card)] p-3 shadow-sm">
                        <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                          Best fit
                        </p>
                        <h3 className="mt-2 text-[length:var(--text-h5)] font-[600] text-[color:var(--color-text-heading)]">The Willow House</h3>
                        <p className="mt-2 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">Private room • Wi‑Fi • Laundry • secure entry</p>
                      </div>

                      <div className="rounded-[18px] bg-[var(--color-bg-card)] p-3 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">Monthly rent</span>
                          <span className="font-heading text-[1.7rem] font-[600] leading-none text-[color:var(--color-text-heading)]">PKR 24.5k</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 text-[length:var(--text-caption)] text-[color:var(--color-text-muted)]">
                          <span>4.8 rating</span>
                          <span>2 min to campus</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}

function ExperienceSection() {
  return (
    <SectionFrame className="bg-[linear-gradient(180deg,#f7f7f7_0%,#ffffff_100%)] py-16 md:py-20">
      <div className="container-app grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <SectionHeading
            eyebrow="Built for student life"
            heading="An experience that feels premium, not chaotic"
            sub="We turn noisy, generic hostel discovery into a clear, design-first decision-making tool."
          />

          <div className="mt-10 space-y-4">
            {EXPERIENCE_FEATURES.map(({ icon: Icon, title, body }) => (
              <Card key={title} className="border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-[0_12px_24px_rgba(0,0,0,0.03)]">
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[var(--color-primary-faint)]">
                    <Icon size={20} strokeWidth={1.7} className="text-[color:var(--color-primary-deep)]" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-[length:var(--text-h5)] font-[600] text-[color:var(--color-text-heading)]">{title}</h3>
                    <p className="mt-1 text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-muted)]">{body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="relative min-h-[520px]">
          <div className="absolute -left-6 top-8 h-40 w-40 rounded-full bg-[var(--color-primary-light)]/40 blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-12 right-4 h-44 w-44 rounded-full bg-[var(--color-bg-raised)]/50 blur-3xl" aria-hidden="true" />

          <div className="relative space-y-5 p-2">
            <Card className="float-slow overflow-hidden border-white/50 bg-white/80 p-3 shadow-[0_18px_44px_rgba(0,0,0,0.08)] backdrop-blur-sm">
              <CardContent className="p-0">
                <div className="relative h-[320px] overflow-hidden rounded-[20px] bg-[var(--color-bg-overlay)]">
                  <PhotoImage
                    src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"
                    alt="Modern student hostel room"
                    width={900}
                    height={700}
                    className="relative h-full w-full object-cover contrast-[1.08] saturate-[1.08]"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-5 sm:grid-cols-2">
              <Card className="border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 shadow-[0_12px_26px_rgba(0,0,0,0.04)]">
                <CardContent className="p-0">
                  <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-primary-deep)]">Top pick</p>
                  <h3 className="mt-2 text-[length:var(--text-h4)] font-[600] text-[color:var(--color-text-heading)]">The Willow House</h3>
                  <p className="mt-2 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">Private rooms • 5 min to campus • Wi‑Fi / laundry</p>
                </CardContent>
              </Card>

              <Card className="border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-4 shadow-[0_12px_26px_rgba(0,0,0,0.04)]">
                <CardContent className="p-0">
                  <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-primary-deep)]">Average rent</p>
                  <div className="mt-2 text-[2rem] font-heading font-[600] leading-none text-[color:var(--color-text-heading)]">PKR 25.4k</div>
                  <p className="mt-2 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">Across top verified options</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SectionFrame>
  );
}

/* ── Category showcase ─────────────────────────────────── */
function CategoryShowcase() {
  return (
    <SectionFrame className="bg-[var(--color-bg-page)] py-16 md:py-20">
      <div className="container-app">
        <SectionHeading
          eyebrow="Find your fit"
          heading="Choose the room setup that matches your life"
          sub="Whether you want budget clarity, a premium setup, or a managed stay, HostelLo keeps the decision clear."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {LUXURY_CATEGORIES.map(({ title, body, image }) => (
            <Card key={title} className="group overflow-hidden border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] shadow-[0_12px_28px_rgba(0,0,0,0.05)] transition-all duration-[var(--transition-medium)] hover:-translate-y-1 hover:shadow-[0_22px_46px_rgba(0,0,0,0.08)]">
              <div className="relative h-64 overflow-hidden">
                <PhotoImage src={image} alt={title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover contrast-[1.06] saturate-[1.12] transition-transform duration-[var(--transition-slow)] group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/60 via-[#000000]/10 to-transparent" aria-hidden="true" />
              </div>
              <CardContent className="p-5">
                <h3 className="text-[length:var(--text-h5)] font-[600] text-[color:var(--color-text-heading)]">{title}</h3>
                <p className="mt-2 text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-muted)]">{body}</p>
                <Link href="/hostels" className="mt-4 inline-flex items-center gap-1.5 text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-link)]">
                  Explore options
                  <ArrowRight size={14} strokeWidth={2} aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SectionFrame>
  );
}

/* ── Trust / promise section ────────────────────────────────*/
function TrustSection() {
  return (
    <SectionFrame className="bg-[linear-gradient(180deg,#fafafa_0%,#ffffff_100%)] py-16 md:py-20">
      <div className="container-app">
        <SectionHeading
          eyebrow="The HostelLo promise"
          heading="Choose your next room with confidence"
          sub="The details you need to compare a hostel are visible before you message or visit."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {TRUST_CARDS.map(({ icon: Icon, title, body }) => (
            <Card
              key={title}
              className="border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.04)] transition-transform duration-[var(--transition-base)] hover:-translate-y-1"
            >
              <CardContent className="p-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary-faint)]">
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
    </SectionFrame>
  );
}

/* ── Browse by city ──────────────────────────────────────── */
function BrowseCitiesSection() {
  return (
    <SectionFrame className="border-y border-[var(--color-border-subtle)] bg-[linear-gradient(180deg,#f7f7f7_0%,#ffffff_100%)] py-16 md:py-20">
      <div className="container-app">
        <SectionHeading
          eyebrow="Browse by city"
          heading="Start with your campus city"
          sub="Explore student hostels in the places where your next semester could begin."
        />

        <CityGrid cities={FEATURED_CITIES} />
      </div>
    </SectionFrame>
  );
}

/* ── Social proof / testimonials ───────────────────────── */
function TestimonialsSection() {
  return (
    <SectionFrame className="bg-[linear-gradient(180deg,#ffffff_0%,#fafafa_100%)] py-16 md:py-20">
      <div className="container-app">
        <SectionHeading
          eyebrow="Student stories"
          heading="Reliable homes, real student feedback"
          sub="Comfort, clarity, and trust are what students remember when the room search finally feels easy."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map(({ quote, name, meta }) => (
            <Card key={name} className="border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-6 shadow-[0_12px_24px_rgba(0,0,0,0.04)]">
              <CardContent className="p-0">
                <div className="flex items-center gap-1 text-[color:var(--color-primary)]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={`${name}-${index}`}>★</span>
                  ))}
                </div>
                <p className="mt-4 text-[length:var(--text-body)] leading-relaxed text-[color:var(--color-text-body)]">“{quote}”</p>
                <div className="mt-5 border-t border-[var(--color-border-subtle)] pt-4">
                  <p className="font-[600] text-[color:var(--color-text-heading)]">{name}</p>
                  <p className="text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">{meta}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
              New on HostelLo
            </p>
            <h2 className="mt-2 font-heading text-[length:var(--text-h2)] font-[600] text-[color:var(--color-text-heading)]">
              Rooms worth a closer look
            </h2>
          </div>
          <SectionCtaLink href="/hostels">See all hostels</SectionCtaLink>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hostels.slice(0, 6).map((hostel, index) => (
            <HostelCard key={hostel.id} hostel={hostel} priority={index < 3} />
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
      className="scroll-mt-16 border-t border-[var(--color-border-subtle)] bg-[linear-gradient(180deg,#ffffff_0%,#fafafa_100%)] py-16 pb-24 md:py-20 md:pb-20"
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
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-bg-card)] text-[color:var(--color-primary-deep)] shadow-[0_8px_20px_rgba(0,0,0,0.04)] md:h-13 md:w-13">
                  <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-[700] text-[color:var(--color-text-inverse)]">
                    {index + 1}
                  </span>
                </div>
                <Card className="border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5 shadow-[0_12px_30px_rgba(0,0,0,0.04)] md:mt-5">
                  <CardContent className="p-0">
                    <h3 className="text-[length:var(--text-h5)] font-[600] text-[color:var(--color-text-heading)]">
                      {title}
                    </h3>
                    <p className="mt-2 max-w-[34ch] text-[length:var(--text-body-sm)] leading-relaxed text-[color:var(--color-text-muted)]">
                      {body}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
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
    <SectionFrame className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(232,67,92,0.26),_transparent_30%),linear-gradient(135deg,#1a1a1a_0%,#262626_100%)]">
      <PhotoImage
        dark
        src={OWNER_CTA_IMAGE}
        alt="A bright shared hostel lounge with comfortable seating"
        fill
        sizes="100vw"
        className="hero-image-drift object-cover mix-blend-luminosity opacity-40 contrast-[1.1] saturate-[1.1]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a]/90 via-[#1a1a1a]/80 to-[#1a1a1a]/60" aria-hidden="true" />

      <div className="container-app relative grid gap-8 py-16 md:grid-cols-[minmax(0,1fr)_360px] md:items-center md:py-20">
        <div className="max-w-2xl">
          <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-primary-light)]">
            For hostel owners
          </p>
          <h2 className="mt-3 max-w-xl font-heading text-[length:var(--text-h2)] font-[600] text-white">
            Put your rooms in front of students who are ready to compare.
          </h2>
          <p className="mt-4 max-w-xl text-[length:var(--text-body)] leading-relaxed text-white/80">
            Add your hostel, rooms, prices, and photos once. Students can discover the details and contact you from one trusted listing.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-[length:var(--text-body-sm)] text-white/75">
            <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5">Verified listings</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5">Easy room management</span>
            <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5">Built for Pakistan</span>
          </div>
        </div>

        <Card className="rounded-[28px] border border-white/10 bg-white/8 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-md">
          <div className="rounded-[20px] bg-white/95 p-5 text-left shadow-[var(--shadow-md)]">
            <p className="text-[length:var(--text-caption)] font-[700] uppercase tracking-[0.08em] text-[color:var(--color-primary-deep)]">
              Grow your rooms
            </p>
            <h3 className="mt-2 text-[length:var(--text-h3)] font-[600] text-[color:var(--color-text-heading)]">
              Reach students before they book elsewhere.
            </h3>
            <div className="mt-5 space-y-3 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
              <div className="flex items-center justify-between rounded-[12px] bg-[var(--color-bg-page)] px-3 py-2.5">
                <span>Listings created</span>
                <span className="font-[700] text-[color:var(--color-text-heading)]">2 min</span>
              </div>
              <div className="flex items-center justify-between rounded-[12px] bg-[var(--color-bg-page)] px-3 py-2.5">
                <span>Response time</span>
                <span className="font-[700] text-[color:var(--color-success)]">Fast</span>
              </div>
            </div>
            <Button asChild size="lg" className="group mt-5 w-full shadow-[var(--shadow-md)] rounded-[var(--radius-md)]">
              <Link href="/list-your-hostel">
                List your hostel
                <ArrowRight size={16} strokeWidth={2} className="transition-transform duration-[var(--transition-fast)] group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Card>
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
      <Hero isAnonymous={isAnonymous} userName={session?.user.name} />
      <ProductNarrativeSection />
      <TrustSection />
      <ExperienceSection />
      <CategoryShowcase />
      {hostels.length > 0 && <RecentHostelsSection hostels={hostels} />}
      <BrowseCitiesSection />
      <TestimonialsSection />
      <HowItWorksSection />
      {isAnonymous && <OwnerCtaBanner />}
    </PublicLayout>
  );
}
