// Path: src/components/owner/ListingLivePreview.tsx
"use client";

import { Eye } from "lucide-react";
import { HostelCard, type HostelCardData } from "@/components/hostel/HostelCard";
import type { ListingFormData } from "./ListingFormWizard";

interface ListingLivePreviewProps {
  form: ListingFormData;
  ownerName: string;
  ownerAvatar?: string | null;
}

/**
 * Shows exactly the real HostelCard component, fed from in-progress wizard
 * state — not a separate mockup of what a card looks like. Wrapped in
 * pointer-events-none since the card's own Link points at a slug that
 * doesn't exist until the listing is actually created.
 */
export function ListingLivePreview({ form, ownerName, ownerAvatar }: ListingLivePreviewProps) {
  const previewData: HostelCardData = {
    id: "preview",
    name: form.name.trim() || "Your hostel name",
    slug: "preview",
    city: form.city || "City",
    area: form.area || null,
    pricePerMonth: Number(form.pricePerMonth) || 0,
    gender: form.gender,
    amenities: form.amenities,
    coverImage: form.coverImage || form.images[0] || null,
    images: form.images,
    verified: false,
    featured: false,
    rating: 0,
    reviewCount: 0,
    safetyScore: null,
    capacity: Number(form.capacity) || 0,
    rooms: Number(form.rooms) || 0,
    latitude: form.latitude || null,
    longitude: form.longitude || null,
    owner: { id: "preview", name: ownerName, avatar: ownerAvatar ?? null },
  };

  return (
    <div className="sticky top-6">
      <div className="mb-3 flex items-center gap-1.5 text-[var(--text-caption)] font-[600] uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
        <Eye size={13} strokeWidth={2} aria-hidden="true" />
        Live search preview
      </div>
      <div className="pointer-events-none max-w-[340px]">
        <HostelCard hostel={previewData} />
      </div>
      <p className="mt-3 max-w-[340px] text-[var(--text-caption)] text-[var(--color-text-muted)]">
        This is exactly how your listing will appear to students browsing HostelLo.
      </p>
    </div>
  );
}
