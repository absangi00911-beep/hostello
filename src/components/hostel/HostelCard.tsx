// Path: src/components/hostel/HostelCard.tsx
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Star, Users, Mars, Venus, Equal } from "lucide-react";
import { formatPKR } from "@/components/ui/shared";

export interface HostelCardData {
  id: string;
  name: string;
  slug: string;
  city: string;
  area?: string | null;
  pricePerMonth: number;
  gender: "MALE" | "FEMALE" | "MIXED";
  amenities: string[];
  coverImage?: string | null;
  images: string[];
  verified: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  capacity: number;
  rooms: number;
  owner: { id: string; name: string; avatar?: string | null };
}

const GENDER_LABELS = {
  MALE:   { label: "Male only",   icon: Mars },
  FEMALE: { label: "Female only", icon: Venus },
  MIXED:  { label: "Mixed",       icon: Equal },
} as const;

interface HostelCardProps {
  hostel: HostelCardData;
  /** Compact horizontal layout — used in comparison, favorites list */
  compact?: boolean;
  priority?: boolean;
}

export function HostelCard({ hostel, compact = false, priority = false }: HostelCardProps) {
  const coverSrc = hostel.coverImage ?? hostel.images[0] ?? null;
  const GenderIcon = GENDER_LABELS[hostel.gender].icon;
  const genderLabel = GENDER_LABELS[hostel.gender].label;

  // Top 3 chips: gender, city/area, first amenity
  const chips = [
    genderLabel,
    hostel.area ? hostel.area : hostel.city,
    hostel.amenities[0] ?? null,
  ].filter(Boolean) as string[];

  if (compact) {
    return (
      <Link
        href={`/hostels/${hostel.slug}`}
        className="group flex gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-3 transition-shadow duration-[var(--transition-base)] hover:shadow-[var(--shadow-sm)]"
      >
        {/* Thumbnail */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)]">
          {coverSrc ? (
            <Image
              src={coverSrc}
              alt={hostel.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="h-full w-full bg-[var(--color-bg-overlay)] flex items-center justify-center">
              <GenderIcon size={20} strokeWidth={1.5} className="text-[var(--color-text-muted)]" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[var(--text-body-sm)] font-[600] text-[var(--color-text-heading)]"
             style={{ fontFamily: "var(--font-heading)" }}>
            {hostel.name}
          </p>
          <p className="text-[var(--text-caption)] text-[var(--color-text-muted)] mt-0.5">
            {hostel.city}{hostel.area ? `, ${hostel.area}` : ""}
          </p>
          <p className="text-[var(--text-body-sm)] font-[700] text-[var(--color-primary-deep)] mt-1">
            {formatPKR(hostel.pricePerMonth)}<span className="font-[400] text-[var(--color-text-muted)]">/mo</span>
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/hostels/${hostel.slug}`}
      className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] overflow-hidden transition-all duration-[180ms] ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
      aria-label={`${hostel.name} — ${formatPKR(hostel.pricePerMonth)} per month`}
    >
      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-[var(--color-bg-overlay)]">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={hostel.name}
            fill
            priority={priority}
            className="object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <GenderIcon size={32} strokeWidth={1.5} className="text-[var(--color-text-muted)]" aria-hidden="true" />
          </div>
        )}

        {/* Bottom gradient for text legibility if overlaid */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent"
        />

        {/* Verified badge — top-left */}
        {hostel.verified && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-[var(--color-primary-faint)] px-2 py-0.5 text-[10px] font-[600] text-[var(--color-primary-deep)]">
            <ShieldCheck size={11} strokeWidth={1.5} aria-hidden="true" />
            Verified
          </span>
        )}

        {/* Featured badge — top-right */}
        {hostel.featured && (
          <span className="absolute right-2 top-2 rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-[600] text-[var(--color-text-heading)]">
            Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4">
        {/* Name */}
        <h3
          className="truncate text-[var(--text-h5)] font-[600] text-[var(--color-text-heading)] leading-snug"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {hostel.name}
        </h3>

        {/* Price */}
        <p className="text-[1.25rem] font-[700] leading-none text-[var(--color-primary-deep)]">
          {formatPKR(hostel.pricePerMonth)}
          <span className="text-[var(--text-body-sm)] font-[400] text-[var(--color-text-muted)]"> /mo</span>
        </p>

        {/* Rating — one star + number + count. NEVER a five-star row. */}
        {hostel.reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Star
              size={13}
              strokeWidth={1.5}
              className="text-[var(--color-primary)] fill-[var(--color-primary)] shrink-0"
              aria-hidden="true"
            />
            <span className="text-[var(--text-body-sm)] font-[500] text-[var(--color-text-body)]">
              {hostel.rating.toFixed(1)}
            </span>
            <span className="text-[var(--text-caption)] text-[var(--color-text-muted)]">
              ({hostel.reviewCount})
            </span>
          </div>
        )}

        {/* Detail chips — max 3 */}
        <div className="flex flex-wrap gap-1.5 mt-0.5">
          {chips.slice(0, 3).map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center h-6 px-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-sidebar)] text-[var(--text-caption)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
