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
  MALE:   "bg-blue-50   text-blue-700   border-blue-100",
  FEMALE: "bg-pink-50   text-pink-700   border-pink-100",
  MIXED:  "bg-purple-50 text-purple-700 border-purple-100",
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

  async function handleSave() {
    if (!session) { toast.error("Sign in to save hostels"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/hostels/${hostel.slug}/favorite`, {
        method: isSaved ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error();
      setIsSaved((v) => !v);
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
      <nav className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] mb-5">
        <span>Hostels</span>
        <span>›</span>
        <span>{hostel.city}</span>
        {hostel.area && <><span>›</span><span>{hostel.area}</span></>}
      </nav>

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {hostel.verified && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-brand-700)] bg-[var(--color-brand-50)] border border-[var(--color-brand-100)] px-2.5 py-1 rounded-full">
                <BadgeCheck className="w-3.5 h-3.5" /> Verified
              </span>
            )}
            <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border", GENDER_STYLES[hostel.gender])}>
              {GENDER_LABELS[hostel.gender]}
            </span>
          </div>

          <h1
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-ink)] leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {hostel.name}
          </h1>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 pt-1">
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-xl border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition-colors"
            aria-label="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "w-10 h-10 rounded-xl border flex items-center justify-center transition-colors",
              isSaved
                ? "bg-red-50 border-red-200 text-red-500"
                : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-red-200 hover:text-red-500"
            )}
            aria-label={isSaved ? "Remove from saved" : "Save"}
          >
            <Heart className={cn("w-4 h-4", isSaved && "fill-current")} />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm">
        <div className="flex items-center gap-1.5 text-[var(--color-muted)]">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span>{hostel.area ? `${hostel.area}, ` : ""}{hostel.city}</span>
        </div>

        {hostel.reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-[var(--color-accent-500)] fill-current" />
            <span className="font-bold text-[var(--color-ink)]">{hostel.rating.toFixed(1)}</span>
            <span className="text-[var(--color-muted)]">({hostel.reviewCount} review{hostel.reviewCount !== 1 ? "s" : ""})</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[var(--color-muted)]">
          <Users className="w-4 h-4" />
          <span>{hostel.capacity} beds total</span>
        </div>

        {favoritesCount > 0 && (
          <div className="flex items-center gap-1.5 text-[var(--color-muted)]">
            <Heart className="w-4 h-4" />
            <span>{favoritesCount} saved</span>
          </div>
        )}
      </div>

      {/* Price pill */}
      <div className="mt-6 inline-flex items-baseline gap-1 px-5 py-3 rounded-2xl bg-[var(--color-ink)] text-white">
        <span
          className="text-2xl font-extrabold"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {formatPrice(hostel.pricePerMonth)}
        </span>
        <span className="text-sm text-white/60">/ month</span>
        {hostel.minStay > 1 && (
          <span className="ml-2 text-xs text-white/50">
            · min {hostel.minStay} month{hostel.minStay !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Description */}
      <div className="mt-7 space-y-3">
        {hostel.description.split("\n").map((para, i) => (
          <p key={i} className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}
