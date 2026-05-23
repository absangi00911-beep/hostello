import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GraduationCap, MapPin, ArrowRight, Building2 } from "lucide-react";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { HostelCard, type HostelCardData } from "@/components/hostel/HostelCard";
import { db } from "@/lib/db";
import { getAppUrl } from "@/lib/app-url";
import {
  UNIVERSITIES,
  universityToSlug,
  slugToUniversity,
} from "@hostello/shared";

/* ── Static params — one page per university ─────────────── */
export function generateStaticParams() {
  return UNIVERSITIES.map((u) => ({ slug: universityToSlug(u.shortName) }));
}

/* ── Data ────────────────────────────────────────────────── */
async function getHostelsNearUniversity(city: string): Promise<HostelCardData[]> {
  const hostels = await db.hostel.findMany({
    where: { city, status: "ACTIVE" },
    orderBy: [{ featured: "desc" }, { rating: "desc" }, { reviewCount: "desc" }],
    take: 12,
    select: {
      id: true, name: true, slug: true, city: true, area: true,
      pricePerMonth: true, gender: true, amenities: true,
      coverImage: true, images: true, verified: true, featured: true,
      rating: true, reviewCount: true, capacity: true, rooms: true,
      owner: { select: { id: true, name: true, avatar: true } },
    },
  });
  return hostels.map((h) => ({
    ...h,
    amenities: h.amenities as string[],
    images: h.images as string[],
    gender: h.gender as "MALE" | "FEMALE" | "MIXED",
    owner: { ...h.owner, avatar: h.owner.avatar ?? null },
  }));
}

/* ── Metadata ─────────────────────────────────────────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const uni = slugToUniversity(slug);
  if (!uni) return { title: "University hostels — HostelLo" };

  const count = await db.hostel.count({ where: { city: uni.city, status: "ACTIVE" } });
  const appUrl = getAppUrl();

  return {
    title: `Hostels near ${uni.shortName} ${uni.city} — HostelLo`,
    description: `Find ${count > 0 ? `${count}+ ` : ""}verified student hostels near ${uni.name} in ${uni.city}. Compare prices, amenities, and book online.`,
    alternates: { canonical: `${appUrl}/university/${slug}` },
    openGraph: {
      type: "website",
      url: `${appUrl}/university/${slug}`,
      siteName: "HostelLo",
      title: `Student hostels near ${uni.shortName} — HostelLo`,
      description: `Verified hostels in ${uni.city} for ${uni.shortName} students.`,
    },
  };
}

/* ── Page ─────────────────────────────────────────────────── */
export default async function UniversityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const uni = slugToUniversity(slug);
  if (!uni) notFound();

  const hostels = await getHostelsNearUniversity(uni.city);

  // Other universities in the same city (for cross-links)
  const sisterUnis = UNIVERSITIES.filter(
    (u) => u.city === uni.city && u.shortName !== uni.shortName
  ).slice(0, 4);

  return (
    <PublicLayout>
      <div className="container-app py-10">

        {/* ── Hero header ──────────────────────────────────── */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-faint)] px-3 py-1.5 mb-4">
            <GraduationCap size={14} strokeWidth={1.5} className="text-[var(--color-primary)]" aria-hidden="true" />
            <span className="text-[11px] font-[600] text-[var(--color-primary-deep)] tracking-wide uppercase">
              {uni.shortName}
            </span>
          </div>

          <h1 className="text-[var(--text-h2)] font-[700] text-[var(--color-text-heading)] mb-2"
              style={{ fontFamily: "var(--font-heading)" }}>
            Student hostels near {uni.shortName}
          </h1>

          <div className="flex items-center gap-1.5 text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
            <MapPin size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>{uni.name}</span>
            {uni.area && (
              <>
                <span aria-hidden="true">·</span>
                <span>{uni.area}, {uni.city}</span>
              </>
            )}
          </div>
        </div>

        {/* ── Hostel grid ──────────────────────────────────── */}
        {hostels.length > 0 ? (
          <>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8"
              role="list"
              aria-label={`Hostels in ${uni.city} near ${uni.shortName}`}
            >
              {hostels.map((hostel) => (
                <div key={hostel.id} role="listitem">
                  <HostelCard hostel={hostel} />
                </div>
              ))}
            </div>

            {/* See all in city */}
            <div className="text-center">
              <Link
                href={`/hostels/in/${uni.city.toLowerCase()}`}
                className="inline-flex items-center gap-2 h-10 px-6 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-bg-card)] text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary-deep)] transition-colors"
              >
                See all hostels in {uni.city}
                <ArrowRight size={14} strokeWidth={1.5} aria-hidden="true" />
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 size={36} strokeWidth={1} className="text-[var(--color-text-muted)] mb-4" aria-hidden="true" />
            <p className="text-[var(--text-body)] font-[500] text-[var(--color-text-body)] mb-1">
              No listings yet in {uni.city}
            </p>
            <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
              Check back soon — we're growing fast.
            </p>
          </div>
        )}

        {/* ── Other universities in same city ──────────────── */}
        {sisterUnis.length > 0 && (
          <div className="mt-12 pt-8 border-t border-[var(--color-border-subtle)]">
            <p className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-muted)] mb-3">
              Other universities in {uni.city}
            </p>
            <div className="flex flex-wrap gap-2">
              {sisterUnis.map((s) => (
                <Link
                  key={s.shortName}
                  href={`/university/${universityToSlug(s.shortName)}`}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--text-body-sm)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary-deep)] transition-colors"
                >
                  <GraduationCap size={12} strokeWidth={1.5} aria-hidden="true" />
                  {s.shortName}
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </PublicLayout>
  );
}
