"use client";

import { BadgeCheck, MapPin, Star, Users, Heart, Share2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { cn, formatPrice } from "@/lib/utils";
import type { Hostel } from "@prisma/client";

const GENDER_LABELS: Record<string, string> = {
  MALE: "Boys only", FEMALE: "Girls only", MIXED: "Mixed",
};

const GENDER_STYLES: Record<string, string> = {
  MALE:   "bg-[var(--color-gender-male-bg)]   text-[var(--color-gender-male-text)]   border-[var(--color-gender-male-border)]",
  FEMALE: "bg-[var(--color-gender-female-bg)]   text-[var(--color-gender-female-text)]   border-[var(--color-gender-female-border)]",
  MIXED:  "bg-[var(--color-gender-mixed-bg)] text-[var(--color-gender-mixed-text)] border-[var(--color-gender-mixed-border)]",
};

interface HostelInfoProps {
  hostel: Hostel;
  favoritesCount: number;
  initialIsSaved?: boolean;
}

export function HostelInfo({ hostel, favoritesCount, initialIsSaved = false }: HostelInfoProps) {
  const { data: session } = useSession();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(favoritesCount);

  async function handleSave() {
    if (!session) { toast.error("Sign in to save hostels"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/hostels/${hostel.slug}/favorite`, {
        method: isSaved ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error();
      setIsSaved((v) => !v);
      // Optimistically update the count
      setSavedCount((prev) => isSaved ? prev - 1 : prev + 1);
      toast.success(isSaved ? "Removed from saved" : "Saved");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleShare() {
    try {
      await navigator.share({ title: hostel.name, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] mb-6 font-medium">
        <span>Hostels</span>
        <span className="text-[var(--color-border)]">›</span>
        <span>{hostel.city}</span>
        {hostel.area && <><span className="text-[var(--color-border)]">›</span><span>{hostel.area}</span></>}
      </nav>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {hostel.verified && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-[var(--color-brand-700)] bg-[var(--color-brand-100)] border border-[var(--color-brand-200)] rounded-lg">
                <BadgeCheck className="w-4 h-4" /> Verified
              </span>
            )}
            <span className={cn("px-3 py-1.5 text-sm font-bold rounded-lg border", GENDER_STYLES[hostel.gender])}>
              {GENDER_LABELS[hostel.gender]}
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl font-extrabold text-[var(--color-ink)] leading-tight mb-3"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {hostel.name}
          </h1>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 pt-1">
          <button
            onClick={handleShare}
            className="w-11 h-11 rounded-lg border border-[var(--color-border)] flex items-center justify-center text-[var(--color-ink-muted)] hover:border-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] hover:bg-[var(--color-brand-50)] transition-colors"
            aria-label="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "w-11 h-11 rounded-lg border flex items-center justify-center transition-colors",
              isSaved
                ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
                : "border-[var(--color-border)] text-[var(--color-ink-muted)] hover:border-red-200 hover:text-red-500 hover:bg-red-50"
            )}
            aria-label={isSaved ? "Remove from saved" : "Save"}
          >
            <Heart className={cn("w-5 h-5", isSaved && "fill-current")} />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-6 border-y border-[var(--color-border)]">
        <div className="flex items-center gap-2 text-base text-[var(--color-ink)]">
          <MapPin className="w-5 h-5 flex-shrink-0 text-[var(--color-brand-600)]" />
          <span className="font-medium">{hostel.area ? `${hostel.area}, ` : ""}{hostel.city}</span>
        </div>

        {hostel.reviewCount > 0 && (
          <div className="flex items-center gap-2 bg-[var(--color-brand-50)] px-3 py-1.5 rounded-lg border border-[var(--color-brand-100)]">
            <Star className="w-5 h-5 text-[var(--color-accent-500)] fill-current" />
            <span className="font-bold text-[var(--color-ink)]">{hostel.rating.toFixed(1)}</span>
            <span className="text-sm text-[var(--color-ink-muted)]">{hostel.reviewCount} review{hostel.reviewCount !== 1 ? "s" : ""}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-base text-[var(--color-ink)]">
          <Users className="w-5 h-5 flex-shrink-0 text-[var(--color-brand-600)]" />
          <span className="font-medium">{hostel.capacity} beds</span>
        </div>

        {favoritesCount > 0 && (
          <div className="flex items-center gap-2 text-base text-[var(--color-ink)]">
            <Heart className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span className="font-medium">{savedCount} saved</span>
          </div>
        )}
      </div>

      {/* Price and info section */}
      <div className="mt-6 space-y-4">
        <div className="inline-flex items-baseline gap-2 px-5 py-3 rounded-xl bg-[var(--color-brand-600)] text-white font-bold">
          <span
            className="text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {formatPrice(hostel.pricePerMonth)}
          </span>
          <span className="text-base text-white/70">/ month</span>
          {hostel.minStay > 1 && (
            <span className="ml-2 text-sm text-white/60">
              (min {hostel.minStay} month{hostel.minStay !== 1 ? "s" : ""})
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mt-8 space-y-4">
        {hostel.description.split("\n").map((para, i) => (
          <p key={i} className="text-base text-[var(--color-ink-soft)] leading-relaxed">
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}
