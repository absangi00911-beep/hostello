"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Users, BadgeCheck, GitCompareArrows } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { AMENITY_MAP } from "@/config/amenities";
import { useCompareStore } from "@/stores/compare";

interface HostelCardProps {
  hostel: {
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
    rating: number;
    reviewCount: number;
    owner: { id: string; name: string; avatar?: string | null };
  };
  className?: string;
}

const GENDER_LABELS: Record<string, string> = {
  MALE: "Boys", FEMALE: "Girls", MIXED: "Mixed",
};

const GENDER_STYLES: Record<string, string> = {
  MALE:   "bg-blue-50   text-blue-700   border-blue-100",
  FEMALE: "bg-pink-50   text-pink-700   border-pink-100",
  MIXED:  "bg-purple-50 text-purple-700 border-purple-100",
};

export function HostelCard({ hostel, className }: HostelCardProps) {
  const { toggle, has, isFull } = useCompareStore();

  const image       = hostel.coverImage ?? hostel.images[0];
  const isComparing = has(hostel.slug);
  const topAmenities = hostel.amenities.slice(0, 3).map((id) => AMENITY_MAP[id]).filter(Boolean);

  return (
    <article
      className={cn(
        "group relative bg-[var(--color-surface)] rounded-2xl overflow-hidden border border-[var(--color-border)] card-hover",
        className
      )}
    >
      {/* ── Image ── */}
      <Link
        href={`/hostels/${hostel.slug}`}
        className="block relative h-[200px] overflow-hidden bg-[var(--color-ground)]"
      >
        {image ? (
          <Image
            src={image}
            alt={hostel.name}
            fill
            sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--color-faint)]">
            <Users className="w-10 h-10" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {hostel.verified && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/95 backdrop-blur-sm text-xs font-bold text-[var(--color-brand-700)]">
              <BadgeCheck className="w-3 h-3" /> Verified
            </span>
          )}
          <span className={cn("px-2 py-1 rounded-lg text-xs font-bold border", GENDER_STYLES[hostel.gender])}>
            {GENDER_LABELS[hostel.gender]}
          </span>
        </div>

        {/* Compare toggle — ALWAYS visible on mobile (not hover-only).
          On desktop it stays hidden until hover, but on touch devices the
          hover state is never triggered so we make it permanently visible
          for screens ≤ md.
        */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggle({ slug: hostel.slug, name: hostel.name, image: image ?? null });
          }}
          disabled={!isComparing && isFull()}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center transition-all",
            isComparing
              ? "bg-[var(--color-brand-500)] text-[var(--color-ink)]"
              : // Always show on mobile (sm:), hide until hover on larger screens
                "bg-white/90 backdrop-blur-sm text-[var(--color-muted)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-white"
          )}
          title={!isComparing && isFull() ? "Compare list is full" : isComparing ? "Remove from compare" : "Add to compare"}
          aria-label="Toggle compare"
        >
          <GitCompareArrows className="w-4 h-4" />
        </button>
      </Link>

      {/* ── Body ── */}
      <Link href={`/hostels/${hostel.slug}`} className="block p-4">

        {/* Location */}
        <div className="flex items-center gap-1 text-xs text-[var(--color-muted)] mb-1.5">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">
            {hostel.area ? `${hostel.area}, ` : ""}{hostel.city}
          </span>
        </div>

        {/* Name */}
        <h3
          className="font-bold text-[var(--color-ink)] line-clamp-2 leading-snug text-[15px] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {hostel.name}
        </h3>

        {/* Rating */}
        {hostel.reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <Star className="w-3.5 h-3.5 text-[var(--color-accent-500)] fill-current" />
            <span className="text-sm font-bold text-[var(--color-ink)]">
              {hostel.rating.toFixed(1)}
            </span>
            <span className="text-xs text-[var(--color-muted)]">
              ({hostel.reviewCount})
            </span>
          </div>
        )}

        {/* Amenities */}
        {topAmenities.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {topAmenities.map((a) => (
              <span
                key={a.id}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[var(--color-ground)] border border-[var(--color-border)] text-xs text-[var(--color-muted)]"
              >
                <span>{a.emoji}</span>
                <span className="hidden sm:inline">{a.label}</span>
              </span>
            ))}
            {hostel.amenities.length > 3 && (
              <span className="text-xs text-[var(--color-muted)]">+{hostel.amenities.length - 3}</span>
            )}
          </div>
        )}

        {/* Price row */}
        <div className="flex items-end justify-between pt-3 border-t border-[var(--color-border)]">
          <div>
            <span
              className="text-xl font-extrabold text-[var(--color-ink)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {formatPrice(hostel.pricePerMonth)}
            </span>
            <span className="text-xs text-[var(--color-muted)] ml-1">/ month</span>
          </div>
          <span className="text-xs font-semibold text-[var(--color-brand-700)] group-hover:underline">
            View →
          </span>
        </div>
      </Link>
    </article>
  );
}

export function HostelCardSkeleton() {
  return (
    <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden border border-[var(--color-border)]">
      <div className="h-[200px] skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-24 skeleton rounded" />
        <div className="h-5 w-3/4 skeleton rounded" />
        <div className="h-3.5 w-16 skeleton rounded" />
        <div className="flex gap-2">
          {[1,2,3].map((i) => <div key={i} className="h-6 w-16 skeleton rounded-lg" />)}
        </div>
        <div className="h-px w-full skeleton mt-3" />
        <div className="flex justify-between">
          <div className="h-6 w-28 skeleton rounded" />
          <div className="h-4 w-12 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}
