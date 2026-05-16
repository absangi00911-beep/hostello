// Path: src/app/hostels/in/[city]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, ArrowRight, GraduationCap, Building2 } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { HostelCard, type HostelCardData } from "@/components/hostel/HostelCard";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import { CITIES, UNIVERSITIES } from "@hostello/shared";

/* ── Static params — one page per city ──────────────────── */
export function generateStaticParams() {
  return CITIES.map((city) => ({
    city: city.toLowerCase(),
  }));
}

/* ── Helpers ─────────────────────────────────────────────── */
function toTitleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function normaliseCity(param: string): string | null {
  const title = toTitleCase(param);
  return CITIES.includes(title as (typeof CITIES)[number]) ? title : null;
}

/* ── Data fetch ──────────────────────────────────────────── */
async function getCityHostels(city: string): Promise<HostelCardData[]> {
  const hostels = await db.hostel.findMany({
    where:   { city, status: "ACTIVE" },
    orderBy: [{ featured: "desc" }, { rating: "desc" }, { reviewCount: "desc" }],
    take:    12,
    select: {
      id:           true,
      name:         true,
      slug:         true,
      city:         true,
      area:         true,
      pricePerMonth: true,
      gender:       true,
      amenities:    true,
      coverImage:   true,
      images:       true,
      verified:     true,
      featured:     true,
      rating:       true,
      reviewCount:  true,
      capacity:     true,
      rooms:        true,
      owner: { select: { id: true, name: true, avatar: true } },
    },
  });
  // Prisma Json fields need casting
  return hostels.map((h) => ({
    ...h,
    amenities: h.amenities as string[],
    images:    h.images    as string[],
    gender:    h.gender    as "MALE" | "FEMALE" | "MIXED",
    owner:     { ...h.owner, avatar: h.owner.avatar ?? null },
  }));
}

async function getCityCount(city: string): Promise<number> {
  return db.hostel.count({ where: { city, status: "ACTIVE" } });
}

