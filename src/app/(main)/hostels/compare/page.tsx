import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AMENITY_MAP } from "@/config/amenities";
import { formatPrice } from "@/lib/utils";
import { BadgeCheck, Star, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = { title: "Compare Hostels" };

interface PageProps {
  searchParams: Promise<Record<string, string | string[]>>;
}

async function getHostelsForCompare(slugs: string[]) {
  if (slugs.length < 2 || slugs.length > 3) return null;
  return db.hostel.findMany({
    where: { slug: { in: slugs }, status: "ACTIVE" },
    select: {
      id: true, name: true, slug: true, city: true, area: true,
      pricePerMonth: true, gender: true, amenities: true,
      coverImage: true, images: true, verified: true,
      rating: true, reviewCount: true, capacity: true,
      rooms: true, minStay: true,
    },
  });
}

const GENDER_LABELS: Record<string, string> = {
  MALE: "Boys only", FEMALE: "Girls only", MIXED: "Mixed",
};

export default async function ComparePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawSlugs = params.slug ?? params.slugs;
  const slugs = (Array.isArray(rawSlugs) ? rawSlugs : rawSlugs ? [rawSlugs] : []).slice(0, 3);

  const hostels = await getHostelsForCompare(slugs);
  if (!hostels || hostels.length < 2) notFound();

  // Collect all amenity IDs across all hostels
  const allAmenityIds = [...new Set(hostels.flatMap((h) => h.amenities))];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/hostels" className="text-sm text-[var(--color-primary-700)] hover:underline mb-4 inline-block">
            ← Back to search
          </Link>
          <h1
            className="text-3xl font-bold text-[var(--color-text)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Compare Hostels
          </h1>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
          <table className="w-full">
            <colgroup>
              <col className="w-40" />
              {hostels.map((h) => <col key={h.id} />)}
            </colgroup>
            <tbody>
              {/* Hostel headers */}
              <tr className="bg-white">
                <td className="px-5 py-5 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-b border-[var(--color-border)]">
                  Hostel
                </td>
                {hostels.map((h) => (
                  <td key={h.id} className="px-5 py-5 border-b border-[var(--color-border)] border-l border-l-[var(--color-border)]">
                    <Link href={`/hostels/${h.slug}`} className="group">
                      <div className="w-full h-36 rounded-xl overflow-hidden bg-[var(--color-sand-100)] mb-3 relative">
                        {(h.coverImage ?? h.images[0]) && (
                          <Image
                            src={h.coverImage ?? h.images[0]}
                            alt={h.name}
                            fill
                            sizes="280px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </div>
                      <p className="font-semibold text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary-700)] transition-colors line-clamp-2">
                        {h.name}
                      </p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-[var(--color-muted)]">
                        <MapPin className="w-3 h-3" />
                        {h.area ? `${h.area}, ` : ""}{h.city}
                      </div>
                    </Link>
                  </td>
                ))}
              </tr>

              {/* Price */}
              <CompareRow label="Price / month">
                {hostels.map((h) => {
                  const minPrice = Math.min(...hostels.map((x) => x.pricePerMonth));
                  const isCheapest = h.pricePerMonth === minPrice;
                  return (
                    <td key={h.id} className="px-5 py-4 border-l border-[var(--color-border)]">
                      <span
                        className={`text-lg font-bold ${isCheapest ? "text-[var(--color-primary-700)]" : "text-[var(--color-text)]"}`}
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {formatPrice(h.pricePerMonth)}
                      </span>
                      {isCheapest && hostels.length > 1 && (
                        <span className="ml-2 text-xs font-medium text-[var(--color-primary-700)] bg-[var(--color-primary-50)] px-1.5 py-0.5 rounded">
                          Cheapest
                        </span>
                      )}
                    </td>
                  );
                })}
              </CompareRow>

              {/* Rating */}
              <CompareRow label="Rating">
                {hostels.map((h) => (
                  <td key={h.id} className="px-5 py-4 border-l border-[var(--color-border)]">
                    {h.reviewCount > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-[var(--color-accent-500)] fill-current" />
                        <span className="font-semibold text-sm">{h.rating.toFixed(1)}</span>
                        <span className="text-xs text-[var(--color-muted)]">({h.reviewCount})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--color-muted)]">No reviews yet</span>
                    )}
                  </td>
                ))}
              </CompareRow>

              {/* Verified */}
              <CompareRow label="Verified">
                {hostels.map((h) => (
                  <td key={h.id} className="px-5 py-4 border-l border-[var(--color-border)]">
                    {h.verified ? (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary-700)]">
                        <BadgeCheck className="w-4 h-4" /> Yes
                      </span>
                    ) : (
                      <span className="text-sm text-[var(--color-muted)]">Not yet</span>
                    )}
                  </td>
                ))}
              </CompareRow>

              {/* Gender */}
              <CompareRow label="Gender">
                {hostels.map((h) => (
                  <td key={h.id} className="px-5 py-4 border-l border-[var(--color-border)]">
                    <span className="text-sm text-[var(--color-text)]">
                      {GENDER_LABELS[h.gender]}
                    </span>
                  </td>
                ))}
              </CompareRow>

              {/* Capacity */}
              <CompareRow label="Capacity">
                {hostels.map((h) => (
                  <td key={h.id} className="px-5 py-4 border-l border-[var(--color-border)]">
                    <span className="text-sm text-[var(--color-text)]">
                      {h.capacity} residents
                    </span>
                  </td>
                ))}
              </CompareRow>

              {/* Min stay */}
              <CompareRow label="Min. stay">
                {hostels.map((h) => (
                  <td key={h.id} className="px-5 py-4 border-l border-[var(--color-border)]">
                    <span className="text-sm text-[var(--color-text)]">
                      {h.minStay} month{h.minStay !== 1 ? "s" : ""}
                    </span>
                  </td>
                ))}
              </CompareRow>

              {/* Amenities section header */}
              <tr className="bg-[var(--color-sand-50)]">
                <td
                  colSpan={hostels.length + 1}
                  className="px-5 py-3 text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider border-t border-b border-[var(--color-border)]"
                >
                  Amenities
                </td>
              </tr>

              {/* Each amenity row */}
              {allAmenityIds.map((amenityId) => {
                const amenity = AMENITY_MAP[amenityId];
                if (!amenity) return null;
                return (
                  <CompareRow key={amenityId} label={`${amenity.emoji} ${amenity.label}`}>
                    {hostels.map((h) => (
                      <td key={h.id} className="px-5 py-3 border-l border-[var(--color-border)] text-center">
                        {h.amenities.includes(amenityId) ? (
                          <span className="text-[var(--color-primary-700)] text-base">✓</span>
                        ) : (
                          <span className="text-[var(--color-sand-300)] text-base">—</span>
                        )}
                      </td>
                    ))}
                  </CompareRow>
                );
              })}

              {/* Book buttons */}
              <tr className="bg-white">
                <td className="px-5 py-5 border-t border-[var(--color-border)]" />
                {hostels.map((h) => (
                  <td key={h.id} className="px-5 py-5 border-t border-[var(--color-border)] border-l border-l-[var(--color-border)]">
                    <Link
                      href={`/hostels/${h.slug}`}
                      className="block w-full text-center py-2.5 rounded-xl bg-[var(--color-primary-900)] text-white text-sm font-semibold hover:bg-[var(--color-primary-800)] transition-colors"
                    >
                      View Hostel
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CompareRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr className="border-b border-[var(--color-border)] hover:bg-[var(--color-sand-50)] transition-colors">
      <td className="px-5 py-4 text-sm font-medium text-[var(--color-muted)]">
        {label}
      </td>
      {children}
    </tr>
  );
}
