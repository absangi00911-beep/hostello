"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, Users, BadgeCheck, GitCompareArrows, Sparkles, MessageSquare } from "lucide-react";
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
    createdAt: Date | string;
    owner: { id: string; name: string; avatar?: string | null };
  };
  className?: string;
}

function isNewListing(createdAt: Date | string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const daysOld = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return daysOld <= 7;
}

const GENDER_LABELS: Record<string, string> = {
  MALE: "Boys", FEMALE: "Girls", MIXED: "Mixed",
};

const GENDER_STYLES: Record<string, string> = {
  MALE:   "bg-[var(--color-gender-male-bg)]   text-[var(--color-gender-male-text)]   border-[var(--color-gender-male-border)]",
  FEMALE: "bg-[var(--color-gender-female-bg)]   text-[var(--color-gender-female-text)]   border-[var(--color-gender-female-border)]",
  MIXED:  "bg-[var(--color-gender-mixed-bg)] text-[var(--color-gender-mixed-text)] border-[var(--color-gender-mixed-border)]",
};

export function HostelCard({ hostel, className }: HostelCardProps) {
  const { toggle, has, isFull } = useCompareStore();

  const image       = hostel.coverImage ?? hostel.images[0];
  const isComparing = has(hostel.slug);

  // Build a plain-text amenity summary: "WiFi · Meals · Study Room"
  // Labels only — no emojis, no chips. Card's job is to get clicks, not list specs.
  const amenitySummary = hostel.amenities
    .slice(0, 3)
    .map((id) => AMENITY_MAP[id]?.label)
    .filter(Boolean)
    .join(" · ");
  const extraCount = hostel.amenities.length > 3 ? hostel.amenities.length - 3 : 0;

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
            // Scale removed — the card lift (globals.css card-hover) is sufficient
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--color-faint)]">
            <Users className="w-10 h-10" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {hostel.verified && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white shadow-sm text-sm font-bold text-[var(--color-brand-700)]">
              <BadgeCheck className="w-4 h-4" /> Verified
            </span>
          )}
          <span className={cn("px-3 py-1.5 rounded-lg text-sm font-bold border", GENDER_STYLES[hostel.gender])}>
            {GENDER_LABELS[hostel.gender]}
          </span>
        </div>

        {/* Compare toggle */}
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
              : "bg-white/90 backdrop-blur-sm text-[var(--color-muted)] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-white"
          )}
          aria-label={!isComparing && isFull() ? "Compare list is full" : isComparing ? "Remove from compare" : "Add to compare"}
        >
          <GitCompareArrows className="w-4 h-4" />
        </button>
      </Link>

      {/* ── Body ── */}
      <Link href={`/hostels/${hostel.slug}`} className="block p-5 space-y-3">

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-[var(--color-ink-muted)]">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate font-medium">
            {hostel.area ? `${hostel.area}, ` : ""}{hostel.city}
          </span>
        </div>

        {/* Name */}
        <h3
          className="font-bold text-[var(--color-ink)] line-clamp-2 leading-tight text-lg"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {hostel.name}
        </h3>

        {/* Rating or Social Proof */}
        {hostel.reviewCount > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-[var(--color-accent-500)] fill-current" />
              <span className="text-base font-bold text-[var(--color-ink)]">
                {hostel.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-sm text-[var(--color-ink-muted)]">
              • {hostel.reviewCount} review{hostel.reviewCount !== 1 ? "s" : ""}
            </span>
          </div>
        ) : isNewListing(hostel.createdAt) ? (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-brand-100)] border border-[var(--color-brand-200)] w-fit">
            <Sparkles className="w-4 h-4 text-[var(--color-brand-600)]" />
            <span className="text-sm font-semibold text-[var(--color-brand-700)]">
              New listing
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-ground)] border border-[var(--color-border)] w-fit">
            <MessageSquare className="w-4 h-4 text-[var(--color-ink-muted)]" />
            <span className="text-sm font-semibold text-[var(--color-ink-muted)]">
              Be the first to review
            </span>
          </div>
        )}

        {/* Amenity summary */}
        {amenitySummary && (
          <p className="text-sm text-[var(--color-ink-muted)] truncate">
            {amenitySummary}
            {extraCount > 0 && ` · +${extraCount} more`}
          </p>
        )}

        {/* Price row */}
        <div className="flex items-end justify-between pt-3 border-t border-[var(--color-border)]">
          <div className="flex items-baseline gap-1">
            <span
              className="text-2xl font-extrabold text-[var(--color-brand-600)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {formatPrice(hostel.pricePerMonth)}
            </span>
            <span className="text-sm text-[var(--color-ink-muted)]">/ month</span>
          </div>
          <span className="text-sm font-semibold text-[var(--color-brand-600)] group-hover:text-[var(--color-brand-700)] transition-colors">
            Explore →
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
        <div className="h-3 w-48 skeleton rounded" />
        <div className="h-px w-full skeleton mt-3" />
        <div className="flex justify-between">
          <div className="h-6 w-28 skeleton rounded" />
          <div className="h-4 w-12 skeleton rounded" />
        </div>
      </div>
    </div>
  );
}