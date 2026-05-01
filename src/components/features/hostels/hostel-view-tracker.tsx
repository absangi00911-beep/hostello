"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

interface HostelViewTrackerProps {
  hostel: {
    id: string;
    name: string;
    slug: string;
    city: string;
    pricePerMonth: number;
    coverImage?: string | null;
    rating: number;
    reviewCount: number;
    verified: boolean;
  };
}

/**
 * Client-side component that tracks hostel views.
 * - Saves to recently viewed list (localStorage)
 * - Increments viewCount via API (only on actual user views, not ISR revalidation)
 */
export function HostelViewTracker({ hostel }: HostelViewTrackerProps) {
  const { addHostel } = useRecentlyViewed();

  useEffect(() => {
    // Add to recently viewed when component mounts
    addHostel({
      id: hostel.id,
      name: hostel.name,
      slug: hostel.slug,
      city: hostel.city,
      pricePerMonth: hostel.pricePerMonth,
      coverImage: hostel.coverImage,
      rating: hostel.rating,
      reviewCount: hostel.reviewCount,
      verified: hostel.verified,
    });

    // Increment view count via API (only on real user views, not ISR revalidation)
    fetch(`/api/hostels/${hostel.slug}/view`, { method: "POST" }).catch(
      () => {}
    );
  }, [hostel.slug, addHostel]);

  // This component doesn't render anything
  return null;
}
