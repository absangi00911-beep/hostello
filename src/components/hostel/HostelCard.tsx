// Path: src/components/hostel/HostelCard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShieldCheck, Star, Mars, Venus, Equal } from "lucide-react";
import { formatPKR } from "@/components/ui/shared";
import { ShareButton } from "@/components/hostel/ShareButton";
import { cn } from "@/lib/utils";

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
  safetyScore?: number | null;
  capacity: number;
  rooms: number;
  latitude?: number | null;
  longitude?: number | null;
  owner: { id: string; name: string; avatar?: string | null };
}

const GENDER_LABELS = {
  MALE:   { label: "Male only",   icon: Mars },
  FEMALE: { label: "Female only", icon: Venus },
  MIXED:  { label: "Mixed",       icon: Equal },
} as const;

interface HostelCardProps {
  hostel: HostelCardData;
  /** Compact horizontal layout — used in favorites lists */
  compact?: boolean;
  priority?: boolean;
  /**
   * Optional controlled favorite state. Omit both this and onToggleFavorite
   * and the heart still works, purely as a local, non-persisted toggle —
   * no call site wires it to the real /api/hostels/[id]/favorite endpoint
   * yet, and that's a logic change for its own chunk, not a styling one.
   * Pass both once a page is ready to own the real favorited state.
   */
  isFavorited?: boolean;
  onToggleFavorite?: (hostelId: string) => void;
}

export function HostelCard({
  hostel,
  compact = false,
  priority = false,
  isFavorited,
  onToggleFavorite,
}: HostelCardProps) {
  const coverSrc = hostel.coverImage ?? hostel.images[0] ?? null;
  const GenderIcon = GENDER_LABELS[hostel.gender].icon;
  const genderLabel = GENDER_LABELS[hostel.gender].label;

  const galleryImages = hostel.images.length > 0 ? hostel.images : coverSrc ? [coverSrc] : [];
  const [activeImage, setActiveImage] = useState(0);
  const activeSrc = galleryImages[activeImage] ?? coverSrc ?? null;

  const [localFavorited, setLocalFavorited] = useState(false);
  const favorited = isFavorited ?? localFavorited;

  function handleFavoriteClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(hostel.id);
    } else {
      setLocalFavorited((v) => !v);
    }
  }

  // Hover-scrub previews other photos while keeping the full card a single link.
  function handleImageMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (galleryImages.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const index = Math.min(galleryImages.length - 1, Math.max(0, Math.floor(ratio * galleryImages.length)));
    setActiveImage(index);
  }
  function handleImageMouseLeave() {
    setActiveImage(0);
  }

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
        className="hostel-card-link group flex gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-3 no-underline transition-shadow duration-[var(--transition-base)] hover:no-underline hover:shadow-[var(--shadow-sm)]"
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
              <GenderIcon size={20} strokeWidth={1.5} className="text-[color:var(--color-text-muted)]" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-[length:var(--text-body-sm)] font-[600] text-[color:var(--color-text-heading)]"