/* ── Metadata ─────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: rawCity } = await params;
  const city = normaliseCity(rawCity);
  if (!city) return { title: "Hostels" };

  const count  = await getCityCount(city);
  const APP_URL = getAppUrl();

  return {
    title:       `Student Hostels in ${city} — HostelLo`,
    description: `Browse ${count > 0 ? `${count}+ ` : ""}verified student hostels in ${city}. Compare prices, amenities, and book online. Male, female, and mixed options available.`,
    keywords:    [
      `hostels in ${city}`,
      `student hostel ${city}`,
      `hostel near university ${city}`,
      `cheap hostel ${city} Pakistan`,
      `boys hostel ${city}`,
      `girls hostel ${city}`,
    ],
    alternates: {
      canonical: `${APP_URL}/hostels/in/${rawCity}`,
    },
    openGraph: {
      title:       `Student Hostels in ${city} — HostelLo`,
      description: `Find and book verified student hostels in ${city}.`,
      url:         `${APP_URL}/hostels/in/${rawCity}`,
      type:        "website",
    },
  };
}

/* ── JSON-LD structured data ──────────────────────────────── */
function CityJsonLd({
  city,
  hostels,
  appUrl,
}: {
  city: string;
  hostels: HostelCardData[];
  appUrl: string;
}) {
  const jsonLd = {
    "@context":       "https://schema.org",
    "@type":          "CollectionPage",
    "name":           `Student Hostels in ${city}`,
    "description":    `Verified student hostels in ${city}, Pakistan`,
    "url":            `${appUrl}/hostels/in/${city.toLowerCase()}`,
    "about": {
      "@type":        "Place",
      "name":         city,
      "addressCountry": "PK",
    },
    "hasPart": hostels.slice(0, 5).map((h) => ({
      "@type":        "LodgingBusiness",
      "name":         h.name,
      "url":          `${appUrl}/hostels/${h.slug}`,
      "address": {
        "@type":      "PostalAddress",
        "addressLocality": h.city,
        "addressRegion":   h.area ?? h.city,
        "addressCountry":  "PK",
      },
      "priceRange":   `Rs. ${h.pricePerMonth}/month`,
      ...(h.reviewCount > 0 && {
        "aggregateRating": {
          "@type":       "AggregateRating",
          "ratingValue": h.rating.toFixed(1),
          "reviewCount": h.reviewCount,
          "bestRating":  "5",
          "worstRating": "1",
        },
      }),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/* ── FAQ items per city ───────────────────────────────────── */
function getCityFaqs(city: string, count: number) {
  const unis = UNIVERSITIES.filter((u) => u.city === city);
  const topUni = unis[0]?.shortName ?? "local universities";

  return [
    {
      q: `How much does a student hostel in ${city} cost?`,
      a: `Student hostel prices in ${city} typically range from Rs. 5,000 to Rs. 20,000 per month depending on room type, amenities, and proximity to universities. HostelLo lists verified options across this range.`,
    },
    {
      q: `Are there girls-only hostels in ${city}?`,
      a: `Yes. HostelLo lists female-only, male-only, and mixed hostels in ${city}. Use the gender filter on the search page to see only girls' hostels.`,
    },
    {
      q: `Which areas in ${city} have hostels near ${topUni}?`,
      a: unis.length > 0
        ? `Hostels are commonly found near ${unis.slice(0, 3).map((u) => u.area ?? u.city).filter(Boolean).join(", ")} where ${unis.slice(0, 3).map((u) => u.shortName).join(", ")} are located. Filter by area on the search page.`
        : `Hostels are typically located near the main university districts of ${city}. Use the search to filter by area.`,
    },
    {
      q: `How do I book a hostel in ${city} on HostelLo?`,
      a: `Browse ${count > 0 ? `${count} ` : ""}verified hostels on this page, open a listing to view photos and details, then click "Request booking". The owner is notified and you receive email confirmation.`,
    },
  ];
}

/* ── Page ─────────────────────────────────────────────────── */
export default async function CityLandingPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: rawCity } = await params;
  const city = normaliseCity(rawCity);
  if (!city) notFound();

  const [hostels, count] = await Promise.all([
    getCityHostels(city),
    getCityCount(city),
  ]);

  const cityUniversities = UNIVERSITIES.filter((u) => u.city === city);
  const faqs             = getCityFaqs(city, count);
  const APP_URL          = getAppUrl();

  return (
    <PublicLayout>
      <CityJsonLd city={city} hostels={hostels} appUrl={APP_URL} />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        className="border-b border-[var(--color-border-subtle)]"
        style={{ background: "var(--color-bg-raised)" }}
      >
        <div className="container-app py-10 md:py-14">
          <div className="flex items-center gap-2 mb-3 text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
            <Link href="/hostels" className="hover:text-[var(--color-text-body)] transition-colors">
              All hostels
            </Link>
            <span aria-hidden="true">›</span>
            <span style={{ color: "var(--color-text-body)" }}>{city}</span>
          </div>

          <h1
            className="text-[var(--text-h2)] font-[700] text-[var(--color-text-heading)] mb-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Student Hostels in {city}
          </h1>

          <p className="text-[var(--text-body)] text-[var(--color-text-muted)] max-w-[560px] mb-6">
            {count > 0
              ? `${count} verified hostel${count !== 1 ? "s" : ""} available. Compare prices, amenities, and book online.`
              : "Be the first hostel listed in this city."}
          </p>

          {/* Gender filter quick links */}
          <div className="flex flex-wrap gap-2">
            {(["All", "Male only", "Female only", "Mixed"] as const).map((label) => {
              const genderParam = label === "All" ? "" : label === "Male only" ? "MALE" : label === "Female only" ? "FEMALE" : "MIXED";
              const href = `/hostels?city=${encodeURIComponent(city)}${genderParam ? `&gender=${genderParam}` : ""}`;
              return (
                <Link
                  key={label}
                  href={href}
                  className="inline-flex items-center h-8 px-3 rounded-full border text-[var(--text-body-sm)] font-[500] transition-all duration-[var(--transition-fast)] hover:-translate-y-px"
                  style={{
                    borderColor: "var(--color-border-default)",
                    background:  "var(--color-bg-card)",
                    color:       "var(--color-text-body)",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <div className="container-app py-10 space-y-16">

        {/* ── Hostel grid ─────────────────────────────────── */}
        <section aria-labelledby="hostels-heading">
          <div className="flex items-center justify-between mb-6">
            <h2
              id="hostels-heading"
              className="text-[var(--text-h4)] font-[600] text-[var(--color-text-heading)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {count > 0 ? `Top hostels in ${city}` : `Hostels in ${city}`}
            </h2>
            {count > 12 && (
              <Link
                href={`/hostels?city=${encodeURIComponent(city)}`}
                className="inline-flex items-center gap-1 text-[var(--text-body-sm)] font-[500] transition-colors duration-[var(--transition-fast)]"
                style={{ color: "var(--color-primary-deep)" }}
              >
                See all {count}
                <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
              </Link>
            )}
          </div>

          {hostels.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 rounded-[var(--radius-xl)] border-2 border-dashed text-center"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              <Building2
                size={36}
                strokeWidth={1.5}
                style={{ color: "var(--color-text-muted)" }}
                className="mb-3"
                aria-hidden="true"
              />
              <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                No listings in {city} yet. Check back soon.
              </p>
              <Link
                href="/hostels"
                className="mt-4 inline-flex items-center gap-1.5 text-[var(--text-body-sm)] font-[500]"
                style={{ color: "var(--color-primary-deep)" }}
              >
                Browse all cities
                <ArrowRight size={13} strokeWidth={1.5} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {hostels.map((hostel) => (
                  <HostelCard key={hostel.id} hostel={hostel} />
                ))}
              </div>

              {count > 12 && (
                <div className="mt-8 text-center">
                  <Link
                    href={`/hostels?city=${encodeURIComponent(city)}`}
                    className="inline-flex items-center gap-2 h-10 px-6 rounded-[var(--radius-md)] border text-[var(--text-body-sm)] font-[600] transition-all duration-[var(--transition-base)] hover:-translate-y-px hover:shadow-[var(--shadow-sm)]"
                    style={{
                      borderColor: "var(--color-border-default)",
                      background:  "var(--color-bg-card)",
                      color:       "var(--color-text-body)",
                    }}
                  >
                    View all {count} hostels in {city}
                    <ArrowRight size={15} strokeWidth={1.5} aria-hidden="true" />
                  </Link>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── Universities ─────────────────────────────────── */}
        {cityUniversities.length > 0 && (
          <section aria-labelledby="unis-heading">
            <div className="flex items-center gap-2 mb-5">
              <GraduationCap
                size={20}
                strokeWidth={1.5}
                style={{ color: "var(--color-primary)" }}
                aria-hidden="true"
              />
              <h2
                id="unis-heading"
                className="text-[var(--text-h4)] font-[600] text-[var(--color-text-heading)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Universities in {city}
              </h2>
            </div>
            <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] mb-5 max-w-[600px]">
              HostelLo lists hostels near all major universities in {city}. Click a university to see hostels in that area.
            </p>
            <div className="flex flex-wrap gap-2">
              {cityUniversities.map((uni) => (
                <Link
                  key={uni.shortName}
                  href={`/hostels?city=${encodeURIComponent(city)}${uni.area ? `&q=${encodeURIComponent(uni.area)}` : ""}`}
                  className="inline-flex flex-col gap-0.5 px-3 py-2 rounded-[var(--radius-md)] border transition-all duration-[var(--transition-fast)] hover:-translate-y-px hover:shadow-[var(--shadow-sm)]"
                  style={{
                    borderColor: "var(--color-border-default)",
                    background:  "var(--color-bg-card)",
                  }}
                >
                  <span
                    className="text-[var(--text-body-sm)] font-[600]"
                    style={{ color: "var(--color-text-heading)" }}
                  >
                    {uni.shortName}
                  </span>
                  {uni.area && (
                    <span
                      className="text-[var(--text-caption)] flex items-center gap-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <MapPin size={10} strokeWidth={1.5} aria-hidden="true" />
                      {uni.area}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Other cities ─────────────────────────────────── */}
        <section aria-labelledby="other-cities-heading">
          <h2
            id="other-cities-heading"
            className="text-[var(--text-h5)] font-[600] text-[var(--color-text-heading)] mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Hostels in other cities
          </h2>
          <div className="flex flex-wrap gap-2">
            {CITIES.filter((c) => c !== city).map((c) => (
              <Link
                key={c}
                href={`/hostels/in/${c.toLowerCase()}`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[var(--text-body-sm)] font-[500] transition-all duration-[var(--transition-fast)] hover:-translate-y-px"
                style={{
                  borderColor: "var(--color-border-subtle)",
                  background:  "var(--color-bg-sidebar)",
                  color:       "var(--color-text-muted)",
                }}
              >
                <MapPin size={11} strokeWidth={1.5} aria-hidden="true" />
                {c}
              </Link>
            ))}
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────── */}
        <section aria-labelledby="faq-heading">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type":    "FAQPage",
                "mainEntity": faqs.map(({ q, a }) => ({
                  "@type":          "Question",
                  "name":           q,
                  "acceptedAnswer": { "@type": "Answer", "text": a },
                })),
              }),
            }}
          />

          <h2
            id="faq-heading"
            className="text-[var(--text-h4)] font-[600] text-[var(--color-text-heading)] mb-6"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Frequently asked questions
          </h2>
          <dl className="space-y-5">
            {faqs.map(({ q, a }) => (
              <div
                key={q}
                className="rounded-[var(--radius-lg)] border px-5 py-4"
                style={{
                  borderColor: "var(--color-border-subtle)",
                  background:  "var(--color-bg-card)",
                }}
              >
                <dt
                  className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)] mb-2"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {q}
                </dt>
                <dd className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] leading-relaxed">
                  {a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

      </div>
    </PublicLayout>
  );
}