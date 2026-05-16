// Path: src/app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, MessageCircle, Calendar } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { HostelCard, type HostelCardData } from "@/components/hostel/HostelCard";
import { HeroSearch } from "@/components/landing/HeroSearch";

/* -- Data fetching ----------------------------------------- */
async function getFeaturedHostels(): Promise<HostelCardData[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(
      `${baseUrl}/api/hostels?sort=rating&limit=6&verified=true`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

/* -- Photo stack (hero right column) ---------------------- */
function PhotoStack({ images }: { images: string[] }) {
  const photos = images.slice(0, 3);
  const rotations = ["rotate-[5deg]", "-rotate-[3deg]", "rotate-[2deg]"];
  const zIndexes = ["z-10", "z-20", "z-30"];
  const offsets = ["translate-y-4 -translate-x-2", "translate-y-0", "-translate-y-3 translate-x-2"];

  if (photos.length === 0) {
    // Amber-tinted placeholders when no real photos yet
    return (
      <div className="relative h-72 w-full hidden lg:block" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`absolute inset-0 rounded-[var(--radius-xl)] bg-[var(--color-bg-overlay)] border border-[var(--color-border-default)] ${rotations[i]} ${zIndexes[i]} ${offsets[i]}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="relative h-72 w-full hidden lg:block select-none"
      aria-label="Hostel photos preview"
    >
      {photos.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-lg)] ${rotations[i]} ${zIndexes[i]} ${offsets[i]}`}
        >
          <Image
            src={src}
            alt=""
            fill
            className="object-cover"
            sizes="360px"
            priority={i === 2}
          />
        </div>
      ))}
    </div>
  );
}

/* -- How it works step ------------------------------------- */
function HowItWorksStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Large number — Bricolage Grotesque 64px/800, primary-faint color */}
      <span
        className="block text-[4rem] font-[800] leading-none text-[var(--color-primary-faint)] select-none"
        style={{ fontFamily: "var(--font-heading)" }}
        aria-hidden="true"
      >
        {number}
      </span>
      <div>
        <h3
          className="text-[var(--text-h4)] font-[600] text-[var(--color-text-heading)] mb-1"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {title}
        </h3>
        <p className="text-[var(--text-body)] text-[var(--color-text-muted)] leading-relaxed max-w-[28ch]">
          {description}
        </p>
      </div>
    </div>
  );
}

