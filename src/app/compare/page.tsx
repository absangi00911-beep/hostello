import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { db } from "@/lib/db";
import { formatPKR } from "@/components/ui/shared";
import { Check, X, ShieldCheck, Star, ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Compare hostels — HostelLo" };

const AMENITY_LABELS: Record<string, string> = {
  WIFI: "Wi-Fi", AC: "AC", LAUNDRY: "Laundry", MEALS: "Meals included",
  GYM: "Gym", PARKING: "Parking", GENERATOR: "Generator", SECURITY: "Security",
  STUDY_ROOM: "Study room", HOT_WATER: "Hot water",
};

async function getHostels(ids: string[]) {
  return db.hostel.findMany({
    where: { id: { in: ids }, status: "ACTIVE" },
    select: {
      id: true, name: true, slug: true, city: true, area: true,
      pricePerMonth: true, gender: true, rooms: true, capacity: true,
      rating: true, reviewCount: true, verified: true, amenities: true, coverImage: true,
      _count: { select: { reviews: true } },
      reviews: { select: { safety: true }, where: { safety: { gt: 0 } } },
    },
  });
}

type Hostel = Awaited<ReturnType<typeof getHostels>>[number];

function avgSafety(h: Hostel) {
  if (!h.reviews.length) return null;
  return h.reviews.reduce((s, r) => s + r.safety, 0) / h.reviews.length;
}

// Returns true if this hostel's value differs from at least one other
function isDiff<T>(val: T, allVals: T[]) {
  return allVals.some((v) => v !== val);
}

function Cell({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <td className={`px-5 py-3.5 text-center text-[var(--text-body-sm)] align-middle
      ${highlight ? "bg-[#FFF8E1]" : ""}`}
      style={highlight ? { background: "var(--color-warning-faint, #FFF8E1)" } : {}}>
      {children}
    </td>
  );
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.ids ?? "";
  const ids = raw.split(",").filter(Boolean).slice(0, 3);
  if (ids.length < 2) notFound();

  const hostels = await getHostels(ids);
  if (hostels.length < 2) notFound();

  const safetyScores = hostels.map(avgSafety);
  const prices = hostels.map((h) => h.pricePerMonth);
  const genders = hostels.map((h) => h.gender);
  const ratings = hostels.map((h) => h.rating);
  const allAmenities = [...new Set(hostels.flatMap((h) => h.amenities))].sort();

  return (
    <PublicLayout>
      <div className="container-app py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/hostels"
            className="inline-flex items-center gap-1.5 text-[var(--text-body-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] transition-colors"
          >
            <ArrowLeft size={15} strokeWidth={1.5} aria-hidden="true" />
            Back to search
          </Link>
          <span className="text-[var(--color-border-default)]">/</span>
          <h1 className="text-[var(--text-h5)] font-[600] text-[var(--color-text-heading)]">
            Comparing {hostels.length} hostels
          </h1>
        </div>

        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)]">
          <table className="w-full border-collapse bg-[var(--color-bg-card)]" role="table">
            {/* Column headers */}
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <th className="px-5 py-4 text-left text-[var(--text-caption)] font-[500] text-[var(--color-text-muted)] w-36">
                  Feature
                </th>
                {hostels.map((h) => (
                  <th key={h.id} className="px-5 py-4 text-center">
                    {h.coverImage && (
                      <img
                        src={h.coverImage} alt=""
                        className="w-full h-24 object-cover rounded-[var(--radius-md)] mb-3"
                        aria-hidden="true"
                      />
                    )}
                    <Link
                      href={`/hostels/${h.slug}`}
                      className="text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)] hover:text-[var(--color-primary)] transition-colors line-clamp-2"
                    >
                      {h.name}
                    </Link>
                    <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] mt-0.5">
                      {h.area}, {h.city}
                    </p>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {/* Price */}
              <tr>
                <td className="px-5 py-3.5 text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-[500]">Price/mo</td>
                {hostels.map((h, i) => (
                  <Cell key={h.id} highlight={isDiff(h.pricePerMonth, prices)}>
                    <span className="font-[700] text-[var(--color-primary-deep)]">
                      {formatPKR(h.pricePerMonth)}
                    </span>
                  </Cell>
                ))}
              </tr>

              {/* Gender */}
              <tr>
                <td className="px-5 py-3.5 text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-[500]">For</td>
                {hostels.map((h) => (
                  <Cell key={h.id} highlight={isDiff(h.gender, genders)}>
                    {h.gender === "MALE" ? "Boys" : h.gender === "FEMALE" ? "Girls" : "Mixed"}
                  </Cell>
                ))}
              </tr>

              {/* Rating */}
              <tr>
                <td className="px-5 py-3.5 text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-[500]">Rating</td>
                {hostels.map((h, i) => (
                  <Cell key={h.id} highlight={isDiff(h.rating, ratings)}>
                    {h.reviewCount > 0 ? (
                      <span className="inline-flex items-center gap-1 justify-center">
                        <Star size={13} strokeWidth={1.5} className="text-[var(--color-primary)]" fill="currentColor" aria-hidden="true" />
                        <span className="font-[600]">{h.rating.toFixed(1)}</span>
                        <span className="text-[var(--color-text-muted)] text-[11px]">({h.reviewCount})</span>
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-muted)] text-[11px]">No reviews</span>
                    )}
                  </Cell>
                ))}
              </tr>

              {/* Safety */}
              <tr>
                <td className="px-5 py-3.5 text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-[500]">Safety</td>
                {hostels.map((h, i) => (
                  <Cell key={h.id} highlight={isDiff(safetyScores[i], safetyScores)}>
                    {safetyScores[i] != null ? (
                      <span className="inline-flex items-center gap-1 justify-center">
                        <ShieldCheck size={13} strokeWidth={1.5} className="text-[var(--color-primary)]" aria-hidden="true" />
                        <span className="font-[600]">{safetyScores[i]!.toFixed(1)}</span>
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-muted)] text-[11px]">—</span>
                    )}
                  </Cell>
                ))}
              </tr>

              {/* Rooms */}
              <tr>
                <td className="px-5 py-3.5 text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-[500]">Rooms</td>
                {hostels.map((h) => (
                  <Cell key={h.id}>{h.rooms ?? "—"}</Cell>
                ))}
              </tr>

              {/* Amenities */}
              {allAmenities.map((amenity) => {
                const vals = hostels.map((h) => h.amenities.includes(amenity));
                return (
                  <tr key={amenity}>
                    <td className="px-5 py-3.5 text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-[500]">
                      {AMENITY_LABELS[amenity] ?? amenity}
                    </td>
                    {hostels.map((h, i) => (
                      <Cell key={h.id} highlight={isDiff(vals[i], vals)}>
                        {vals[i]
                          ? <Check size={16} strokeWidth={2.5} className="mx-auto text-[var(--color-primary)]" aria-label="Yes" />
                          : <X    size={16} strokeWidth={2}   className="mx-auto text-[var(--color-text-muted)] opacity-30" aria-label="No" />}
                      </Cell>
                    ))}
                  </tr>
                );
              })}

              {/* CTA row */}
              <tr>
                <td className="px-5 py-4" />
                {hostels.map((h) => (
                  <td key={h.id} className="px-5 py-4 text-center">
                    <Link
                      href={`/hostels/${h.slug}`}
                      className="inline-flex h-9 items-center px-5 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[var(--text-body-sm)] font-[500] hover:bg-[var(--color-primary-deep)] transition-colors"
                    >
                      View hostel
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PublicLayout>
  );
}