>
            {hostel.name}
          </p>
          <p className="text-[length:var(--text-caption)] text-[color:var(--color-text-muted)] mt-0.5">
            {hostel.city}{hostel.area ? `, ${hostel.area}` : ""}
          </p>
          <p className="text-[length:var(--text-body-sm)] font-[700] text-[color:var(--color-primary-deep)] mt-1">
            {formatPKR(hostel.pricePerMonth)}<span className="font-[400] text-[color:var(--color-text-muted)]">/mo</span>
          </p>
        </div>
      </Link>
    );
  }

  return (
    <div className="group relative">
      <Link
        href={`/hostels/${hostel.slug}`}
        className="hostel-card-link block no-underline hover:no-underline"
        aria-label={`${hostel.name} — ${formatPKR(hostel.pricePerMonth)} per month`}
      >
        {/* Photo — the hero. No overlay text, no gradient wash; badges
            carry their own contrast so the image stays clean. */}
        <div
          className="relative aspect-[1.14] overflow-hidden rounded-tl-[44px] rounded-tr-[8px] rounded-br-[8px] rounded-bl-[8px] bg-[var(--color-bg-overlay)] ring-1 ring-inset ring-black/[0.035] transition-[box-shadow] duration-[var(--transition-medium)] group-hover:shadow-[var(--shadow-lg)]"
          onMouseMove={handleImageMouseMove}
          onMouseLeave={handleImageMouseLeave}
        >
          {activeSrc ? (
            <Image
              src={activeSrc}
              alt={hostel.name}
              fill
              priority={priority}
              className="object-cover transition-transform duration-[var(--transition-slow)] group-hover:scale-[1.045]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <GenderIcon size={32} strokeWidth={1.5} className="text-[color:var(--color-text-muted)]" aria-hidden="true" />
            </div>
          )}

          {/* Status badges — top-left only, so the heart owns top-right */}
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {hostel.verified ? (
              <span className="inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-[var(--color-success-bg)] px-2.5 py-1 text-[10px] font-[700] uppercase tracking-[0.04em] text-[color:var(--color-success-text)]">
                <ShieldCheck size={11} strokeWidth={1.5} aria-hidden="true" />
                Verified
              </span>
            ) : (
              <span className="rounded-[var(--radius-full)] bg-[var(--color-bg-card)] px-2.5 py-1 text-[10px] font-[700] uppercase tracking-[0.04em] text-[color:var(--color-text-muted)]">
                New
              </span>
            )}
            {hostel.featured && (
              <span className="rounded-[var(--radius-full)] bg-[var(--color-primary)] px-2.5 py-1 text-[10px] font-[700] uppercase tracking-[0.04em] text-[color:var(--color-text-inverse)]">
                Featured
              </span>
            )}
          </div>

          {/* Photo position — visual only, not a click target (see handleImageMouseMove) */}
          {galleryImages.length > 1 && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-1"
              aria-hidden="true"
            >
              {galleryImages.slice(0, 6).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-[var(--radius-full)] transition-all duration-150",
                    i === activeImage ? "w-3 bg-white" : "w-1.5 bg-white/60"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Editorial listing details sit below the photo for easy scanning. */}
        <div className="space-y-2 pt-3.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="hostel-card-title line-clamp-2 min-h-[2.3em] font-display text-[1.3rem] font-[600] leading-tight tracking-[-0.02em] text-[color:var(--color-text-heading)]">
              {hostel.name}
            </h3>
            {hostel.reviewCount > 0 && (
              <span className="flex shrink-0 items-center gap-1 pt-0.5 text-[length:var(--text-body-sm)] text-[color:var(--color-text-heading)]">
                <Star size={13} strokeWidth={1.8} className="fill-[var(--color-primary)] text-[color:var(--color-primary)]" aria-hidden="true" />
                <span className="font-[600]">{hostel.rating.toFixed(1)}</span>
              </span>
            )}
          </div>

          <p className="truncate text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
            {hostel.city}
            {hostel.area ? ` • ${hostel.area}` : ""}
            {hostel.reviewCount > 0 && ` • ${hostel.reviewCount} review${hostel.reviewCount !== 1 ? "s" : ""}`}
          </p>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 font-mono text-[9px] font-[500] uppercase tracking-[0.1em] text-[color:var(--color-text-muted)]">
            {chips.slice(0, 3).map((chip, index) => (
              <span key={chip} className="inline-flex items-center gap-2">
                {index > 0 && <span className="text-[color:var(--color-primary)]" aria-hidden="true">·</span>}
                {chip}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1.5">
            <p className="font-display text-[1.3rem] font-[600] leading-none text-[color:var(--color-text-heading)]">
              {formatPKR(hostel.pricePerMonth)}
              <span className="text-[length:var(--text-body-sm)] font-[400] text-[color:var(--color-text-muted)]"> /mo</span>
            </p>

            {hostel.safetyScore != null && hostel.safetyScore > 0 && (
              <span className="flex items-center gap-1 text-[length:var(--text-body-sm)] text-[color:var(--color-text-muted)]">
                <ShieldCheck size={13} strokeWidth={1.6} className="text-[color:var(--color-success)]" aria-hidden="true" />
                Safety {hostel.safetyScore.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Heart + Share sit outside the <Link> deliberately — a <button>
          nested inside an <a> is invalid HTML, and this mirrors the
          pattern ShareButton already used before today. */}
      <button
        type="button"
        onClick={handleFavoriteClick}
        aria-pressed={favorited}
        aria-label={favorited ? `Remove ${hostel.name} from favorites` : `Save ${hostel.name}`}
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-bg-card)] text-[color:var(--color-text-heading)] shadow-[var(--shadow-xs)] transition-transform duration-[var(--transition-fast)] hover:scale-110 active:scale-90"
      >
        <Heart
          size={16}
          strokeWidth={2}
          className={favorited ? "fill-[var(--color-primary)] text-[color:var(--color-primary)]" : ""}
          aria-hidden="true"
        />
      </button>

      <ShareButton
        url={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://hostello.pk"}/hostels/${hostel.slug}`}
        name={hostel.name}
        price={hostel.pricePerMonth}
        variant="card"
      />

    </div>
  );
}