/* -- Page --------------------------------------------------- */
export default async function HomePage() {
  const featuredHostels = await getFeaturedHostels();

  // Collect cover images from featured hostels for the photo stack
  const stackImages = featuredHostels
    .filter((h) => h.coverImage)
    .map((h) => h.coverImage!)
    .slice(0, 3);

  // Use first hostel's city for the featured section heading, or default
  const featuredCity =
    featuredHostels.find((h) => h.city)?.city ?? "Pakistan";

  return (
    <PublicLayout>
      {/* ══════════════════════════════════════════════════════
          SECTION 1 — Hero
          Left 2/3: headline + search
          Right 1/3: rotated photo stack (hidden on mobile)
      ══════════════════════════════════════════════════════ */}
      <section
        className="container-app pt-12 pb-16 md:pt-16 md:pb-20"
        aria-labelledby="hero-heading"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 items-center">
          {/* Left — headline + search */}
          <div className="space-y-6">
            {/* Overline label */}
            <span className="text-overline text-[var(--color-primary)] tracking-widest">
              Student accommodation · Pakistan
            </span>

            {/* H1 */}
            <h1
              id="hero-heading"
              className="text-[2.25rem] sm:text-[2.75rem] md:text-[var(--text-h1)] font-[700] leading-[1.1] tracking-[-0.025em] text-[var(--color-text-heading)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Find your room.{" "}
              <span className="text-[var(--color-primary)]">
                Not a phone number.
              </span>
            </h1>

            <p className="text-[var(--text-body-lg)] text-[var(--color-text-muted)] max-w-[46ch] leading-relaxed">
              Verified hostels near your university. Real prices, real photos,
              direct booking — no calls required.
            </p>

            {/* Search form — first interactive element in tab order */}
            <HeroSearch />
          </div>

          {/* Right — photo stack (desktop only) */}
          <PhotoStack images={stackImages} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — Featured hostels
          3-column grid, heading links to pre-filtered search
      ══════════════════════════════════════════════════════ */}
      {featuredHostels.length > 0 && (
        <section
          className="bg-[var(--color-bg-sidebar)] py-14 md:py-16"
          aria-labelledby="featured-heading"
        >
          <div className="container-app">
            <div className="flex items-baseline justify-between mb-8">
              <Link
                href={`/hostels?city=${encodeURIComponent(featuredCity)}`}
                className="group"
              >
                <h2
                  id="featured-heading"
                  className="text-[var(--text-h3)] font-[600] text-[var(--color-text-heading)] group-hover:text-[var(--color-primary)] transition-colors duration-[var(--transition-fast)]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Verified hostels in {featuredCity}
                </h2>
              </Link>
              <Link
                href="/hostels"
                className="hidden sm:block text-[var(--text-body-sm)] text-[var(--color-text-link)] hover:underline focus-visible:underline focus-visible:outline-none"
              >
                Browse all
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredHostels.slice(0, 6).map((hostel, i) => (
                <HostelCard
                  key={hostel.id}
                  hostel={hostel}
                  priority={i < 3}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION 3 — How it works
          Horizontal numbered list, NOT cards, NO icons
          Numbers are the visual (64px/800 Bricolage)
      ══════════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        className="container-app py-14 md:py-20"
        aria-labelledby="how-heading"
      >
        <h2
          id="how-heading"
          className="text-[var(--text-h3)] font-[600] text-[var(--color-text-heading)] mb-10 md:mb-12"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          How it works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
          <HowItWorksStep
            number="01"
            title="Find"
            description="Search by city, price, and gender. Filter by amenities. Read verified reviews."
          />
          <HowItWorksStep
            number="02"
            title="Contact"
            description="Message the hostel owner directly in-app. No phone numbers, no WhatsApp groups."
          />
          <HowItWorksStep
            number="03"
            title="Book"
            description="Request your room and pay online. Get confirmation before you travel."
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SECTION 4 — For hostel owners
          Split panel: left = amber-drenched, right = benefits + CTA
          This is the ONLY section with amber as a bg color
      ══════════════════════════════════════════════════════ */}
      <section
        className="container-app pb-16 md:pb-20"
        aria-labelledby="owners-heading"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 rounded-[var(--radius-xl)] overflow-hidden shadow-[var(--shadow-md)]">
          {/* Left — amber panel */}
          <div
            className="p-8 md:p-10 flex flex-col justify-between gap-8"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <div>
              <span className="text-overline text-[var(--color-primary-deep)] tracking-widest mb-3 block">
                For hostel owners
              </span>
              <h2
                id="owners-heading"
                className="text-[var(--text-h2)] font-[700] leading-[1.15] tracking-[-0.02em] text-[var(--color-text-heading)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Manage bookings without picking up the phone.
              </h2>
            </div>
            <p className="text-[var(--text-body)] text-[var(--color-primary-deep)] leading-relaxed">
              HostelLo gives hostel owners an online presence, a booking
              system, and direct messaging — all in one place.
            </p>
          </div>

          {/* Right — benefits + CTA */}
          <div
            className="p-8 md:p-10 flex flex-col justify-between gap-8"
            style={{ backgroundColor: "var(--color-bg-card)" }}
          >
            <ul className="space-y-4" role="list">
              {[
                {
                  icon: CheckCircle2,
                  text: "Get discovered by students searching near your university",
                },
                {
                  icon: Calendar,
                  text: "Receive and confirm booking requests from a single dashboard",
                },
                {
                  icon: MessageCircle,
                  text: "Chat with prospective tenants in-app before confirming",
                },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon
                    size={18}
                    strokeWidth={1.5}
                    className="text-[var(--color-action)] mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-[var(--text-body)] text-[var(--color-text-body)]">
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/register?role=OWNER"
              className="inline-flex items-center justify-center h-11 px-6 rounded-[var(--radius-md)] bg-[var(--color-action)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-inverse)] transition-all duration-[var(--transition-base)] hover:bg-[var(--color-action-dark)] active:bg-[var(--color-action-pressed)] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[var(--color-action-light)] focus-visible:outline-offset-2 w-full sm:w-auto"
            >
              List your hostel — it&apos;s free
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
