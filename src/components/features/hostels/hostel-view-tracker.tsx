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
 * Add this to the hostel detail page to automatically save to recently viewed.
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
  }, [hostel.id, addHostel]);

  // This component doesn't render anything
  return null;
}
